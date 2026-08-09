import mongoose from "mongoose";

const nutritionLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: String, // e.g., '2023-10-25'
    required: true,
  },
  calories: {
    type: Number,
    default: 0,
  },
  protein: {
    type: Number,
    default: 0,
  },
  carbs: {
    type: Number,
    default: 0,
  },
  fat: {
    type: Number,
    default: 0,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

nutritionLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model("NutritionLog", nutritionLogSchema);
