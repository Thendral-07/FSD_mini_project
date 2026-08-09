import { Router } from "express";
import auth from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import UserProfile from "../models/UserProfile.js";

const router = Router();

// Get profile
router.get("/", auth, async (req, res) => {
  try {
    let profile = await UserProfile.findOne({ userId: req.userId });
    if (!profile) {
      profile = await UserProfile.create({ userId: req.userId });
    }
    res.json(profile);
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Update profile
router.put("/", auth, upload.single("profileImage"), async (req, res) => {
  try {
    const updateData = { ...req.body, updatedAt: Date.now() };
    
    if (req.file) {
      updateData.profileImage = req.file.path; // Cloudinary URL
    }

    // Convert comma-separated string to array if needed
    if (typeof updateData.dietaryPreferences === "string") {
      updateData.dietaryPreferences = updateData.dietaryPreferences.split(",").map(p => p.trim()).filter(Boolean);
    }
    
    if (typeof updateData.allergies === "string") {
      updateData.allergies = updateData.allergies.split(",").map(p => p.trim()).filter(Boolean);
    }

    const profile = await UserProfile.findOneAndUpdate(
      { userId: req.userId },
      { $set: updateData },
      { new: true, upsert: true }
    );
    
    res.json(profile);
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
