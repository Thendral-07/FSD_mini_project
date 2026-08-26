import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { lookupMeal, MealApiError } from "../utils/mealdbClient";
import MealModel from "../context/MealModel";
import "../styled/favorites.css";

export default function Favorites() {
  const { authFetch } = useContext(AuthContext);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [mealLoading, setMealLoading] = useState(false);
  const [mealError, setMealError] = useState(null);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const res = await authFetch("/meals/favorites");
      if (res.ok) {
        const data = await res.json();
        setFavorites(data);
      } else {
        setError("Failed to load favorites.");
      }
    } catch {
      setError("Failed to load favorites.");
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (e, mealId, mealName) => {
    e.stopPropagation();
    try {
      const res = await authFetch("/meals/favorite", {
        method: "POST",
        body: JSON.stringify({ mealId, mealName }),
      });
      if (res.ok) {
        setFavorites((prev) => prev.filter((f) => f.mealId !== mealId));
      }
    } catch (err) {
      console.error("Remove favorite error:", err);
    }
  };

  const openMeal = async (item) => {
    setMealLoading(true);
    setMealError(null);
    try {
      const meal = await lookupMeal(item.mealId);
      if (meal) {
        setSelectedMeal(meal);
      } else {
        setSelectedMeal({
          idMeal: item.mealId,
          strMeal: item.mealName,
          strMealThumb: item.mealThumb,
          strCategory: item.category,
          strArea: item.area,
        });
      }
    } catch (err) {
      if (err instanceof MealApiError && err.code === "RATE_LIMITED") {
        setMealError(err.message);
      }
      setSelectedMeal({
        idMeal: item.mealId,
        strMeal: item.mealName,
        strMealThumb: item.mealThumb,
        strCategory: item.category,
        strArea: item.area,
      });
    } finally {
      setMealLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="favorites-page">
        <h1>My Favorites</h1>
        <div className="favorites-grid">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="skeleton-card"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="favorites-page">
      <h1>My Favorites</h1>
      <p className="favorites-subtitle">
        Your saved meals — quick access to what you love
      </p>

      {error && <p className="favorites-error">{error}</p>}

      {favorites.length === 0 ? (
        <div className="favorites-empty">
          <h3>No favorites yet</h3>
          <p>Tap the heart on any meal to save it here.</p>
        </div>
      ) : (
        <div className="favorites-grid">
          {favorites.map((item) => (
            <div
              key={item._id}
              className="fav-card"
              onClick={() => openMeal(item)}
            >
              <div className="fav-card-img">
                <img src={`${item.mealThumb}/preview`} alt={item.mealName} loading="lazy" />
                <button
                  className="fav-remove"
                  onClick={(e) => removeFavorite(e, item.mealId, item.mealName)}
                  title="Remove from favorites"
                >
                  ✕
                </button>
              </div>
              <div className="fav-card-body">
                <h3>{item.mealName}</h3>
                <div className="fav-tags">
                  {item.category && <span className="fav-tag">{item.category}</span>}
                  {item.area && <span className="fav-tag">{item.area}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedMeal && (
        <MealModel
          meal={selectedMeal}
          error={mealError}
          onClose={() => {
            setSelectedMeal(null);
            setMealError(null);
          }}
          loading={mealLoading}
        />
      )}
    </div>
  );
}
