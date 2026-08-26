import mongoose from "mongoose";
import axios from "axios";
import "dotenv/config";
import Recipe from "../models/Recipe.js";

const THEMEALDB_BASE = "https://www.themealdb.com/api/json/v1/1";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Fetch all meals starting with each letter of the alphabet
    const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
    let totalImported = 0;

    for (const letter of alphabet) {
      console.log(`Fetching meals starting with ${letter}...`);
      const response = await axios.get(`${THEMEALDB_BASE}/search.php?f=${letter}`);
      const meals = response.data.meals;

      if (meals && meals.length > 0) {
        for (const meal of meals) {
          // Format ingredients array
          const ingredients = [];
          for (let i = 1; i <= 20; i++) {
            const ing = meal[`strIngredient${i}`];
            const meas = meal[`strMeasure${i}`];
            if (ing && ing.trim()) {
              ingredients.push({
                ingredient: ing.trim(),
                measure: meas ? meas.trim() : "",
              });
            }
          }

          // Upsert to avoid duplicates
          await Recipe.findOneAndUpdate(
            { idMeal: meal.idMeal },
            {
              ...meal,
              ingredients,
            },
            { upsert: true, new: true }
          );
          totalImported++;
        }
      }

      // Sleep to respect TheMealDB rate limits during the migration!
      await sleep(1500); 
    }

    console.log(`\n✅ Migration Complete! Imported/Updated ${totalImported} recipes into MongoDB.`);
    process.exit(0);
  } catch (error) {
    console.error("Migration Failed:", error);
    process.exit(1);
  }
}

seedDatabase();
