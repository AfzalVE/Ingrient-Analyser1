import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPantry } from "../api.js";

export default function GenerateRecipes() {
  const [pantry, setPantry] = useState([]);
  const nav = useNavigate();

  useEffect(() => {
    getPantry().then((d) => setPantry(d.pantry));
  }, []);

  return (
    <div className="screen recipes-screen">
      <div className="hero-text">
        <h1>Generate Recipes</h1>
        <p>Using {pantry.length} ingredients from your pantry.</p>
      </div>

      <div className="recipe-source">
        {pantry.slice(0, 12).map((i) => (
          <span key={i.id} className="mini-chip">
            {i.name}
          </span>
        ))}
        {pantry.length > 12 && <span className="mini-chip muted">+{pantry.length - 12} more</span>}
      </div>

      <div className="empty-state">
        <p>Recipe generation isn't wired up in this POC yet — this is where results would appear.</p>
        <button className="btn-secondary" onClick={() => nav("/pantry")}>
          ← Back to Pantry
        </button>
      </div>
    </div>
  );
}
