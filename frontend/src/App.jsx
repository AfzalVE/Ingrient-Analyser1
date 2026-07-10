import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

import AddIngredients from "./pages/AddIngredients.jsx";
import Analyzing from "./pages/Analyzing.jsx";
import ReviewIngredients from "./pages/ReviewIngredients.jsx";
import Pantry from "./pages/Pantry.jsx";
import GenerateRecipes from "./pages/GenerateRecipes.jsx";

export default function App() {
  const [scanState, setScanState] = useState({
    files: [],
    result: null,
  });

  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { path: "/", label: "Scan" },
    { path: "/pantry", label: "Pantry" },
    { path: "/recipes", label: "Recipes" },
  ];

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">🌿</span>
          PantryScan
        </div>

        <nav className="tabs">
          {tabs.map((tab) => (
            <button
              key={tab.path}
              className={`tab ${location.pathname === tab.path ? "active" : ""
                }`}
              onClick={() => navigate(tab.path)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="page-area">
        <Routes>
          <Route
            path="/"
            element={
              <AddIngredients
                scanState={scanState}
                setScanState={setScanState}
              />
            }
          />

          <Route
            path="/analyzing"
            element={
              <Analyzing
                scanState={scanState}
                setScanState={setScanState}
              />
            }
          />

          <Route
            path="/review"
            element={
              <ReviewIngredients
                scanState={scanState}
                setScanState={setScanState}
              />
            }
          />

          <Route path="/pantry" element={<Pantry />} />

          <Route
            path="/recipes"
            element={
              <GenerateRecipes
                scanState={scanState}
                setScanState={setScanState}
              />
            }
          />
        </Routes>
      </main>
    </div>
  );
}