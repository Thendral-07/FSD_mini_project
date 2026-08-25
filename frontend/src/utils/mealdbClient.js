/**
 * Centralized TheMealDB Client
 * Proxies all requests through backend /api/meals/... with client-side in-memory caching,
 * in-flight request de-duplication, and structured MealApiError throwing.
 */

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export class MealApiError extends Error {
  constructor(message, code = "UPSTREAM_ERROR", retryAfterSeconds = null) {
    super(message);
    this.name = "MealApiError";
    this.code = code; // "RATE_LIMITED" | "NOT_FOUND" | "UPSTREAM_ERROR" | "NETWORK"
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

// In-memory caches and in-flight promises
const lookupCache = new Map();
const inFlightLookups = new Map();
const filterCache = new Map();
const searchCache = new Map();

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
    try {
      const res = await fetch(`${API_BASE}/meals/lookup/${encodeURIComponent(key)}`);
      const data = await handleResponse(res);
      const meal = data?.meal || null;
      if (meal) {
        lookupCache.set(key, meal);
      }
      return meal;
    } catch (err) {
      if (err instanceof MealApiError) throw err;
      throw new MealApiError(err.message || "Network error.", "NETWORK");
    } finally {
      inFlightLookups.delete(key);
    }
  })();

  inFlightLookups.set(key, promise);
  return promise;
}

/**
 * getRandomMeals(count)
 * Fetches concurrency-controlled random meals from backend
 */
export async function getRandomMeals(count = 12) {
  try {
    const res = await fetch(`${API_BASE}/meals/random?count=${count}`);
    const data = await handleResponse(res);
    const meals = data?.meals || [];
    meals.forEach((m) => {
      if (m?.idMeal) lookupCache.set(String(m.idMeal), m);
    });
    return meals;
  } catch (err) {
    if (err instanceof MealApiError) throw err;
    throw new MealApiError(err.message || "Network error.", "NETWORK");
  }
}

/**
 * filterByIngredient(term)
 * Filters meals by ingredient
 */
export async function filterByIngredient(term) {
  if (!term || !term.trim()) return [];
  const clean = term.trim().toLowerCase();

  if (filterCache.has(clean)) {
    return filterCache.get(clean);
  }

  try {
    const res = await fetch(`${API_BASE}/meals/filter?i=${encodeURIComponent(clean)}`);
    const data = await handleResponse(res);
    const meals = data?.meals || [];
    filterCache.set(clean, meals);
    return meals;
  } catch (err) {
    if (err instanceof MealApiError) throw err;
    throw new MealApiError(err.message || "Network error.", "NETWORK");
  }
}

/**
 * searchMealsByName(term)
 * Searches meals by name
 */
export async function searchMealsByName(term) {
  if (!term || !term.trim()) return [];
  const clean = term.trim().toLowerCase();

  if (searchCache.has(clean)) {
    return searchCache.get(clean);
  }

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
    if (err instanceof MealApiError) throw err;
    throw new MealApiError(err.message || "Network error.", "NETWORK");
  }
}
