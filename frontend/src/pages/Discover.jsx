import React, { useEffect, useState, useContext } from "react";
import { useSearchParams } from "react-router-dom";
import MealList from "../components/MealList";
import { AuthContext } from "../context/AuthContext";
import { getRandomMeals, filterByIngredient, MealApiError } from "../utils/mealdbClient";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Search, Loader2, Dices } from "lucide-react";
import { motion } from "framer-motion";

export default function Discover() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  
  const [meals, setMeals] = useState([]);
  const [ingredient, setIngredient] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [favoriteIds, setFavoriteIds] = useState([]);

  const { isAuthenticated, authFetch } = useContext(AuthContext);

  useEffect(() => {
    if (isAuthenticated) {
      authFetch("/meals/favorite-ids")
        .then((res) => res.json())
        .then((ids) => setFavoriteIds(ids))
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const fetchRandomMeals = async () => {
    setLoading(true);
    setError("");
    setIngredient("");
    setSearchParams({}); // clear url param

    try {
      const randomMeals = await getRandomMeals(12);
      if (randomMeals && randomMeals.length > 0) {
        setMeals(randomMeals);
      } else {
        setError("Failed to fetch meals. Try again.");
      }
    } catch (err) {
      if (err instanceof MealApiError && err.code === "RATE_LIMITED") {
        setError(err.message || "Rate limit reached. Please try again in a moment.");
      } else {
        setError("Failed to fetch meals. Try again.");
      }
    }
    setLoading(false);
  };

  const parseIngredients = (input) =>
    input.split(/[\s,]+/).map((item) => item.trim()).filter(Boolean);

  const searchByIngredient = async (ingredientName) => {
    const terms = parseIngredients(ingredientName);
    if (terms.length === 0) {
      fetchRandomMeals();
      return;
    }

    setSearchParams({ q: ingredientName });
    setLoading(true);
    setError("");

    if (isAuthenticated) {
      authFetch("/meals/search-log", {
        method: "POST",
        body: JSON.stringify({ ingredients: terms }),
      }).catch(() => {}); 
    }

    try {
      const results = await Promise.all(terms.map((term) => filterByIngredient(term)));
      
      if (results.some((mealsForTerm) => mealsForTerm.length === 0)) {
        setError(`No meals found with ingredient(s): "${ingredientName}"`);
        setMeals([]);
        setLoading(false);
        return;
      }

      const intersection = results.reduce((sharedMeals, mealsForTerm) => {
        const ids = new Set(mealsForTerm.map((meal) => meal.idMeal));
        return sharedMeals.filter((meal) => ids.has(meal.idMeal));
      });

      if (intersection.length === 0) {
        setError(`No meals found with ingredient(s): "${ingredientName}"`);
        setMeals([]);
      } else {
        setMeals(intersection.slice(0, 12));
      }
    } catch (err) {
      if (err instanceof MealApiError && err.code === "RATE_LIMITED") {
        setError(err.message || "Rate limit reached. Please try again in a moment.");
      } else {
        setError("Failed to search by ingredient. Try again.");
      }
      setMeals([]);
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    if (ingredient.trim()) {
      searchByIngredient(ingredient);
    } else {
      fetchRandomMeals();
    }
  };

  useEffect(() => {
    if (initialQuery) {
      searchByIngredient(initialQuery);
    } else {
      fetchRandomMeals();
    }
  }, []); // Run once on mount

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 pb-12">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-card p-6 rounded-2xl border shadow-sm"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Discover Meals</h1>
          <p className="text-muted-foreground mt-1">Search by ingredients you have, or get inspired.</p>
        </div>
        
        <form onSubmit={handleSearch} className="w-full md:w-auto flex gap-3 flex-1 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="e.g., chicken, garlic..." 
              value={ingredient}
              onChange={(e) => setIngredient(e.target.value)}
              className="pl-9 h-11 bg-background"
            />
          </div>
          <Button type="submit" className="h-11 px-6">Search</Button>
          <Button type="button" variant="outline" size="icon" onClick={fetchRandomMeals} className="h-11 w-11 shrink-0" title="Random Meals">
            <Dices className="w-5 h-5" />
          </Button>
        </form>
      </motion.div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-destructive/10 text-destructive rounded-xl text-center font-medium">
          {error}
        </motion.div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="animate-pulse bg-muted rounded-2xl aspect-square"></div>
          ))}
        </div>
      ) : (
        <MealList meals={meals} favoriteIds={favoriteIds} />
      )}
    </div>
  );
}
