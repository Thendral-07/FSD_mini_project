import { Router } from "express";
import auth from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import CreatorRecipe from "../models/CreatorRecipe.js";
import User from "../models/User.js";

const router = Router();

// Create new recipe
router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    const { title, description, category, ingredients, instructions, prepTime, cookTime, isPublic } = req.body;
    let imageUrl = "";
    if (req.file) {
      imageUrl = req.file.path;
    }

    const recipe = await CreatorRecipe.create({
      userId: req.userId,
      title,
      description,
      imageUrl,
      category,
      ingredients: JSON.parse(ingredients || "[]"),
      instructions,
      prepTime,
      cookTime,
      isPublic: isPublic === "true"
    });
    res.status(201).json(recipe);
  } catch (err) {
    console.error("Error creating recipe:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get user's recipes
router.get("/me", auth, async (req, res) => {
  try {
    const recipes = await CreatorRecipe.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(recipes);
  } catch (err) {
    console.error("Error fetching recipes:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all public recipes
router.get("/public", async (req, res) => {
    try {
      const recipes = await CreatorRecipe.find({ isPublic: true }).sort({ createdAt: -1 });
      res.json(recipes);
    } catch (err) {
      console.error("Error fetching public recipes:", err);
      res.status(500).json({ error: "Server error" });
    }
});

// Get recipe by ID
router.get("/:id", async (req, res) => {
    try {
      const recipe = await CreatorRecipe.findById(req.params.id);
      if (!recipe) return res.status(404).json({ error: "Recipe not found" });
      res.json(recipe);
    } catch (err) {
      console.error("Error fetching recipe:", err);
      res.status(500).json({ error: "Server error" });
    }
});

// Update recipe
router.put("/:id", auth, upload.single("image"), async (req, res) => {
  try {
    const { title, description, category, ingredients, instructions, prepTime, cookTime, isPublic } = req.body;
    
    // Ensure the recipe belongs to the user
    const recipe = await CreatorRecipe.findOne({ _id: req.params.id, userId: req.userId });
    if (!recipe) return res.status(404).json({ error: "Recipe not found or unauthorized" });

    recipe.title = title;
    recipe.description = description;
    recipe.category = category;
    recipe.ingredients = JSON.parse(ingredients || "[]");
    recipe.instructions = instructions;
    recipe.prepTime = prepTime;
    recipe.cookTime = cookTime;
    recipe.isPublic = isPublic === "true";

    if (req.file) {
      recipe.imageUrl = req.file.path;
    }

    await recipe.save();
    res.json(recipe);
  } catch (err) {
    console.error("Error updating recipe:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Increment views
router.post("/:id/view", async (req, res) => {
  try {
    const recipe = await CreatorRecipe.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!recipe) return res.status(404).json({ error: "Recipe not found" });
    res.json({ views: recipe.views });
  } catch (err) {
    console.error("Error incrementing views:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Toggle Like
router.post("/:id/like", auth, async (req, res) => {
  try {
    const recipe = await CreatorRecipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ error: "Recipe not found" });

    const index = recipe.likes.indexOf(req.userId);
    if (index === -1) {
      recipe.likes.push(req.userId);
    } else {
      recipe.likes.splice(index, 1);
    }

    await recipe.save();
    res.json({ likes: recipe.likes });
  } catch (err) {
    console.error("Error toggling like:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Add comment
router.post("/:id/comments", auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: "Comment text is required" });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const recipe = await CreatorRecipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ error: "Recipe not found" });

    const newComment = {
      userId: user._id,
      userName: user.name,
      text: text.trim()
    };

    recipe.comments.push(newComment);
    await recipe.save();

    res.json({ comments: recipe.comments });
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete recipe
router.delete("/:id", auth, async (req, res) => {
    try {
      const recipe = await CreatorRecipe.findOneAndDelete({ _id: req.params.id, userId: req.userId });
      if (!recipe) return res.status(404).json({ error: "Recipe not found or unauthorized" });
      res.json({ message: "Recipe deleted successfully" });
    } catch (err) {
      console.error("Error deleting recipe:", err);
      res.status(500).json({ error: "Server error" });
    }
});

export default router;