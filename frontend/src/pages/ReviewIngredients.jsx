import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import IngredientChip from "../components/IngredientChip.jsx";
import { confirmIngredients } from "../api.js";

const CATEGORIES = ["produce", "dairy", "packaged", "spices", "canned", "frozen", "beverages"];

function emptyIngredient() {
  return {
    id: crypto.randomUUID(),
    name: "",
    category: "produce",
    quantity: 1,
    unit: "pcs",
    confidence: null,
    needs_confirmation: false,
  };
}

export default function ReviewIngredients({ scanState, setScanState }) {
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!scanState.result) {
      nav("/");
      return;
    }
    setItems(scanState.result.ingredients);
  }, [scanState.result]);

  const lowCount = items.filter((i) => i.needs_confirmation).length;

  function updateItem(id, next) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...next, needs_confirmation: false } : i)));
  }

  function removeItem(id) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function addManualItem() {
    setItems((prev) => [...prev, emptyIngredient()]);
  }

  async function saveToPantry() {
    setSaving(true);
    try {
      await confirmIngredients(items.filter((i) => i.name.trim()));
      setScanState({ files: [], result: null });
      nav("/pantry");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="screen review-screen">
      <div className="hero-text">
        <h1>Confirm Ingredients</h1>
        <p>
          {scanState.result?.photos_analyzed || 0} photo(s) scanned · {items.length} ingredients found
          {lowCount > 0 && <span className="low-note"> · {lowCount} need your confirmation</span>}
        </p>
      </div>

      <div className="chip-list">
        {items.map((item) => (
          <IngredientChip
            key={item.id}
            item={item}
            onChange={(next) => updateItem(item.id, next)}
            onRemove={() => removeItem(item.id)}
          />
        ))}
      </div>

      <button className="btn-ghost" onClick={addManualItem}>
        + Add ingredient manually
      </button>

      <div className="sticky-footer">
        <button className="btn-secondary" onClick={() => nav("/")}>
          Scan more photos
        </button>
        <button className="btn-primary btn-wide" disabled={saving} onClick={saveToPantry}>
          {saving ? "Saving…" : `Save ${items.length} to Pantry`}
        </button>
      </div>
    </div>
  );
}
