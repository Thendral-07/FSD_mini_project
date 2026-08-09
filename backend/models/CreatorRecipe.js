import mongoose from "mongoose";

const creatorRecipeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  imageUrl: {
    type: String,
    default: "",
  },
  category: {
    type: String,
    required: true,
  },
  ingredients: [
    {
      name: String,
      measure: String,
    },
  ],
  instructions: {
    type: String,
    required: true,
  },
  prepTime: {
    type: Number, // in minutes
  },
  cookTime: {
    type: Number, // in minutes
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  views: {
    type: Number,
    default: 0,
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }
  ],
  comments: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      userName: { type: String, required: true },
      text: { type: String, required: true, trim: true },
      createdAt: { type: Date, default: Date.now },
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("CreatorRecipe", creatorRecipeSchema);
