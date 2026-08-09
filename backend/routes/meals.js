

import { Router } from "express";
import mongoose from "mongoose";
import auth from "../middleware/auth.js";
import CookedMeal from "../models/CookedMeal.js";
import Favorite from "../models/Favorite.js";
import SearchHistory from "../models/SearchHistory.js";
import { cacheMiddleware, clearCache } from "../middleware/cache.js";

const router = Router();

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
