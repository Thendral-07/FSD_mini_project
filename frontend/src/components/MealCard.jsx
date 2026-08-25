import React, { useState, useContext, useEffect } from "react";
import MealModel from "../context/MealModel";
import { AuthContext } from "../context/AuthContext";
import { lookupMeal, MealApiError } from "../utils/mealdbClient";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";

export default function MealCard({ meal, favoriteIds = [] }) {
  const { isAuthenticated, authFetch } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [fullMeal, setFullMeal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    if (favoriteIds.includes(meal.idMeal)) {
      setIsFav(true);
    }
  }, [favoriteIds, meal.idMeal]);

  const fetchFullMealDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await lookupMeal(meal.idMeal);
      setFullMeal(data || meal);
    } catch (err) {
      if (err instanceof MealApiError && err.code === "RATE_LIMITED") {
        setError(err.message);
      }
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

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <>
      <motion.div 
        variants={itemVariants}
        whileHover={{ y: -8, scale: 1.02 }}
        className="group cursor-pointer bg-card rounded-2xl overflow-hidden border border-border/50 shadow-sm hover:shadow-[0_10px_40px_-10px_rgba(255,100,50,0.3)] transition-all duration-500 flex flex-col relative"
        onClick={handleCardClick}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10" />
        <div className="relative aspect-square overflow-hidden">
          <img 
            src={meal.strMealThumb} 
            alt={meal.strMeal} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {isAuthenticated && (
            <motion.button
              whileTap={{ scale: 0.8 }}
              whileHover={{ scale: 1.1 }}
              onClick={handleHeartClick}
              className="absolute top-4 right-4 w-10 h-10 bg-background/80 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-background transition-colors z-20 shadow-lg"
            >
              <Heart 
                className={`w-5 h-5 transition-colors ${isFav ? "fill-red-500 text-red-500" : "text-muted-foreground group-hover:text-red-400"}`} 
              />
            </motion.button>
          )}
        </div>
        
        <div className="p-5 flex-1 flex flex-col justify-between relative z-20 bg-card">
          <h3 className="font-bold text-lg line-clamp-2 leading-tight group-hover:text-primary transition-colors duration-300">
            {meal.strMeal}
          </h3>
          <div className="mt-4 flex gap-2 flex-wrap">
            {meal.strCategory && (
              <span className="px-3 py-1 bg-secondary text-secondary-foreground text-xs rounded-full font-semibold tracking-wide">
                {meal.strCategory}
              </span>
            )}
            {meal.strArea && (
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs rounded-full font-semibold tracking-wide">
                {meal.strArea}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {open && (
        <MealModel
          meal={fullMeal || meal}
          loading={loading}
          error={error}
          onClose={() => {
            setOpen(false);
            setFullMeal(null);
            setError(null);
          }}
        />
      )}
    </>
  );
}