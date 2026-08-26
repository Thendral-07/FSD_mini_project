import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.js";
import mealRoutes from "./routes/meals.js";
import contactRoutes from "./routes/contact.js";
import profileRoutes from "./routes/profile.js";
import plannerRoutes from "./routes/planner.js";
import nutritionRoutes from "./routes/nutrition.js";
import recipeRoutes from "./routes/recipes.js";
import recommendationRoutes from "./routes/recommendations.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // Limit each IP to 150 requests per windowMs
  message: { error: "Too many requests from this IP, please try again after 15 minutes." },
});
app.use("/api", globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per windowMs (prevent brute-force)
  message: { error: "Too many login attempts from this IP, please try again after 15 minutes." },
});

// Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/meals", mealRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/planner", plannerRoutes);
app.use("/api/nutrition", nutritionRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/recommendations", recommendationRoutes);

// Health check & Root
app.get("/", (req, res) => {
  res.send("<h1>DishFlash API is running...</h1><p>Append /api/health to check status.</p>");
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB Atlas");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });
