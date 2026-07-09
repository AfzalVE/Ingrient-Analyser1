export default function IngredientChip({ item, onChange, onRemove }) {
  const low = item.needs_confirmation;

  return (
    <div className={`chip ${low ? "chip-low" : ""}`}>
      {low && <span className="chip-flag" title="Low confidence — please confirm">⚠</span>}

      <input
        className="chip-name"
        value={item.name}
        onChange={(e) => onChange({ ...item, name: e.target.value })}
      />

      <div className="chip-qty">
        <input
          type="number"
          min="0"
          step="0.5"
          className="chip-qty-input"
          value={item.quantity}
          onChange={(e) => onChange({ ...item, quantity: parseFloat(e.target.value) || 0 })}
        />
        <input
          className="chip-unit-input"
          value={item.unit}
          onChange={(e) => onChange({ ...item, unit: e.target.value })}
        />
      </div>

      <span className="chip-category">{item.category}</span>

      {typeof item.confidence === "number" && (
        <span className="chip-confidence">{Math.round(item.confidence * 100)}%</span>
      )}

      <button className="chip-remove" onClick={onRemove} aria-label="Remove ingredient">
        ✕
      </button>
    </div>
  );
}
