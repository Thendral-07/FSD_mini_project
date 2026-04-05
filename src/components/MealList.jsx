import MealCard from "./MealCard";

export default function MealList({ meals }) {
  return (
    <div className="meal-list">
      {meals.length === 0 ? (
        <p>No meals found</p>
      ) : (
        meals.map((meal) => (
          <MealCard key={meal.idMeal} meal={meal} />
        ))
      )}
    </div>
  );
}