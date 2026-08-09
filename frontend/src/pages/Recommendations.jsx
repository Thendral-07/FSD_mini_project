import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";
import MealCard from "../components/MealCard";

export default function Recommendations() {
  const { authFetch } = useContext(AuthContext);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const res = await authFetch("/recommendations/daily");
      if (!res.ok) {
        if (res.status === 404) {
          setError("Please complete your profile to get recommendations.");
          return;
        }
        throw new Error("Failed to fetch recommendations.");
      }
      const data = await res.json();
      setRecommendations(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
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

  return (
    <div className="max-w-6xl mx-auto w-full space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-yellow-500" />
          Daily Recommendations
        </h1>
        <p className="text-muted-foreground mt-1">Smart suggestions tailored to your profile and fitness goals.</p>
      </div>

      {error ? (
        <div className="flex items-center gap-3 p-4 bg-destructive/10 text-destructive rounded-xl font-medium">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations?.suggestions?.map((suggestion, index) => (
            <Card key={index} className="overflow-hidden border-primary/20">
              <CardHeader className="bg-primary/5 pb-4">
                <CardTitle className="text-primary text-lg flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Recommended
                </CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-2">{suggestion.reason}</p>
              </CardHeader>
              <CardContent className="p-4">
                <MealCard meal={suggestion.meal} favoriteIds={[]} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
