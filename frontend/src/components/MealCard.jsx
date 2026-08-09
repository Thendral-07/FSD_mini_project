import React, { useState, useContext, useEffect } from "react";
import MealModel from "../context/MealModel";
import { AuthContext } from "../context/AuthContext";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";

export default function MealCard({ meal, favoriteIds = [] }) {
  const { isAuthenticated, authFetch } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [fullMeal, setFullMeal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    if (favoriteIds.includes(meal.idMeal)) {
      setIsFav(true);
    }
  }, [favoriteIds, meal.idMeal]);

  const fetchFullMealDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`
      );
      const data = await res.json();
      if (data.meals) {
        setFullMeal(data.meals[0]);
      }
    } catch (error) {
      console.error("Error fetching meal details:", error);
      setFullMeal(meal);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = async () => {
    setOpen(true);
    await fetchFullMealDetails();
  };

  const handleHeartClick = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) return;

    try {
      const res = await authFetch("/meals/favorite", {
        method: "POST",
        body: JSON.stringify({
          mealId: meal.idMeal,
          mealName: meal.strMeal,
          mealThumb: meal.strMealThumb || "",
          category: meal.strCategory || "",
          area: meal.strArea || "",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsFav(data.favorited);
      }
    } catch (err) {
      console.error("Favorite toggle error:", err);
    }
  };

  return (
    <>
      <motion.div 
        whileHover={{ y: -5 }}
        className="group cursor-pointer bg-card rounded-2xl overflow-hidden border shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
        onClick={handleCardClick}
      >
        <div className="relative aspect-square overflow-hidden">
          <img 
            src={meal.strMealThumb} 
            alt={meal.strMeal} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {isAuthenticated && (
            <button
              onClick={handleHeartClick}
              className="absolute top-4 right-4 w-10 h-10 bg-background/80 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-background transition-colors z-10"
            >
              <Heart 
                className={`w-5 h-5 transition-colors ${isFav ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} 
              />
            </button>
          )}
        </div>
        
        <div className="p-4 flex-1 flex flex-col justify-between">
          <h3 className="font-semibold text-lg line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {meal.strMeal}
          </h3>
          <div className="mt-3 flex gap-2">
            {meal.strCategory && (
              <span className="px-2.5 py-1 bg-secondary text-secondary-foreground text-xs rounded-md font-medium">
                {meal.strCategory}
              </span>
            )}
            {meal.strArea && (
              <span className="px-2.5 py-1 bg-secondary text-secondary-foreground text-xs rounded-md font-medium">
                {meal.strArea}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {open && (
        <MealModel meal={fullMeal || meal} onClose={() => {
          setOpen(false);
          setFullMeal(null);
        }} loading={loading} />
      )}
    </>
  );
}