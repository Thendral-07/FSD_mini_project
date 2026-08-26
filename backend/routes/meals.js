

import { Router } from "express";
import mongoose from "mongoose";
import axios from "axios";
import auth from "../middleware/auth.js";
import CookedMeal from "../models/CookedMeal.js";
import Favorite from "../models/Favorite.js";
import SearchHistory from "../models/SearchHistory.js";
import { cacheMiddleware, clearCache } from "../middleware/cache.js";
import { mealDbCache } from "../config/cache.js";

const router = Router();

const THEMEALDB_BASE = "https://www.themealdb.com/api/json/v1/1";
const mealClient = axios.create({
  baseURL: THEMEALDB_BASE,
  timeout: 8000,
});

// Map to store in-flight promises to prevent cache stampedes (thundering herd)
const inFlightRequests = new Map();

/**
 * Executes a fetch function with both caching and in-flight deduplication.
 * If 100 users request the same key simultaneously before it's cached,
 * only 1 upstream request will be made; the other 99 will await the same promise.
 */
async function getWithDeduplication(cacheKey, fetchFn, ttlSeconds = 3600) {
  // 1. Check cache first
  const cached = mealDbCache.get(cacheKey);
  if (cached) {
    return { data: cached, cached: true };
  }

  // 2. Check if already in-flight
  if (inFlightRequests.has(cacheKey)) {
    const data = await inFlightRequests.get(cacheKey);
    return { data, cached: true }; // Treated as cached for concurrent followers
  }

  // 3. Create the promise and store it
  const promise = (async () => {
    try {
      const data = await fetchFn();
      if (data && (Array.isArray(data) ? data.length > 0 : true)) {
        mealDbCache.set(cacheKey, data, ttlSeconds);
      }
      return data;
    } finally {
      // Always cleanup the in-flight map when done (success or fail)
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, promise);
  const data = await promise;
  return { data, cached: false };
}

/**
 * Concurrency limiter helper: runs an array of task functions with max `limit` in-flight requests.
 */
async function runLimited(tasks, limit = 3) {
  const results = [];
  const executing = new Set();
  for (const task of tasks) {
    const p = Promise.resolve().then(() => task());
    results.push(p);
    executing.add(p);
    const clean = () => executing.delete(p);
    p.then(clean, clean);
    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }
  return Promise.all(results);
}

function handleMealError(err, res, context = "operation") {
  console.error(`[TheMealDB Proxy Error - ${context}]:`, err?.message || err);
  if (err?.response?.status === 429) {
    return res.status(429).json({
      error: "RATE_LIMITED",
      message: "TheMealDB rate limit reached. Please try again in a moment.",
      retryAfterSeconds: 60,
    });
  }
  if (err?.response?.status === 404) {
    return res.status(404).json({
      error: "NOT_FOUND",
      message: "Meal not found.",
    });
  }
  return res.status(502).json({
    error: "UPSTREAM_ERROR",
    message: "Failed to communicate with meal provider.",
  });
}

// ─── THEMEALDB PROXY ROUTES (PUBLIC & CACHED) ─────────────────

// GET /api/meals/lookup/:id — cached 1 hour (3600s)
router.get("/lookup/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "BAD_REQUEST", message: "Meal ID is required." });
  }

  const cacheKey = `meal_lookup_${id}`;

  try {
    const { data: meal, cached } = await getWithDeduplication(cacheKey, async () => {
      const response = await mealClient.get(`/lookup.php?i=${id}`);
      return response.data?.meals?.[0] || null;
    }, 3600);

    if (meal) {
      res.set("Cache-Control", "public, max-age=3600");
      return res.json({ meal, cached });
    }
    return res.status(404).json({ error: "NOT_FOUND", message: "Meal not found." });
  } catch (err) {
    return handleMealError(err, res, `lookup/${id}`);
  }
});

// GET /api/meals/random?count=N — concurrency-limited to 3 in-flight
router.get("/random", async (req, res) => {
  const count = Math.min(parseInt(req.query.count, 10) || 12, 24);
  const poolSize = 24; // Always fetch 24 to create a diverse pool
  const cacheKey = `random_meals_pool_${poolSize}`;
  const cached = mealDbCache.get(cacheKey);

  if (cached && cached.length >= count) {
    // Shuffle the cached pool and return exactly 'count' meals
    const shuffled = [...cached].sort(() => Math.random() - 0.5);
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    return res.json({ meals: shuffled.slice(0, count), cached: true });
  }

  try {
    const tasks = Array(poolSize).fill(0).map(() => async () => {
      try {
        const resp = await mealClient.get("/random.php");
        return resp.data?.meals?.[0] || null;
      } catch (e) {
        if (e?.response?.status === 429) throw e;
        return null;
      }
    });

    const results = await runLimited(tasks, 3);
    const validMeals = results.filter(Boolean);
    const uniqueMeals = Array.from(new Map(validMeals.map((m) => [m.idMeal, m])).values());

    // Populate lookup cache for individual meals
    uniqueMeals.forEach((meal) => {
      mealDbCache.set(`meal_lookup_${meal.idMeal}`, meal, 3600);
    });

    if (uniqueMeals.length > 0) {
      mealDbCache.set(cacheKey, uniqueMeals, 300); // 5 min pool cache
    }

    res.set("Cache-Control", "no-cache");
    const shuffled = [...uniqueMeals].sort(() => Math.random() - 0.5);
    return res.json({ meals: shuffled.slice(0, count), cached: false });
  } catch (err) {
    return handleMealError(err, res, "random");
  }
});

