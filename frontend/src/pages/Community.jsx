import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Loader2, Users, BookOpen, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MealModel from "../context/MealModel";

export default function Community() {
  const { authFetch } = useContext(AuthContext);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMeal, setSelectedMeal] = useState(null);

  useEffect(() => {
    fetchPublicRecipes();
  }, []);

  const fetchPublicRecipes = async () => {
    try {
      // For public recipes, we can just use normal fetch or authFetch if needed
      // Actually backend route is /recipes/public, let's just use fetch if it doesn't strictly need auth, but authFetch is safer if it includes API URL.
      const res = await authFetch("/recipes/public");
      if (res.ok) {
        const data = await res.json();
        setRecipes(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const openRecipeDetails = (recipe) => {
    // Transform CreatorRecipe format into TheMealDB format for MealModel
    const transformedMeal = {
      idMeal: recipe._id,
      strMeal: recipe.title,
      strMealThumb: recipe.imageUrl,
      strCategory: recipe.category,
      strArea: "Community",
      strInstructions: recipe.instructions,
      isCreatorRecipe: true,
      originalRecipe: recipe,
    };

    // Add ingredients
    if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
      recipe.ingredients.forEach((ing, index) => {
        transformedMeal[`strIngredient${index + 1}`] = ing.name;
        transformedMeal[`strMeasure${index + 1}`] = ing.measure;
      });
    }

    setSelectedMeal(transformedMeal);
  };

  const filteredRecipes = recipes.filter(recipe => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    
    // Check title
    if (recipe.title.toLowerCase().includes(query)) return true;
    
    // Check ingredients
    if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
      return recipe.ingredients.some(ing => ing.name.toLowerCase().includes(query));
    }
    
    return false;
  });

  return (
    <div className="max-w-6xl mx-auto w-full space-y-8 pb-12">
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-card p-6 rounded-2xl border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Community Recipes</h1>
            <p className="text-muted-foreground mt-1">Discover delicious meals created by the DishFlash community.</p>
          </div>
        </div>
        
        <div className="w-full md:w-auto relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search recipes or ingredients..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-11 bg-background"
          />
        </div>
      </div>

      {!filteredRecipes.length ? (
        <div className="text-center py-16 bg-muted/30 rounded-2xl border border-dashed">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No recipes found</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">Try adjusting your search terms or discovering random meals.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe, i) => (
            <motion.div
              key={recipe._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => openRecipeDetails(recipe)}
              className="cursor-pointer h-full"
            >
              <Card className="overflow-hidden h-full flex flex-col hover:shadow-lg transition-all group">
                {recipe.imageUrl ? (
                  <div className="h-48 w-full overflow-hidden relative">
                    <img 
                      src={recipe.imageUrl} 
                      alt={recipe.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  </div>
                ) : (
                  <div className="h-48 w-full bg-muted flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-muted-foreground/30" />
                  </div>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="line-clamp-2">{recipe.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                    {recipe.description}
                  </p>
                  <div className="flex justify-between items-center text-xs text-muted-foreground pt-4 border-t mt-auto">
                    <div>{recipe.ingredients?.length || 0} Ingredients</div>
                    <div>{recipe.instructions?.length || 0} Steps</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedMeal && (
          <MealModel
            meal={selectedMeal}
            onClose={() => setSelectedMeal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
