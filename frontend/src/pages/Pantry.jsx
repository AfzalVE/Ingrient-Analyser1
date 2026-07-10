import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPantry, deletePantryItem } from "../api.js";

export default function Pantry({ setScanState }) {
  const [pantry, setPantry] = useState([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  async function load() {
    setLoading(true);
    const data = await getPantry();
    setPantry(data.pantry);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id) {
    const data = await deletePantryItem(id);
    setPantry(data.pantry);
  }

  const grouped = pantry.reduce((acc, item) => {
    (acc[item.category] ||= []).push(item);
    return acc;
  }, {});

  return (
    <div className="screen pantry-screen">
      <div className="hero-text">
        <h1>Your Pantry</h1>
        <p>{pantry.length} ingredients ready for recipes</p>
      </div>

      {loading && <p className="muted">Loading…</p>}

      {!loading && pantry.length === 0 && (
        <div className="empty-state">
          <p>Your pantry is empty.</p>
          <button
            className="btn-primary"
            onClick={() => {
              if (setScanState) setScanState({ files: [], result: null });
              nav("/");
            }}
          >
            Scan your first ingredients
          </button>
        </div>
      )}

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="pantry-group">
          <h3 className="pantry-group-title">{category}</h3>
          <div className="pantry-items">
            {items.map((item) => (
              <div key={item.id} className="pantry-row">
                <span className="pantry-item-name">{item.name}</span>
                <span className="pantry-item-qty">
                  {item.quantity} {item.unit}
                </span>
                <button className="chip-remove" onClick={() => remove(item.id)}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {pantry.length > 0 && (
        <div className="sticky-footer">
          <button
            className="btn-secondary"
            onClick={() => {
              if (setScanState) setScanState({ files: [], result: null });
              nav("/");
            }}
          >
            Scan more
          </button>
          <button className="btn-primary btn-wide" onClick={() => nav("/recipes")}>
            Generate Recipes →
          </button>
        </div>
      )}
    </div>
  );
}
