import { useState } from "react";
import MealModel from "../context/MealModel";
import "../styled/meal.css";

export default function MealCard({ meal }) {
  const [open, setOpen] = useState(false);
  const [fullMeal, setFullMeal] = useState(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <>
      <div className="card" onClick={handleCardClick}>
        <img src={meal.strMealThumb} alt={meal.strMeal} />
        <h3>{meal.strMeal}</h3>
      </div>

      {open && (
        <MealModel meal={fullMeal || meal} onClose={() => {
          setOpen(false);
          setFullMeal(null);
        }} loading={loading} />
      )}
    </>
  );
}