// GET /api/meals/filter?i=term — cached 1 hour (3600s)
router.get("/filter", async (req, res) => {
  const { i, c, a } = req.query;
  const param = i ? `i=${i}` : c ? `c=${c}` : a ? `a=${a}` : null;
  if (!param) {
    return res.status(400).json({ error: "BAD_REQUEST", message: "Filter query (i, c, or a) is required." });
  }

  const cacheKey = `meal_filter_${param.toLowerCase()}`;

  try {
    const { data: meals, cached } = await getWithDeduplication(cacheKey, async () => {
      const response = await mealClient.get(`/filter.php?${param}`);
      return response.data?.meals || [];
    }, 3600);

    res.set("Cache-Control", "public, max-age=3600");
    return res.json({ meals: meals || [], cached });
  } catch (err) {
    return handleMealError(err, res, `filter?${param}`);
  }
});

// GET /api/meals/search?s=term — cached 15 min (900s)
router.get("/search", async (req, res) => {
  const { s } = req.query;
  const query = (s || "").trim().toLowerCase();
  if (!query) {
    return res.json({ meals: [] });
  }

  const cacheKey = `meal_search_${query}`;

  try {
    const { data: meals, cached } = await getWithDeduplication(cacheKey, async () => {
      const response = await mealClient.get(`/search.php?s=${encodeURIComponent(query)}`);
      const results = response.data?.meals || [];
      // Populate individual lookup cache
      results.forEach((m) => {
        if (m?.idMeal) mealDbCache.set(`meal_lookup_${m.idMeal}`, m, 3600);
      });
      return results;
    }, 900);

    res.set("Cache-Control", "public, max-age=900");
    return res.json({ meals: meals || [], cached });
  } catch (err) {
    return handleMealError(err, res, `search?s=${query}`);
  }
});

// ─── COOKED MEALS ────────────────────────────────────────────

// POST /api/meals/cooked — mark a meal as cooked
router.post("/cooked", auth, async (req, res) => {
  try {
    const { mealId, mealName, mealThumb, category, area } = req.body;

    if (!mealId || !mealName) {
      return res.status(400).json({ error: "mealId and mealName are required." });
    }

    const cooked = await CookedMeal.create({
      userId: req.userId,
      mealId,
      mealName,
      mealThumb: mealThumb || "",
      category: category || "",
      area: area || "",
    });

    clearCache(req.userId);
    res.status(201).json({ message: "Meal marked as cooked!", cooked });
  } catch (err) {
    console.error("Cooked meal error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// GET /api/meals/history — get user's cook history
router.get("/history", auth, cacheMiddleware, async (req, res) => {
  try {
    const history = await CookedMeal.find({ userId: req.userId })
      .sort({ cookedAt: -1 })
      .limit(50);

    res.json(history);
  } catch (err) {
    console.error("History error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// ─── FAVORITES ───────────────────────────────────────────────

// POST /api/meals/favorite — toggle favorite on/off
router.post("/favorite", auth, async (req, res) => {
  try {
    const { mealId, mealName, mealThumb, category, area } = req.body;

    if (!mealId || !mealName) {
      return res.status(400).json({ error: "mealId and mealName are required." });
    }

    // Check if already favorited
    const existing = await Favorite.findOne({
      userId: req.userId,
      mealId,
    });

    if (existing) {
      // Remove favorite (toggle off)
      await Favorite.deleteOne({ _id: existing._id });
      clearCache(req.userId);
      return res.json({ message: "Removed from favorites.", favorited: false });
    }

    // Add favorite (toggle on)
    await Favorite.create({
      userId: req.userId,
      mealId,
      mealName,
      mealThumb: mealThumb || "",
      category: category || "",
      area: area || "",
    });

    clearCache(req.userId);
    res.status(201).json({ message: "Added to favorites!", favorited: true });
  } catch (err) {
    console.error("Favorite error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// GET /api/meals/favorites — get user's favorites list
router.get("/favorites", auth, cacheMiddleware, async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.userId })
      .sort({ savedAt: -1 });

    res.json(favorites);
  } catch (err) {
    console.error("Favorites error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// GET /api/meals/favorite-ids — get just the meal IDs that are favorited (for quick check)
router.get("/favorite-ids", auth, async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.userId }).select("mealId");
    const ids = favorites.map((f) => f.mealId);
    res.json(ids);
  } catch (err) {
    console.error("Favorite IDs error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// ─── SEARCH HISTORY LOG ──────────────────────────────────────

// POST /api/meals/search-log — log ingredient search
router.post("/search-log", auth, async (req, res) => {
  try {
    const { ingredients } = req.body;

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ error: "ingredients array is required." });
    }

    await SearchHistory.create({
      userId: req.userId,
      ingredients: ingredients.map((i) => i.toLowerCase().trim()),
    });

    res.status(201).json({ message: "Search logged." });
  } catch (err) {
    console.error("Search log error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// ─── STATS / ANALYTICS ──────────────────────────────────────

// GET /api/meals/stats — frequently cooked meals + frequently searched ingredients
router.get("/stats", auth, cacheMiddleware, async (req, res) => {
  try {
    // Top 5 frequently cooked meals
    const frequentlyCooked = await CookedMeal.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
      {
        $group: {
          _id: "$mealId",
          mealName: { $first: "$mealName" },
          mealThumb: { $first: "$mealThumb" },
          category: { $first: "$category" },
          area: { $first: "$area" },
          count: { $sum: 1 },
          lastCooked: { $max: "$cookedAt" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // Top 5 frequently searched ingredients
    const frequentlySearched = await SearchHistory.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
      { $unwind: "$ingredients" },
      {
        $group: {
          _id: "$ingredients",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $project: {
          ingredient: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ]);

    res.json({
      frequentlyCooked,
      frequentlySearched,
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

export default router;
