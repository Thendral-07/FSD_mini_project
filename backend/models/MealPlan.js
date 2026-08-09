import mongoose from "mongoose";

const mealPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: String, // e.g., '2023-10-25' or week start date
    required: true,
  },
  meals: {
    breakfast: [
      {
        mealId: String,
        mealName: String,
        mealThumb: String,
      },
    ],
    lunch: [
      {
        mealId: String,
        mealName: String,
        mealThumb: String,
      },
    ],
    dinner: [
      {
        mealId: String,
        mealName: String,
        mealThumb: String,
      },
    ],
    snacks: [
      {
        mealId: String,
        mealName: String,
        mealThumb: String,
      },
    ],
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

mealPlanSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model("MealPlan", mealPlanSchema);
