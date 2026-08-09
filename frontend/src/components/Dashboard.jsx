import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Loader2, Flame, Search as SearchIcon, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AnimatePresence } from "framer-motion";
import MealModel from "../context/MealModel";

export default function Dashboard() {
  const { user, authFetch } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [nutrition, setNutrition] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [mealLoading, setMealLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, nutritionRes] = await Promise.all([
        authFetch("/meals/stats"),
        authFetch("/nutrition/weekly")
      ]);

      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
      
      if (nutritionRes.ok) {
        const nutData = await nutritionRes.json();
        // format data for recharts
        const chartData = nutData.map(log => {
           // date is YYYY-MM-DD
           const dateStr = log.date;
           const d = new Date(dateStr);
           return {
             name: d.toLocaleDateString("en-US", { weekday: "short" }),
             calories: log.totalCalories,
             date: dateStr
           };
        });
        // Sort by date just in case
        chartData.sort((a, b) => new Date(a.date) - new Date(b.date));
        setNutrition(chartData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const maxCooked = stats?.frequentlyCooked?.[0]?.count || 1;
  const maxSearched = stats?.frequentlySearched?.[0]?.count || 1;

  const handleMealClick = async (mealId) => {
    setMealLoading(true);
    setSelectedMeal(null);
    try {
      const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`);
      const data = await res.json();
      if (data.meals && data.meals[0]) {
        setSelectedMeal(data.meals[0]);
      } else {
        // Fallback for creator recipes if we wanted to
        const crRes = await authFetch(`/recipes/${mealId}`);
        if (crRes.ok) {
          const crData = await crRes.json();
          setSelectedMeal(crData);
        }
      }
    } catch (err) {
      console.error("Failed to load meal details", err);
    } finally {
      setMealLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name}!</h1>
        <p className="text-muted-foreground mt-1">Here is your cooking and nutrition overview.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Nutrition Chart */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> 
              Weekly Calorie Intake
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nutrition.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={nutrition} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                      itemStyle={{ color: "hsl(var(--primary))" }}
                    />
                    <Area type="monotone" dataKey="calories" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorCalories)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No nutrition data found for this week.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Frequently Cooked */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              Frequently Cooked
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!stats?.frequentlyCooked?.length ? (
              <div className="text-muted-foreground text-center py-8">No data yet. Start cooking to see your top meals!</div>
            ) : (
              <div className="space-y-4">
                {stats.frequentlyCooked.map((item, idx) => (
                  <div 
                    key={item._id} 
                    className="flex items-center gap-4 cursor-pointer hover:bg-muted/50 p-2 rounded-xl transition-colors"
                    onClick={() => handleMealClick(item._id)}
                  >
                    <div className="text-xl font-bold text-muted-foreground w-6 text-center">#{idx + 1}</div>
                    <img src={item.mealThumb} alt={item.mealName} className="w-12 h-12 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate group-hover:text-primary transition-colors">{item.mealName}</div>
                      <div className="text-xs text-muted-foreground truncate">{item.category} • {item.area}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{item.count}</div>
                      <div className="text-xs text-muted-foreground">times</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Frequently Searched */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SearchIcon className="w-5 h-5 text-blue-500" />
              Top Searches
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!stats?.frequentlySearched?.length ? (
              <div className="text-muted-foreground text-center py-8">No searches yet.</div>
            ) : (
              <div className="space-y-4">
                {stats.frequentlySearched.map((item, idx) => (
                  <div key={item.ingredient} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">#{idx + 1} {item.ingredient}</span>
                      <span className="text-muted-foreground">{item.count} searches</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(item.count / maxSearched) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      <AnimatePresence>
        {selectedMeal && (
          <MealModel
            meal={selectedMeal}
            onClose={() => setSelectedMeal(null)}
            loading={mealLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
