import MealCard from "./MealCard";
import { motion } from "framer-motion";

export default function MealList({ meals, favoriteIds = [] }) {
  if (!meals || meals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-xl font-medium text-muted-foreground">No meals found.</p>
        <p className="text-muted-foreground mt-2">Try adjusting your search ingredients.</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
    >
      {meals.map((meal) => (
        <MealCard key={meal.idMeal} meal={meal} favoriteIds={favoriteIds} />
      ))}
    </motion.div>
  );
}