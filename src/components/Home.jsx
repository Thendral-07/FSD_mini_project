import { useEffect, useState } from "react";
import MealList from "./MealList";
import ImagePreview from "./ImagePreview";
import "../styled/home.css";

export default function Home() {
  const [meals, setMeals] = useState([]);
  const [ingredient, setIngredient] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchType, setSearchType] = useState("category"); // 'category' or 'ingredient'

  // Fetch Indian recipes by category
  const fetchIndianMeals = async () => {
    setLoading(true);
    setError("");
    setSearchType("category");
    setIngredient("");

    try {
      const res = await fetch(
        "https://www.themealdb.com/api/json/v1/1/filter.php?c=Indian"
      );

      if (!res.ok) {
        throw new Error("API Failed");
      }

      const data = await res.json();

      if (!data.meals) {
        throw new Error("No Indian meals found");
      }

      // Get 12 random meals from the Indian category
      const shuffled = data.meals.sort(() => 0.5 - Math.random());
      setMeals(shuffled.slice(0, 12));
    } catch (err) {
      console.log(err);
      setError("Failed to fetch Indian recipes. Try again.");
    }

    setLoading(false);
  };

  // Search meals by ingredient
  const searchByIngredient = async (ingredientName) => {
    if (!ingredientName.trim()) {
      setError("Please enter an ingredient");
      return;
    }

    setLoading(true);
    setError("");
    setSearchType("ingredient");

    try {
      const res = await fetch(
        `https://www.themealdb.com/api/json/v1/1/filter.php?i=${ingredientName.trim()}`
      );

      if (!res.ok) {
        throw new Error("API Failed");
      }

      const data = await res.json();

      if (!data.meals || data.meals.length === 0) {
        setError(`No meals found with ingredient: "${ingredientName}"`);
        setMeals([]);
        setLoading(false);
        return;
      }

      // Show first 12 meals with that ingredient
      setMeals(data.meals.slice(0, 12));
    } catch (err) {
      console.log(err);
      setError("Failed to search by ingredient. Try again.");
    }

    setLoading(false);
  };

  const handleSearch = () => {
    if (ingredient.trim()) {
      searchByIngredient(ingredient);
    } else {
      fetchIndianMeals();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  useEffect(() => {
    fetchIndianMeals();
  }, []);

  return (
    <div className="home">
      <h1>🍊 Mealify</h1>

      <div className="controls">
        <input
          placeholder="Enter ingredient (e.g., chicken, garlic)..."
          value={ingredient}
          onChange={(e) => setIngredient(e.target.value)}
          onKeyPress={handleKeyPress}
        />

        <button onClick={handleSearch}>
          {loading ? "Searching..." : "Search Meals"}
        </button>

        {ingredient && (
          <button onClick={fetchIndianMeals} className="reset-btn">
            Show Indian Recipes
          </button>
        )}
      </div>

      {/* ERROR UI */}
      {error && <p className="error">{error}</p>}

      <ImagePreview />

      {/* LOADING SKELETON */}
      {loading ? (
        <div className="meal-list">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="skeleton-card"></div>
            ))}
        </div>
      ) : (
        <>
          {meals.length > 0 && (
            <p className="search-info">
              {searchType === "ingredient"
                ? `Found ${meals.length} meals with "${ingredient}"`
                : "Showing Popular Indian Recipes"}
            </p>
          )}
          <MealList meals={meals} />
        </>
      )}
    </div>
  );
}
      