import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import AddIngredients from "./pages/AddIngredients.jsx";
import Analyzing from "./pages/Analyzing.jsx";
import ReviewIngredients from "./pages/ReviewIngredients.jsx";
import Pantry from "./pages/Pantry.jsx";
import GenerateRecipes from "./pages/GenerateRecipes.jsx";
import { useState } from "react";

export default function App() {
  const [scanState, setScanState] = useState({ files: [], result: null });
  const nav = useNavigate();
  const loc = useLocation();

  const tabs = [
    { path: "/", label: "Scan" },
    { path: "/pantry", label: "Pantry" },
    { path: "/recipes", label: "Recipes" },
  ];

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">🌿</span> PantryScan
        </div>
        <nav className="tabs">
          {tabs.map((t) => (
            <button
              key={t.path}
              className={`tab ${loc.pathname === t.path ? "active" : ""}`}
              onClick={() => nav(t.path)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="page-area">
        <Routes>
          <Route
            path="/"
            element={<AddIngredients scanState={scanState} setScanState={setScanState} />}
          />
          <Route
            path="/analyzing"
            element={<Analyzing scanState={scanState} setScanState={setScanState} />}
          />
          <Route
            path="/review"
            element={<ReviewIngredients scanState={scanState} setScanState={setScanState} />}
          />
          <Route path="/pantry" element={<Pantry />} />
          <Route path="/recipes" element={<GenerateRecipes />} />
        </Routes>
      </main>
    </div>
  );
}
