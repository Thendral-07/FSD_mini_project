import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { ChevronLeft, ChevronRight, Loader2, Plus, Trash2, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MealModel from "../context/MealModel";

export default function Planner() {
  const { authFetch } = useContext(AuthContext);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [mealDetailsLoading, setMealDetailsLoading] = useState(false);
  
  const dateString = currentDate.toISOString().split("T")[0]; // YYYY-MM-DD

  useEffect(() => {
    fetchPlan(dateString);
  }, [dateString]);

  const fetchPlan = async (dateStr) => {
    setLoading(true);
    try {
      const res = await authFetch(`/planner/${dateStr}`);
      const data = await res.json();
      setPlan(data.meals || { breakfast: [], lunch: [], dinner: [], snacks: [] });
    } catch (err) {
      console.error(err);
      setPlan({ breakfast: [], lunch: [], dinner: [], snacks: [] });
    } finally {
      setLoading(false);
    }
  };

  const changeDate = (days) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };

  const removeMeal = async (type, mealId) => {
    const updatedMeals = {
      ...plan,
      [type]: plan[type].filter(m => m.mealId !== mealId)
    };
    
    setPlan(updatedMeals); // optimistic update

    try {
      await authFetch(`/planner/${dateString}`, {
        method: "PUT",
        body: JSON.stringify({ meals: updatedMeals })
      });
    } catch (err) {
      console.error(err);
      fetchPlan(dateString); // revert on error
    }
  };

  const openMealDetails = async (mealId) => {
    setMealDetailsLoading(true);
    // Optimistically open modal with loading state
    setSelectedMeal({ idMeal: mealId, strMeal: "Loading...", strMealThumb: "" });
    try {
      // Assuming it's from TheMealDB. If it's a creator recipe, we'd fetch from our backend.
      // For now, try TheMealDB first
      let res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`);
      let data = await res.json();
      if (data.meals && data.meals.length > 0) {
        setSelectedMeal(data.meals[0]);
      } else {
        // Fallback to our backend if not in TheMealDB (e.g., Creator recipe)
        res = await authFetch(`/meals/${mealId}`);
        if (res.ok) {
          data = await res.json();
          setSelectedMeal(data);
        }
      }
    } catch (err) {
      console.error("Error fetching meal details:", err);
    } finally {
      setMealDetailsLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${searchQuery}`);
      const data = await res.json();
      setSearchResults(data.meals || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  };

  const mealTypes = [
    { id: "breakfast", label: "Breakfast" },
    { id: "lunch", label: "Lunch" },
    { id: "dinner", label: "Dinner" },
    { id: "snacks", label: "Snacks" },
  ];

  return (
    <div className="max-w-5xl mx-auto w-full space-y-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card p-6 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-3xl font-bold">Meal Planner</h1>
          <p className="text-muted-foreground mt-1">Plan your meals for the day.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => changeDate(-1)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="text-lg font-semibold min-w-[150px] text-center">
            {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
          <Button variant="outline" size="icon" onClick={() => changeDate(1)}>
            <ChevronRight className="w-5 h-5" />
          </Button>
          <Button onClick={() => setSearchOpen(true)} className="ml-2">
            <Search className="w-4 h-4 mr-2" /> Find Meals
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {mealTypes.map(({ id, label }) => (
            <Card key={id} className="overflow-hidden">
              <CardHeader className="bg-muted/30 border-b pb-4 flex flex-row items-center justify-between">
                <CardTitle>{label}</CardTitle>
                <Button variant="ghost" size="sm" className="h-8 text-primary" onClick={() => setSearchOpen(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <AnimatePresence>
                  {plan?.[id]?.length > 0 ? (
                    <div className="divide-y">
                      {plan[id].map(meal => (
                        <motion.div 
                          key={meal.mealId}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center gap-4 p-4 hover:bg-muted/20 transition-colors group cursor-pointer"
                          onClick={() => openMealDetails(meal.mealId)}
                        >
                          <img src={meal.mealThumb} alt={meal.mealName} className="w-16 h-16 rounded-xl object-cover" />
                          <div className="flex-1 font-medium group-hover:text-primary transition-colors">{meal.mealName}</div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive z-10" 
                            onClick={(e) => {
                              e.stopPropagation();
                              removeMeal(id, meal.mealId);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                      No meals planned for {label.toLowerCase()}.
                    </div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSearchOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl max-h-[80vh] bg-background rounded-3xl shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold text-lg flex items-center gap-2"><Search className="w-5 h-5"/> Search Meals</h3>
                <button onClick={() => setSearchOpen(false)} className="w-8 h-8 flex items-center justify-center bg-muted rounded-full hover:bg-destructive hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Search by meal name..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-muted px-4 py-2 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button type="submit" disabled={searchLoading}>
                    {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                  </Button>
                </form>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {searchResults.map(meal => (
                  <div key={meal.idMeal} className="flex items-center gap-4 bg-muted/30 p-3 rounded-xl border hover:border-primary transition-colors cursor-pointer" onClick={() => setSelectedMeal(meal)}>
                    <img src={meal.strMealThumb} alt={meal.strMeal} className="w-12 h-12 rounded-lg object-cover" />
                    <div className="flex-1">
                      <div className="font-semibold">{meal.strMeal}</div>
                      <div className="text-xs text-muted-foreground">{meal.strCategory} • {meal.strArea}</div>
                    </div>
                  </div>
                ))}
                {searchResults.length === 0 && !searchLoading && searchQuery && (
                  <div className="text-center text-muted-foreground py-10">No meals found.</div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedMeal && (
          <MealModel
            meal={selectedMeal}
            loading={mealDetailsLoading}
            onClose={() => {
              setSelectedMeal(null);
              fetchPlan(dateString); // Refresh plan when modal closes just in case they added
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
