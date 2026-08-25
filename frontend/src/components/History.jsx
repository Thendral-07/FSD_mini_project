import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { lookupMeal, MealApiError } from "../utils/mealdbClient";
import MealModel from "../context/MealModel";
import "../styled/history.css";

export default function History() {
  const { authFetch } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [mealLoading, setMealLoading] = useState(false);
  const [mealError, setMealError] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await authFetch("/meals/history");
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      } else {
        setError("Failed to load history.");
      }
    } catch {
      setError("Failed to load history.");
    } finally {
      setLoading(false);
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
      // Fallback to stored data
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

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="history-page">
        <h1>🍳 Cook History</h1>
        <div className="history-skeleton">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="skeleton-item"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="history-page">
      <h1>🍳 Cook History</h1>
      <p className="history-subtitle">All the meals you've cooked — your culinary journey!</p>

      {error && <p className="history-error">{error}</p>}

      {history.length === 0 ? (
        <div className="history-empty">
          <span className="empty-icon">📭</span>
          <h3>No cooked meals yet</h3>
          <p>Start cooking and mark meals as "I Cooked This!" to see them here.</p>
        </div>
      ) : (
        <div className="history-timeline">
          {history.map((item, idx) => (
            <div
              key={item._id || idx}
              className="history-card"
              onClick={() => openMeal(item)}
            >
              <div className="history-card-img">
                <img src={item.mealThumb} alt={item.mealName} />
              </div>
              <div className="history-card-info">
                <h3>{item.mealName}</h3>
                <div className="history-meta">
                  {item.category && <span className="meta-tag">{item.category}</span>}
                  {item.area && <span className="meta-tag">{item.area}</span>}
                </div>
                <p className="history-date">🕐 {formatDate(item.cookedAt)}</p>
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
