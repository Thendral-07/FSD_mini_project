import "../styled/model.css";

export default function MealModel({ meal, onClose, loading }) {
  if (!meal) return null;

  // Extract ingredients and measures
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose}>✕</button>

        <img src={meal.strMealThumb} alt={meal.strMeal} />

        <h2>{meal.strMeal}</h2>

        {meal.strCategory && (
          <p className="meal-category">
            <strong>Category:</strong> {meal.strCategory}
            {meal.strArea && ` | ${meal.strArea}`}
          </p>
        )}

        {ingredients.length > 0 && (
          <div className="ingredients-section">
            <h3>Ingredients:</h3>
            <ul className="ingredients-list">
              {ingredients.map((item, idx) => (
                <li key={idx}>
                  <span className="ingredient-name">{item.ingredient}</span>
                  <span className="ingredient-measure">{item.measure}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {meal.strInstructions && (
          <div className="instructions-section">
            <h3>Instructions:</h3>
            <p className="instructions-text">{meal.strInstructions}</p>
          </div>
        )}

        {meal.strYoutube && (
          <a
            href={meal.strYoutube}
            target="_blank"
            rel="noreferrer"
            className="video-link"
          >
            <button className="yt-btn">▶ Watch Recipe on YouTube</button>
          </a>
        )}
      </div>
    </div>
  );
}