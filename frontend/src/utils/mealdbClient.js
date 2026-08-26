/**
 * Centralized TheMealDB Client
 * Proxies all requests through backend /api/meals/... with client-side in-memory caching,
 * in-flight request de-duplication, structured MealApiError throwing, and
 * resilient client-side fallback if backend is sleeping or unreachable.
 */

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const THEMEALDB_FALLBACK = "https://www.themealdb.com/api/json/v1/1";

export class MealApiError extends Error {
  constructor(message, code = "UPSTREAM_ERROR", retryAfterSeconds = null) {
    super(message);
    this.name = "MealApiError";
    this.code = code; // "RATE_LIMITED" | "NOT_FOUND" | "UPSTREAM_ERROR" | "NETWORK"
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

class PersistentCache {
  constructor(name, ttlHours = 1) {
    this.name = `mealdb_cache_${name}`;
    this.ttl = ttlHours * 60 * 60 * 1000;
    this.memory = new Map();
    this.load();
  }
  load() {
    try {
      const stored = localStorage.getItem(this.name);
      if (stored) {
        const parsed = JSON.parse(stored);
        const now = Date.now();
        for (const [key, item] of Object.entries(parsed)) {
          if (now < item.expires) {
            this.memory.set(key, item.data);
          }
        }
      }
    } catch (e) {
      console.warn(`Failed to load cache ${this.name}`, e);
    }
  }
  save() {
    try {
      const obj = {};
      const now = Date.now();
      for (const [key, data] of this.memory.entries()) {
        obj[key] = { data, expires: now + this.ttl };
      }
      localStorage.setItem(this.name, JSON.stringify(obj));
    } catch (e) {
      console.warn(`Failed to save cache ${this.name}`, e);
    }
  }
  has(key) { return this.memory.has(key); }
  get(key) { return this.memory.get(key); }
  set(key, data) {
    this.memory.set(key, data);
    this.save();
  }
}

// In-memory caches and in-flight promises
const lookupCache = new PersistentCache("lookup", 1);
const inFlightLookups = new Map();
const filterCache = new PersistentCache("filter", 1);
const searchCache = new PersistentCache("search", 1);

async function handleResponse(res) {
  if (res.status === 429) {
    let data = {};
    try {
      data = await res.json();
    } catch {}
    throw new MealApiError(
      data.message || "TheMealDB rate limit reached. Please wait a moment.",
      "RATE_LIMITED",
      data.retryAfterSeconds || 60
    );
  }

  if (res.status === 404) {
    let data = {};
    try {
      data = await res.json();
    } catch {}
    throw new MealApiError(data.message || "Meal not found.", "NOT_FOUND");
  }

  if (!res.ok) {
    let data = {};
    try {
      data = await res.json();
    } catch {}
    throw new MealApiError(
      data.message || `Upstream service error (${res.status})`,
      "UPSTREAM_ERROR"
    );
  }

  try {
    return await res.json();
  } catch {
    throw new MealApiError("Invalid JSON received from server.", "UPSTREAM_ERROR");
  }
}

/**
 * lookupMeal(mealId)
 * Returns meal details with in-memory caching and in-flight de-duplication
 */
export async function lookupMeal(mealId) {
  if (!mealId) return null;

  const key = String(mealId);
  if (lookupCache.has(key)) {
    return lookupCache.get(key);
  }

  if (inFlightLookups.has(key)) {
    return inFlightLookups.get(key);
  }

  const promise = (async () => {
    // 1. Try Backend Proxy first
    try {
      const res = await fetch(`${API_BASE}/meals/lookup/${encodeURIComponent(key)}`);
      const data = await handleResponse(res);
      const meal = data?.meal || null;
      if (meal) {
        lookupCache.set(key, meal);
        return meal;
      }
    } catch (err) {
      if (err instanceof MealApiError && err.code === "RATE_LIMITED") throw err;
      // Backend unreachable or failed -> Fallback to direct client call
      try {
        const directRes = await fetch(`${THEMEALDB_FALLBACK}/lookup.php?i=${encodeURIComponent(key)}`);
        if (directRes.status === 429) {
          throw new MealApiError("Rate limit reached. Please try again in a moment.", "RATE_LIMITED", 60);
        }
        if (directRes.ok) {
          const directData = await directRes.json();
          const meal = directData?.meals?.[0] || null;
          if (meal) {
            lookupCache.set(key, meal);
            return meal;
          }
        }
      } catch (fallbackErr) {
        if (fallbackErr instanceof MealApiError) throw fallbackErr;
      }
      if (err instanceof MealApiError) throw err;
      throw new MealApiError(err.message || "Failed to load meal.", "NETWORK");
    } finally {
      inFlightLookups.delete(key);
    }
  })();

  inFlightLookups.set(key, promise);
  return promise;
}

/**
 * getRandomMeals(count)
 * Fetches concurrency-controlled random meals from backend with fallback
 */
export async function getRandomMeals(count = 12) {
  // 1. Try Backend Proxy
  try {
    const res = await fetch(`${API_BASE}/meals/random?count=${count}&t=${Date.now()}`);
    const data = await handleResponse(res);
    const meals = data?.meals || [];
    if (meals.length > 0) {
      meals.forEach((m) => {
        if (m?.idMeal) lookupCache.set(String(m.idMeal), m);
      });
      return meals;
    }
  } catch (err) {
    if (err instanceof MealApiError && err.code === "RATE_LIMITED") throw err;
  }

  // 2. Direct Fallback if backend is sleeping or on Vercel without active backend
  try {
    const directPromises = Array(count)
      .fill(0)
      .map(() =>
        fetch(`${THEMEALDB_FALLBACK}/random.php`)
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => d?.meals?.[0] || null)
          .catch(() => null)
      );
    const results = await Promise.all(directPromises);
    const valid = results.filter(Boolean);
    const uniqueMeals = Array.from(new Map(valid.map((m) => [m.idMeal, m])).values());
    uniqueMeals.forEach((m) => {
      if (m?.idMeal) lookupCache.set(String(m.idMeal), m);
    });
    return uniqueMeals;
  } catch (err) {
    throw new MealApiError("Failed to fetch random meals.", "NETWORK");
  }
}

/**
 * filterByIngredient(term)
 * Filters meals by ingredient with fallback
 */
export async function filterByIngredient(term) {
  if (!term || !term.trim()) return [];
  const clean = term.trim().toLowerCase();

  if (filterCache.has(clean)) {
    return filterCache.get(clean);
  }

  // 1. Try Backend Proxy
  try {
    const res = await fetch(`${API_BASE}/meals/filter?i=${encodeURIComponent(clean)}`);
    const data = await handleResponse(res);
    const meals = data?.meals || [];
    filterCache.set(clean, meals);
    return meals;
  } catch (err) {
    if (err instanceof MealApiError && err.code === "RATE_LIMITED") throw err;
  }

  // 2. Direct Fallback
  try {
    const directRes = await fetch(`${THEMEALDB_FALLBACK}/filter.php?i=${encodeURIComponent(clean)}`);
    if (directRes.status === 429) {
      throw new MealApiError("Rate limit reached. Please try again in a moment.", "RATE_LIMITED", 60);
    }
    if (directRes.ok) {
      const directData = await directRes.json();
      const meals = directData?.meals || [];
      filterCache.set(clean, meals);
      return meals;
    }
  } catch (err) {
    if (err instanceof MealApiError) throw err;
    throw new MealApiError("Failed to filter meals.", "NETWORK");
  }
  return [];
}

/**
 * searchMealsByName(term)
 * Searches meals by name with fallback
 */
export async function searchMealsByName(term) {
  if (!term || !term.trim()) return [];
  const clean = term.trim().toLowerCase();

  if (searchCache.has(clean)) {
    return searchCache.get(clean);
  }

  // 1. Try Backend Proxy
  try {
    const res = await fetch(`${API_BASE}/meals/search?s=${encodeURIComponent(clean)}`);
    const data = await handleResponse(res);
    const meals = data?.meals || [];
    meals.forEach((m) => {
      if (m?.idMeal) lookupCache.set(String(m.idMeal), m);
    });
    searchCache.set(clean, meals);
    return meals;
  } catch (err) {
    if (err instanceof MealApiError && err.code === "RATE_LIMITED") throw err;
  }

  // 2. Direct Fallback
  try {
    const directRes = await fetch(`${THEMEALDB_FALLBACK}/search.php?s=${encodeURIComponent(clean)}`);
    if (directRes.status === 429) {
      throw new MealApiError("Rate limit reached. Please try again in a moment.", "RATE_LIMITED", 60);
    }
    if (directRes.ok) {
      const directData = await directRes.json();
      const meals = directData?.meals || [];
      meals.forEach((m) => {
        if (m?.idMeal) lookupCache.set(String(m.idMeal), m);
      });
      searchCache.set(clean, meals);
      return meals;
    }
  } catch (err) {
    if (err instanceof MealApiError) throw err;
    throw new MealApiError("Failed to search meals.", "NETWORK");
  }
  return [];
}
