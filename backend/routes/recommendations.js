import { Router } from "express";
import auth from "../middleware/auth.js";
import UserProfile from "../models/UserProfile.js";
import axios from "axios";
import cache from "../config/cache.js";

const router = Router();

// Get rule-based diet recommendations
router.get("/daily", auth, async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ userId: req.userId });
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const { fitnessGoal, dietaryPreferences } = profile;
    
    // Enhanced logic: collect multiple matching categories
    let recommendedCategories = [];
    
    if (fitnessGoal === "Weight Loss") {
      recommendedCategories.push({ cat: "Chicken", reason: "Lean protein for weight loss" });
      recommendedCategories.push({ cat: "Seafood", reason: "Low calorie seafood option" });
      recommendedCategories.push({ cat: "Vegetarian", reason: "High fiber vegetable meals" });
    } else if (fitnessGoal === "Muscle Building") {
      recommendedCategories.push({ cat: "Beef", reason: "High protein for muscle building" });
      recommendedCategories.push({ cat: "Chicken", reason: "Lean protein for muscle building" });
    } else {
      // Maintenance or Weight Gain
      recommendedCategories.push({ cat: "Beef", reason: "Nutrient dense meal" });
      recommendedCategories.push({ cat: "Pasta", reason: "Carb rich for energy" });
    }

    // Override or add based on hard dietary preferences
    if (dietaryPreferences && dietaryPreferences.length > 0) {
      const prefs = dietaryPreferences.map(p => p.toLowerCase());
      if (prefs.includes("vegetarian") || prefs.includes("vegan")) {
        recommendedCategories = [{ cat: "Vegetarian", reason: "Matches your vegetarian preference" }, { cat: "Vegan", reason: "Matches your vegan preference" }];
      }
      if (prefs.includes("seafood")) {
        recommendedCategories.push({ cat: "Seafood", reason: "Matches your seafood preference" });
      }
    }

    // Fetch from TheMealDB for all selected categories
    let allSuggestions = [];
    
    for (const item of recommendedCategories) {
      const cacheKey = `recommendation_${item.cat}`;
      let meals = cache.get(cacheKey);

      if (!meals) {
          try {
            const response = await axios.get(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${item.cat}`);
            meals = response.data.meals || [];
            cache.set(cacheKey, meals, 3600); // cache for 1 hour
          } catch(e) {
            meals = [];
          }
      }
      
      // Pick 3 random from this category
      const randomSubset = meals.sort(() => 0.5 - Math.random()).slice(0, 3);
      randomSubset.forEach(meal => {
        allSuggestions.push({
          reason: item.reason,
          meal
        });
      });
    }

    // Shuffle final results and take top 10
    const suggestions = allSuggestions.sort(() => 0.5 - Math.random()).slice(0, 10);

    res.json({
        category: recommendedCategories.map(c => c.cat).join(", "),
        suggestions
    });
  } catch (err) {
    console.error("Error generating recommendations:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
