import { Router } from "express";
import auth from "../middleware/auth.js";
import MealPlan from "../models/MealPlan.js";

const router = Router();

// Get meal plan for a specific date (or week)
router.get("/:date", auth, async (req, res) => {
  try {
    let plan = await MealPlan.findOne({ userId: req.userId, date: req.params.date });
    if (!plan) {
      plan = await MealPlan.create({ userId: req.userId, date: req.params.date, meals: { breakfast: [], lunch: [], dinner: [], snacks: [] } });
    }
    res.json(plan);
  } catch (err) {
    console.error("Error fetching meal plan:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Update meal plan for a specific date
router.put("/:date", auth, async (req, res) => {
  try {
    const { meals } = req.body; // Expecting an object with breakfast, lunch, dinner, snacks
    const plan = await MealPlan.findOneAndUpdate(
      { userId: req.userId, date: req.params.date },
      { $set: { meals, updatedAt: Date.now() } },
      { new: true, upsert: true }
    );
    res.json(plan);
  } catch (err) {
    console.error("Error updating meal plan:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
