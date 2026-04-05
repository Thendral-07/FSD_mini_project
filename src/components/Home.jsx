import { useEffect, useState } from "react";
import MealList from "./MealList";
import ImagePreview from "./ImagePreview";
import "../styled/home.css";

export default function Home() {
  const [meals, setMeals] = useState([]);
  const [ingredient, setIngredient] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch random meals
  const fetchMeals = async () => {
    setLoading(true);
    setError("");
    setIngredient("");

    try {
      const promises = Array(12)
        .fill(0)
        .map(() =>
          fetch("https://www.themealdb.com/api/json/v1/1/random.php").then(
            (res) => res.json()
          )
        );

      const results = await Promise.all(promises);
      const randomMeals = results.map((data) => data.meals[0]);
      setMeals(randomMeals);
    } catch (err) {
      console.log(err);
      setError("Failed to fetch meals. Try again.");
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
      fetchMeals();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  useEffect(() => {
    fetchMeals();
  }, []);

  return (
    <div className="home">
      <h1>DishFlash</h1>

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
          <button onClick={fetchMeals} className="reset-btn">
            Get Random Meals
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
        <MealList meals={meals} />
      )}
    </div>
  );
}
      