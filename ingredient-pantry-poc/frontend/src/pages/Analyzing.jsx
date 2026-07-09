import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const MESSAGES = [
  "Looking closely at your photo…",
  "Spotting fresh produce…",
  "Reading packaging & labels…",
  "Matching quantities…",
];

export default function Analyzing({ scanState }) {
  const nav = useNavigate();
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (!scanState.files.length) {
      nav("/");
      return;
    }
    const t = setInterval(() => setMsgIndex((i) => (i + 1) % MESSAGES.length), 1100);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (scanState.result) nav("/review");
  }, [scanState.result]);

  return (
    <div className="screen analyzing-screen">
      <div className="scan-ring">
        <div className="scan-ring-core" />
        <div className="scan-sweep" />
      </div>
      <h2>Analyzing your ingredients</h2>
      <p className="analyzing-msg">{MESSAGES[msgIndex]}</p>
    </div>
  );
}
