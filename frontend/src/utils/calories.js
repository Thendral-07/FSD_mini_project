// A simple dictionary mapping common ingredients to their approximate macros per standard measure (e.g., 100g or 1 unit).
// TheMealDB uses varying measurements, so we'll assign an average "per serving portion" macro amount 
// for the ingredient when it's detected.

const MACRO_DICTIONARY = {
  // Proteins (approx per 100g or serving)
  "chicken": { cals: 165, p: 31, c: 0, f: 3.6 },
  "chicken breast": { cals: 165, p: 31, c: 0, f: 3.6 },
  "beef": { cals: 250, p: 26, c: 0, f: 15 },
  "pork": { cals: 242, p: 27, c: 0, f: 14 },
  "lamb": { cals: 294, p: 25, c: 0, f: 21 },
  "salmon": { cals: 208, p: 20, c: 0, f: 13 },
  "tuna": { cals: 132, p: 28, c: 0, f: 1 },
  "fish": { cals: 150, p: 24, c: 0, f: 5 },
  "shrimp": { cals: 99, p: 24, c: 0, f: 0.3 },
  "egg": { cals: 70, p: 6, c: 0.6, f: 5 }, // per egg
  "eggs": { cals: 70, p: 6, c: 0.6, f: 5 },
  "tofu": { cals: 144, p: 15, c: 3, f: 8 },
  
  // Carbs
  "rice": { cals: 130, p: 2.7, c: 28, f: 0.3 }, // cooked
  "pasta": { cals: 131, p: 5, c: 25, f: 1.1 }, // cooked
  "spaghetti": { cals: 131, p: 5, c: 25, f: 1.1 },
  "potato": { cals: 77, p: 2, c: 17, f: 0.1 },
  "potatoes": { cals: 77, p: 2, c: 17, f: 0.1 },
  "sweet potato": { cals: 86, p: 1.6, c: 20, f: 0.1 },
  "bread": { cals: 265, p: 9, c: 49, f: 3.2 },
  "flour": { cals: 364, p: 10, c: 76, f: 1 },
  "sugar": { cals: 387, p: 0, c: 100, f: 0 },
  "oats": { cals: 389, p: 16, c: 66, f: 6 },
  "quinoa": { cals: 120, p: 4.4, c: 21, f: 1.9 }, // cooked

  // Dairy & Fats
  "milk": { cals: 42, p: 3.4, c: 5, f: 1 },
  "cheese": { cals: 402, p: 25, c: 1.3, f: 33 },
  "cheddar": { cals: 402, p: 25, c: 1.3, f: 33 },
  "parmesan": { cals: 431, p: 38, c: 4, f: 29 },
  "butter": { cals: 717, p: 0.8, c: 0, f: 81 },
  "olive oil": { cals: 119, p: 0, c: 0, f: 13.5 }, // per tbsp
  "vegetable oil": { cals: 120, p: 0, c: 0, f: 13.6 }, // per tbsp
  "cream": { cals: 340, p: 2.8, c: 2.7, f: 36 },
  "yogurt": { cals: 59, p: 10, c: 3.6, f: 0.4 },

  // Veggies & Fruits (generally very low)
  "onion": { cals: 40, p: 1.1, c: 9.3, f: 0.1 },
  "garlic": { cals: 14, p: 0.6, c: 3, f: 0 },
  "tomato": { cals: 18, p: 0.9, c: 3.9, f: 0.2 },
  "tomatoes": { cals: 18, p: 0.9, c: 3.9, f: 0.2 },
  "spinach": { cals: 23, p: 2.9, c: 3.6, f: 0.4 },
  "broccoli": { cals: 34, p: 2.8, c: 6.6, f: 0.4 },
  "carrot": { cals: 41, p: 0.9, c: 9.6, f: 0.2 },
  "carrots": { cals: 41, p: 0.9, c: 9.6, f: 0.2 },
  "mushroom": { cals: 22, p: 3.1, c: 3.3, f: 0.3 },
  "mushrooms": { cals: 22, p: 3.1, c: 3.3, f: 0.3 },
  "bell pepper": { cals: 20, p: 0.9, c: 4.6, f: 0.2 },
  "avocado": { cals: 160, p: 2, c: 8.5, f: 14.7 },
  "apple": { cals: 52, p: 0.3, c: 14, f: 0.2 },
  "banana": { cals: 89, p: 1.1, c: 23, f: 0.3 },
  
  // Others
  "soy sauce": { cals: 8, p: 1.3, c: 0.8, f: 0 }, // per tbsp
  "honey": { cals: 64, p: 0, c: 17, f: 0 }, // per tbsp
  "peanut butter": { cals: 94, p: 4, c: 3, f: 8 }, // per tbsp
  "nuts": { cals: 600, p: 20, c: 21, f: 54 },
  "beans": { cals: 130, p: 8.7, c: 23, f: 0.5 }, // cooked
  "lentils": { cals: 116, p: 9, c: 20, f: 0.4 }, // cooked
};

/**
 * Calculate the estimated total macros for a meal based on its ingredients.
 * @param {Array<{ingredient: string, measure: string}>} ingredients - Array of ingredient objects
 * @returns {Object} Estimated macros { calories, protein, carbs, fat }
 */
export function calculateMealMacros(ingredients) {
  let totals = { cals: 0, p: 0, c: 0, f: 0 };
  
  if (!ingredients || ingredients.length === 0) {
    return { calories: 500, protein: 25, carbs: 50, fat: 20 }; // Generic fallback
  }
  
  ingredients.forEach(item => {
    const name = item.ingredient.toLowerCase();
    let found = false;
    for (const [key, macros] of Object.entries(MACRO_DICTIONARY)) {
      if (name.includes(key)) {
        let multiplier = 1;
        const measureLower = item.measure ? item.measure.toLowerCase() : "";
        
        if (measureLower.includes("cup") && parseInt(measureLower) > 1) multiplier = parseInt(measureLower);
        if (measureLower.includes("g") && parseInt(measureLower) >= 100) multiplier = parseInt(measureLower) / 100;
        if (measureLower.includes("oz") && parseInt(measureLower) > 3) multiplier = parseInt(measureLower) / 3.5;
        if (measureLower.includes("tbsp") || measureLower.includes("spoon")) multiplier = 0.5;
        if (measureLower.includes("pinch") || measureLower.includes("dash")) multiplier = 0.1;
        
        multiplier = Math.min(Math.max(multiplier, 0.1), 10);
        
        totals.cals += (macros.cals * multiplier);
        totals.p += (macros.p * multiplier);
        totals.c += (macros.c * multiplier);
        totals.f += (macros.f * multiplier);
        found = true;
        break;
      }
    }
    
    // Fallback for unknown ingredients
    if (!found) {
      totals.cals += 15; 
      totals.c += 2;
      totals.f += 0.5;
    }
  });
  
  return {
    calories: Math.max(Math.round(totals.cals / 10) * 10, 150),
    protein: Math.round(totals.p),
    carbs: Math.round(totals.c),
    fat: Math.round(totals.f)
  };
}

/**
 * Backward compatible function for just calories
 */
export function calculateMealCalories(ingredients) {
  return calculateMealMacros(ingredients).calories;
}
