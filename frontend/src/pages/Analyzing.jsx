import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const MESSAGES = [
  "🔍 Scanning photo for ingredients & prepared dishes…",
  "🌿 Spotting fresh produce & herbs…",
  "📦 Reading packaging, cans & spice labels…",
  "⚖️ Calculating quantities & confidence levels…",
  "👨‍🍳 Crafting nutritional insights & recipe matches…",
];

const ICONS = ["🌿", "🍅", "🥦", "🧀", "🍚", "🥕", "🍗", "🍕"];

export default function Analyzing({ scanState }) {
  const nav = useNavigate();
  const [msgIndex, setMsgIndex] = useState(0);
  const [iconIndex, setIconIndex] = useState(0);

  useEffect(() => {
    if (!scanState.files || !scanState.files.length) {
      if (!scanState.result) {
        nav("/");
        return;
      }
    }
    const tMsg = setInterval(() => setMsgIndex((i) => (i + 1) % MESSAGES.length), 1600);
    const tIcon = setInterval(() => setIconIndex((i) => (i + 1) % ICONS.length), 800);
    return () => {
      clearInterval(tMsg);
      clearInterval(tIcon);
    };
  }, []);

  useEffect(() => {
    if (scanState.result) {
      nav("/review");
    }
  }, [scanState.result]);

  return (
    <div className="screen analyzing-screen">
      <div className="scan-ring">
        <div className="scan-ring-core">
          <span className="scan-animated-icon">{ICONS[iconIndex]}</span>
        </div>
        <div className="scan-sweep" />
      </div>
      <h2>AI Vision Scanner Active</h2>
      <p className="analyzing-msg">{MESSAGES[msgIndex]}</p>
      <div className="analyzing-progress-bar">
        <div className="analyzing-progress-fill"></div>
      </div>
    </div>
  );
}
