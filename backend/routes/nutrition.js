import { Router } from "express";
import auth from "../middleware/auth.js";
import NutritionLog from "../models/NutritionLog.js";

const router = Router();

// Get all nutrition logs (for charts from day 1)
router.get("/all", auth, async (req, res) => {
    try {
      const logs = await NutritionLog.find({ userId: req.userId })
        .sort({ date: 1 }); // Sort ascending so Day 1 is first
      res.json(logs);
    } catch (err) {
      console.error("Error fetching all nutrition logs:", err);
      res.status(500).json({ error: "Server error" });
    }
});

// Get nutrition for a specific date
router.get("/:date", auth, async (req, res) => {
  try {
    let log = await NutritionLog.findOne({ userId: req.userId, date: req.params.date });
    if (!log) {
      log = await NutritionLog.create({ userId: req.userId, date: req.params.date });
    }
    res.json(log);
  } catch (err) {
    console.error("Error fetching nutrition log:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Update nutrition for a specific date
router.put("/:date", auth, async (req, res) => {
  try {
    const { calories, protein, carbs, fat } = req.body;
    const log = await NutritionLog.findOneAndUpdate(
      { userId: req.userId, date: req.params.date },
      { $set: { calories, protein, carbs, fat, updatedAt: Date.now() } },
      { new: true, upsert: true }
    );
    res.json(log);
  } catch (err) {
    console.error("Error updating nutrition log:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get recent nutrition logs (for charts)
router.get("/recent/:days", auth, async (req, res) => {
    try {
      const days = parseInt(req.params.days) || 7;
      const logs = await NutritionLog.find({ userId: req.userId })
        .sort({ date: -1 })
        .limit(days);
      res.json(logs);
    } catch (err) {
      console.error("Error fetching recent nutrition logs:", err);
      res.status(500).json({ error: "Server error" });
    }
});

export default router;
