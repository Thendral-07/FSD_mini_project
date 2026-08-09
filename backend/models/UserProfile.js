import mongoose from "mongoose";

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  profileImage: {
    type: String,
    default: "",
  },
  dietaryPreferences: {
    type: [String],
    default: [],
  },
  allergies: {
    type: [String],
    default: [],
  },
  fitnessGoal: {
    type: String,
    enum: ["Weight Loss", "Maintenance", "Muscle Building", "Weight Gain"],
    default: "Maintenance",
  },
  bmr: {
    type: Number,
    default: 0,
  },
  tdee: {
    type: Number,
    default: 0,
  },
  height: { type: Number, default: 0 }, // in cm
  weight: { type: Number, default: 0 }, // in kg
  age: { type: Number, default: 0 },
  gender: { type: String, enum: ["Male", "Female", "Other", ""], default: "" },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("UserProfile", userProfileSchema);
