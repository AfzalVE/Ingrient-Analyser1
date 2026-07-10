const BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

export async function analyzePhotos(files) {
  const form = new FormData();
  files.forEach((f) => form.append("photos", f));
  const res = await fetch(`${BASE}/analyze`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Analysis failed");
  return res.json();
}

export async function confirmIngredients(ingredients) {
  const res = await fetch(`${BASE}/pantry/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ingredients }),
  });
  if (!res.ok) throw new Error("Save failed");
  return res.json();
}
export async function generateRecipes(dishName = null) {

  const res = await fetch(`${BASE}/recipes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      dish_name: dishName
    })
  });

  return res.json();
}
export async function getPantry() {
  const res = await fetch(`${BASE}/pantry`);
  return res.json();
}

export async function deletePantryItem(id) {
  const res = await fetch(`${BASE}/pantry/${id}`, { method: "DELETE" });
  return res.json();
}
