import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, CheckCircle, X, PlayCircle, Loader2, Utensils, Clock, ListPlus, Calculator, Flame, Minus, Plus as PlusIcon, AlertTriangle } from "lucide-react";
import { Button } from "../components/ui/Button";
import { calculateMealCalories, calculateMealMacros } from "../utils/calories";

export default function MealModel({ meal, onClose, loading, error }) {
  const { isAuthenticated, authFetch, user } = useContext(AuthContext);
  const [cooked, setCooked] = useState(false);
  const [cookLoading, setCookLoading] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [favStatus, setFavStatus] = useState(null);
  const [servings, setServings] = useState(1);
  
  // Engagement State (for Creator Recipes)
  const isCreatorRecipe = meal?.isCreatorRecipe;
  const recipeId = meal?.originalRecipe?._id;
  const [views, setViews] = useState(meal?.originalRecipe?.views || 0);
  const [likes, setLikes] = useState(meal?.originalRecipe?.likes || []);
  const [comments, setComments] = useState(meal?.originalRecipe?.comments || []);
  const [newComment, setNewComment] = useState("");
  const [likeLoading, setLikeLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  
  // Planner State
  const [planDate, setPlanDate] = useState(new Date().toISOString().split("T")[0]);
  const [planType, setPlanType] = useState("lunch");
  const [planLoading, setPlanLoading] = useState(false);
  const [planSuccess, setPlanSuccess] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    
    // Increment views if it's a creator recipe
    if (isCreatorRecipe && recipeId) {
      authFetch(`/recipes/${recipeId}/view`, { method: "POST" })
        .then(res => res.json())
        .then(data => { if (data.views) setViews(data.views); })
        .catch(err => console.error("Error incrementing views", err));
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isCreatorRecipe, recipeId, authFetch]);

  if (!meal) return null;

  const ingredients = [];
  if (meal.strIngredient1) {
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (ingredient && ingredient.trim()) {
        ingredients.push({
          ingredient: ingredient.trim(),
          measure: measure ? measure.trim() : "",
        });
      }
    }
  }

  // Calculate calories and macros based on ingredients!
  const macros = calculateMealMacros(ingredients);
  const baseCalories = macros.calories;
  const activeServings = Number(servings) || 1;
  const totalCalories = baseCalories * activeServings;
  const caloriesPerServe = baseCalories; // Assume base calculation is for 1 serving
  
  const isHighProtein = ["Chicken", "Beef", "Seafood"].includes(meal.strCategory);
  const isLowCalorie = caloriesPerServe < 500;



  const handleCooked = async () => {
    if (cookLoading) return;
    setCookLoading(true);
    try {
      const res = await authFetch("/meals/cooked", {
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
        setCooked(true);
        // Automatically log nutrition for today
        try {
          const today = new Date().toISOString().split("T")[0];
          const nutRes = await authFetch(`/nutrition/${today}`);
          if (nutRes.ok) {
            const nutData = await nutRes.json();
            const currentCals = nutData.calories || 0;
            const currentProtein = nutData.protein || 0;
            const currentCarbs = nutData.carbs || 0;
            const currentFat = nutData.fat || 0;
            await authFetch(`/nutrition/${today}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                calories: currentCals + baseCalories,
                protein: currentProtein + macros.protein,
                carbs: currentCarbs + macros.carbs,
                fat: currentFat + macros.fat
              })
            });
          }
        } catch (nutErr) {
          console.error("Error logging nutrition:", nutErr);
        }
      }
    } catch (err) {
      console.error("Error marking cooked:", err);
    } finally {
      setCookLoading(false);
    }
  };

  const handleFavorite = async () => {
    if (favLoading) return;
    setFavLoading(true);
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
        setFavStatus(data.favorited);
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
    } finally {
      setFavLoading(false);
    }
  };

  const handleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      const res = await authFetch(`/recipes/${recipeId}/like`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setLikes(data.likes);
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || commentLoading) return;
    setCommentLoading(true);
    try {
      const res = await authFetch(`/recipes/${recipeId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newComment })
      });
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments);
        setNewComment("");
      }
    } catch (err) {
      console.error("Error adding comment:", err);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleAddToPlanner = async () => {
    if (planLoading) return;
    setPlanLoading(true);
    setPlanSuccess(false);
    try {
      const mealId = meal.idMeal || meal._id;
      const mealName = meal.strMeal || meal.title;
      const mealThumb = meal.strMealThumb || meal.image || "";

      // First fetch current plan
      const getRes = await authFetch(`/planner/${planDate}`);
      const data = await getRes.json();
      const currentMeals = data?.meals || { breakfast: [], lunch: [], dinner: [], snacks: [] };
      
      // Ensure target array exists
      if (!Array.isArray(currentMeals[planType])) {
        currentMeals[planType] = [];
      }

      // Check if already in plan
      if (currentMeals[planType].some(m => String(m.mealId) === String(mealId))) {
        setPlanSuccess(true);
        setTimeout(() => setPlanSuccess(false), 3000);
        return;
      }

      currentMeals[planType].push({
        mealId: String(mealId),
        mealName: mealName,
        mealThumb: mealThumb,
      });

      const putRes = await authFetch(`/planner/${planDate}`, {
        method: "PUT",
        body: JSON.stringify({ meals: currentMeals })
      });

      if (putRes.ok) {
        setPlanSuccess(true);
        setTimeout(() => setPlanSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Error adding to planner:", err);
    } finally {
      setPlanLoading(false);
    }
  };

  const scaleText = (text, servings) => {
    if (!text) return text;
    
    let scaled = text;
    const active = Number(servings) || 1;
    
    if (active !== 1) {
      // Handle fractions like "1/2", "3/4", "1 1/2" at the start
      const match = text.trim().match(/^(\d+)?\s*(?:(\d+)\/(\d+))(.*)$/);
      if (match && (match[1] || match[2])) {
        const whole = parseInt(match[1] || "0", 10);
        const num = parseInt(match[2] || "0", 10);
        const den = parseInt(match[3] || "1", 10);
        
        if (whole > 0 || num > 0) {
          let value = whole + (num / den);
          value = value * active;
          value = Math.round(value * 100) / 100; // max 2 decimal places
          scaled = `${value}${match[4] || ""}`.trim();
        }
      } else {
        // Fallback for simple decimals/integers at the start
        scaled = text.replace(/^([\d.]+)/, (m) => {
          const num = parseFloat(m);
          return isNaN(num) ? m : Math.round((num * active) * 100) / 100;
        });
      }
    }

    // Unit conversions (1000g -> 1 Kg, 1000ml -> 1 L)
    scaled = scaled.replace(/^([\d.]+)\s*(g|ml|kg|l|liter|liters|litre|litres)\b/i, (m, valStr, unit) => {
      const val = parseFloat(valStr);
      const u = unit.toLowerCase();
      if (u === 'g' && val >= 1000) {
        return `${Math.round((val / 1000) * 100) / 100} Kg`;
      }
      if (u === 'ml' && val >= 1000) {
        return `${Math.round((val / 1000) * 100) / 100} L`;
      }
      return m;
    });

    return scaled;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-background rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Left Side: Image */}
          <div className="w-full md:w-2/5 h-64 md:h-auto relative shrink-0">
            {loading ? (
              <div className="w-full h-full bg-muted animate-pulse flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <img 
                src={meal.strMealThumb} 
                alt={meal.strMeal} 
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
              <h2 className="text-3xl font-bold text-white leading-tight mb-2">{meal.strMeal}</h2>
              <div className="flex flex-wrap gap-2 text-white/80 text-sm font-medium mt-2">
                {meal.strCategory && <span>{meal.strCategory}</span>}
                {meal.strCategory && meal.strArea && <span>•</span>}
                {meal.strArea && <span>{meal.strArea}</span>}
                <span>•</span>
                <span className="flex items-center gap-1 text-orange-400">
                  <Flame className="w-4 h-4" /> {totalCalories} kcal total ({caloriesPerServe} kcal/serve)
                </span>
              </div>
              <div className="flex gap-3 mt-3">
                <div className="flex flex-col items-center bg-black/30 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2">
                  <span className="text-[10px] text-white/70 uppercase font-bold tracking-widest">Protein</span>
                  <span className="font-bold text-white text-lg leading-none mt-1">{macros.protein * activeServings}g</span>
                </div>
                <div className="flex flex-col items-center bg-black/30 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2">
                  <span className="text-[10px] text-white/70 uppercase font-bold tracking-widest">Carbs</span>
                  <span className="font-bold text-white text-lg leading-none mt-1">{macros.carbs * activeServings}g</span>
                </div>
                <div className="flex flex-col items-center bg-black/30 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2">
                  <span className="text-[10px] text-white/70 uppercase font-bold tracking-widest">Fat</span>
                  <span className="font-bold text-white text-lg leading-none mt-1">{macros.fat * activeServings}g</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Content */}
          <div className="w-full md:w-3/5 p-6 md:p-8 overflow-y-auto flex flex-col">
            
            {error && (
              <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-2.5 text-amber-600 dark:text-amber-400 text-sm font-medium">
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
                <span>{error}</span>
              </div>
            )}

            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Diet Recommendation Tags */}
                <div className="mb-4 flex flex-wrap gap-2">
                  {isHighProtein && <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">Great for Muscle Building</span>}
                  {isLowCalorie && <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Low Calorie (Weight Loss)</span>}
                  {meal.strCategory === "Vegetarian" && <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Vegetarian Friendly</span>}
                  {meal.strCategory === "Vegan" && <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Vegan Friendly</span>}
                </div>

                {isAuthenticated && (
                  <div className="flex flex-wrap gap-3 mb-8">
                    {!isCreatorRecipe ? (
                      <Button 
                        variant={favStatus ? "default" : "outline"}
                        onClick={handleFavorite}
                        disabled={favLoading}
                        className="rounded-full"
                      >
                        {favLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Heart className={`w-4 h-4 mr-2 ${favStatus ? "fill-current" : ""}`} />}
                        {favStatus ? "Saved" : "Save to Favorites"}
                      </Button>
                    ) : (
                      <Button 
                        variant={likes.includes(user?._id) ? "default" : "outline"}
                        onClick={handleLike}
                        disabled={likeLoading}
                        className="rounded-full"
                      >
                        {likeLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Heart className={`w-4 h-4 mr-2 ${likes.includes(user?._id) ? "fill-current" : ""}`} />}
                        {likes.length} {likes.length === 1 ? "Like" : "Likes"}
                      </Button>
                    )}
                    
                    <Button 
                      variant={cooked ? "secondary" : "outline"}
                      onClick={handleCooked}
                      disabled={cookLoading || cooked}
                      className="rounded-full"
                    >
                      {cookLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className={`w-4 h-4 mr-2 ${cooked ? "text-green-500" : ""}`} />}
                      {cooked ? "Cooked" : "Mark as Cooked"}
                    </Button>
                  </div>
                )}
                
                {isAuthenticated && (
                  <div className="bg-primary/5 rounded-2xl p-4 border border-primary/20 mb-8 flex flex-col sm:flex-row items-center gap-3">
                    <span className="font-semibold text-sm mr-auto">Add to Planner</span>
                    <input 
                      type="date" 
                      value={planDate} 
                      onChange={(e) => setPlanDate(e.target.value)}
                      className="bg-background border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <select 
                      value={planType} 
                      onChange={(e) => setPlanType(e.target.value)}
                      className="bg-background border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                      <option value="snacks">Snacks</option>
                    </select>
                    <Button 
                      onClick={handleAddToPlanner} 
                      disabled={planLoading}
                    >
                      {planLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : planSuccess ? "Added!" : "Add"}
                    </Button>
                  </div>
                )}
                
                {/* Servings Counter */}
                <div className="flex items-center gap-4 mb-8 p-4 bg-muted/30 rounded-2xl border">
                  <span className="font-semibold flex-1">Servings</span>
                  <div className="flex items-center gap-3 bg-background border rounded-xl p-1">
                    <button 
                      onClick={() => setServings(Math.max(1, activeServings - 1))}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <style>{`
                      input[type="number"]::-webkit-inner-spin-button,
                      input[type="number"]::-webkit-outer-spin-button {
                        -webkit-appearance: none;
                        margin: 0;
                      }
                      input[type="number"] {
                        -moz-appearance: textfield;
                      }
                    `}</style>
                    <input 
                      type="number"
                      min="1"
                      value={servings}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          setServings("");
                        } else {
                          const num = parseInt(val, 10);
                          if (!isNaN(num)) setServings(Math.max(1, num));
                        }
                      }}
                      onBlur={() => {
                        if (servings === "" || servings < 1) setServings(1);
                      }}
                      className="w-10 text-center font-semibold bg-transparent border-none outline-none focus:ring-0 p-0 text-foreground"
                    />
                    <button 
                      onClick={() => setServings(activeServings + 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  {/* Ingredients */}
                  {ingredients.length > 0 && (
                    <div className="bg-muted/50 rounded-2xl p-5 border">
                      <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                        <Utensils className="w-5 h-5 text-primary" /> Ingredients
                      </h3>
                      <ul className="space-y-3">
                        {ingredients.map((item, idx) => (
                          <li key={idx} className="flex justify-between items-center text-sm">
                            <span className="font-medium text-foreground">{scaleText(item.ingredient, servings)}</span>
                            <span className="text-muted-foreground">{scaleText(item.measure, servings)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Actions & Instructions */}
                  <div className="space-y-6">
                    {/* Instructions */}
                    <div>
                      <h3 className="font-semibold text-lg mb-4">Instructions</h3>
                      <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground space-y-4">
                        {meal.strInstructions?.split(/\r\n|\n/).filter(Boolean).map((para, i) => (
                          <p key={i}>{para}</p>
                        ))}
                      </div>
                    </div>

                    {meal.strYoutube && (
                      <a href={meal.strYoutube} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-red-500 hover:text-red-600 transition-colors bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl text-sm font-medium">
                        <PlayCircle className="w-5 h-5" />
                        Watch Video
                      </a>
                    )}
                  </div>
                </div>

                {/* Engagement Section for Creator Recipes */}
                {isCreatorRecipe && (
                  <div className="border-t pt-8 mt-4">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-xl">Community Discussion</h3>
                      <div className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full font-medium">
                        {views} {views === 1 ? 'View' : 'Views'}
                      </div>
                    </div>

                    <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2">
                      {comments.length === 0 ? (
                        <p className="text-muted-foreground text-sm text-center py-4">Be the first to share your thoughts!</p>
                      ) : (
                        comments.map((c, i) => (
                          <div key={i} className="bg-muted/30 p-4 rounded-xl border">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-sm">{c.userName}</span>
                              <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-foreground/90">{c.text}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {isAuthenticated ? (
                      <form onSubmit={handleAddComment} className="flex gap-3">
                        <input 
                          type="text" 
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Add a comment..."
                          className="flex-1 bg-background border rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <Button type="submit" disabled={commentLoading || !newComment.trim()}>
                          {commentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post"}
                        </Button>
                      </form>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center">Log in to join the discussion.</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}