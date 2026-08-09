// A simple dictionary mapping common ingredients to their approximate calorie value per standard measure (e.g., 100g or 1 unit).
// TheMealDB uses varying measurements, so we'll assign an average "per serving portion" calorie amount 
// for the ingredient when it's detected.

const CALORIE_DICTIONARY = {
  // Proteins (approx per 100g or serving)
  "chicken": 165,
  "chicken breast": 165,
  "beef": 250,
  "pork": 242,
  "lamb": 294,
  "salmon": 208,
  "tuna": 132,
  "fish": 150,
  "shrimp": 99,
  "egg": 70, // per egg
  "eggs": 70,
  "tofu": 144,
  
  // Carbs
  "rice": 130, // cooked
  "pasta": 131, // cooked
  "spaghetti": 131,
  "potato": 77,
  "potatoes": 77,
  "sweet potato": 86,
  "bread": 265,
  "flour": 364,
  "sugar": 387,
  "oats": 389,
  "quinoa": 120, // cooked

  // Dairy & Fats
  "milk": 42,
  "cheese": 402,
  "cheddar": 402,
  "parmesan": 431,
  "butter": 717,
  "olive oil": 119, // per tbsp
  "vegetable oil": 120, // per tbsp
  "cream": 340,
  "yogurt": 59,

  // Veggies & Fruits (generally very low)
  "onion": 40,
  "garlic": 14,
  "tomato": 18,
  "tomatoes": 18,
  "spinach": 23,
  "broccoli": 34,
  "carrot": 41,
  "carrots": 41,
  "mushroom": 22,
  "mushrooms": 22,
  "bell pepper": 20,
  "avocado": 160,
  "apple": 52,
  "banana": 89,
  
  // Others
  "soy sauce": 8, // per tbsp
  "honey": 64, // per tbsp
  "peanut butter": 94, // per tbsp
  "nuts": 600,
  "beans": 130, // cooked
  "lentils": 116, // cooked
};

/**
 * Calculate the estimated total calories for a meal based on its ingredients.
 * @param {Array<{ingredient: string, measure: string}>} ingredients - Array of ingredient objects
 * @returns {number} Estimated total calories
 */
export function calculateMealCalories(ingredients) {
  let totalCalories = 0;
  
  if (!ingredients || ingredients.length === 0) return 500; // Generic fallback
  
  ingredients.forEach(item => {
    const name = item.ingredient.toLowerCase();
    
    // Find matching ingredient in our dictionary (basic substring match)
    let found = false;
    for (const [key, cals] of Object.entries(CALORIE_DICTIONARY)) {
      if (name.includes(key)) {
        // We add the baseline calories. A true calculator would parse the 'measure'
        // But since measures are arbitrary ("1 pinch", "2 cups", "400g"), 
        // we'll use a simplified heuristic: if the measure implies a larger quantity (like cups, grams > 100), we multiply.
        
        let multiplier = 1;
        const measureLower = item.measure ? item.measure.toLowerCase() : "";
        
        if (measureLower.includes("cup") && parseInt(measureLower) > 1) multiplier = parseInt(measureLower);
        if (measureLower.includes("g") && parseInt(measureLower) >= 100) multiplier = parseInt(measureLower) / 100;
        if (measureLower.includes("oz") && parseInt(measureLower) > 3) multiplier = parseInt(measureLower) / 3.5; // ~100g
        if (measureLower.includes("tbsp") || measureLower.includes("spoon")) multiplier = 0.5;
        if (measureLower.includes("pinch") || measureLower.includes("dash")) multiplier = 0.1;
        
        // Prevent crazy multipliers
        multiplier = Math.min(Math.max(multiplier, 0.1), 10);
        
        totalCalories += (cals * multiplier);
        found = true;
        break;
      }
    }
    
    // If not found, add a small baseline for unknown ingredients (spices, sauces)
    if (!found) {
      totalCalories += 15; 
    }
  });
  
  // Round to nearest 10
  return Math.max(Math.round(totalCalories / 10) * 10, 150); // Minimum 150 kcal
}
