import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPantry, generateRecipes } from "../api";

export default function GenerateRecipes({ scanState, setScanState }) {
  const navigate = useNavigate();

  const [pantry, setPantry] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function load() {
      if (scanState?.result?.type === "dish") {
        setLoading(false);
        return;
      }

      try {
        const data = await getPantry();
        const items = data.pantry || [];
        setPantry(items);

        if (items.length > 0) {
          setGenerating(true);
          const recData = await generateRecipes();
          setRecipes(recData.recipes || []);
          setGenerating(false);
        }
      } catch (err) {
        console.error("Error loading recipes:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [scanState]);

  if (loading) {
    return (
      <div className="screen analyzing-screen">
        <h2>🍳 Preparing...</h2>
      </div>
    );
  }

  // ==========================
  // DISH MODE (Scanned Cooked Dish)
  // ==========================
  if (scanState?.result?.type === "dish") {
    const recipe = scanState.result.recipe;

    if (!recipe) {
      return (
        <div className="screen">
          <h2>No recipe found.</h2>
          <button
            className="btn-primary"
            onClick={() => {
              if (setScanState) setScanState({ files: [], result: null });
              navigate("/");
            }}
          >
            Scan Again
          </button>
        </div>
      );
    }

    return (
      <div className="screen recipes-screen">
        <RecipeCard
          recipe={recipe}
          onScanMore={() => {
            if (setScanState) setScanState({ files: [], result: null });
            navigate("/");
          }}
        />
      </div>
    );
  }

  // ==========================
  // PANTRY MODE
  // ==========================
  return (
    <div className="screen recipes-screen">
      <h1>AI Pantry Recipes</h1>
      <p>
        Generated directly from your <b>{pantry.length}</b> pantry ingredient{pantry.length !== 1 ? "s" : ""}.
      </p>

      {pantry.length > 0 && (
        <div className="recipe-source">
          {pantry.map((item) => (
            <span key={item.id} className="mini-chip">
              {item.name} ({item.quantity} {item.unit})
            </span>
          ))}
        </div>
      )}

      {generating && (
        <div className="analyzing-screen">
          <div className="scan-ring">
            <div className="scan-ring-core"></div>
            <div className="scan-sweep"></div>
          </div>
          <p className="analyzing-msg">👨‍🍳 AI Chef is crafting delicious recipes with what you have...</p>
        </div>
      )}

      {!generating && recipes.length > 0 && (
        <div className="recipes-list">
          {recipes.map((rec, i) => (
            <div key={rec.id || i} className="recipe-card-wrapper">
              <RecipeCard recipe={rec} />
            </div>
          ))}
        </div>
      )}

      {!generating && recipes.length === 0 && pantry.length > 0 && (
        <div className="empty-state">
          <h3>No recipes generated right now.</h3>
          <button className="btn-primary" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      )}

      {pantry.length === 0 && (
        <div className="empty-state">
          <h3>Your pantry is empty.</h3>
          <p>Add ingredients or scan your groceries first to get custom AI recipes right here!</p>
          <button
            className="btn-primary"
            onClick={() => {
              if (setScanState) setScanState({ files: [], result: null });
              navigate("/");
            }}
          >
            Scan Ingredients Now
          </button>
        </div>
      )}
    </div>
  );
}

function RecipeCard({ recipe, onScanMore }) {
  const ingredientsList = recipe.ingredients_used || recipe.ingredients || [];

  return (
    <div className="recipe-card">
      <h1 className="recipe-title">{recipe.title}</h1>
      <p className="recipe-desc">{recipe.description}</p>

      <div className="recipe-meta-tags">
        <span>⏱ {recipe.time}</span>
        <span>⭐ {recipe.difficulty}</span>
        <span>🍽 {recipe.servings} Servings</span>
      </div>

      <h2 className="recipe-section-title">Ingredients Used</h2>
      <div className="recipe-ingredients-list">
        {ingredientsList.map((item, index) => {
          const isObj = typeof item === "object" && item !== null;
          const name = isObj ? item.name : item;
          const amount = isObj && item.amount ? `— ${item.amount}` : "";
          const inPantry = isObj ? item.in_pantry : undefined;

          return (
            <div key={index} className="recipe-ing-item">
              <span className="recipe-ing-name">
                {name} <small className="recipe-ing-amount">{amount}</small>
              </span>
              {typeof inPantry === "boolean" && (
                <span className={`ing-pantry-badge ${inPantry ? "badge-have" : "badge-need"}`}>
                  {inPantry ? "✅ Available in Pantry" : "🛒 Needed"}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <h2 className="recipe-section-title">Steps</h2>
      <ol className="recipe-steps-list">
        {recipe.steps?.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ol>

      {recipe.nutrition && (
        <>
          <h2 className="recipe-section-title">Nutrition</h2>
          <div className="recipe-nutrition-grid">
            <div><strong>Calories:</strong> {recipe.nutrition.calories}</div>
            <div><strong>Protein:</strong> {recipe.nutrition.protein}</div>
            <div><strong>Carbs:</strong> {recipe.nutrition.carbs}</div>
            <div><strong>Fat:</strong> {recipe.nutrition.fat}</div>
          </div>
        </>
      )}

      {recipe.tips && recipe.tips.length > 0 && (
        <>
          <h2 className="recipe-section-title">Chef Tips</h2>
          <ul className="recipe-tips-list">
            {recipe.tips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </>
      )}

      {onScanMore && (
        <button className="btn-secondary" style={{ marginTop: "16px" }} onClick={onScanMore}>
          Scan Another Image
        </button>
      )}
    </div>
  );
}