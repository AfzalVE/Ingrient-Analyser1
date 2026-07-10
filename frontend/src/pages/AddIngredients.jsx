import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { analyzePhotos } from "../api.js";

export default function AddIngredients({ scanState, setScanState }) {
  const cameraInput = useRef(null);
  const galleryInput = useRef(null);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    if (scanState.result) {
      setScanState((s) => ({ ...s, result: null }));
    }
  }, []);

  function handleFiles(fileList) {
    const files = Array.from(fileList);
    if (!files.length) return;
    setError(null);
    setScanState({ files, result: null });
    setPreviews(files.map((f) => URL.createObjectURL(f)));
    if (cameraInput.current) cameraInput.current.value = "";
    if (galleryInput.current) galleryInput.current.value = "";
  }

  async function startScan() {
    if (!scanState.files.length) return;

    const currentFiles = scanState.files;
    setScanState({ files: currentFiles, result: null });
    nav("/analyzing");

    try {
      const result = await analyzePhotos(currentFiles);

      setScanState({
        files: currentFiles,
        result,
      });

      // Navigate to review so user can confirm/edit both grocery ingredients and ready food dish ingredients
      nav("/review");

    } catch (err) {
      console.error(err);
      setError("Couldn't analyze those photos. Try again.");
      nav("/");
    }
  }
  return (
    <div className="screen add-screen">
      <div className="hero-text">
        <h1>Add Ingredients</h1>
        <p>Snap or upload a photo of your groceries. We'll detect what's inside.</p>
      </div>

      <div className="capture-actions">
        <button className="btn-primary btn-large" onClick={() => cameraInput.current.click()}>
          <span className="btn-icon">📷</span> Take Photo
        </button>
        <button className="btn-secondary btn-large" onClick={() => galleryInput.current.click()}>
          <span className="btn-icon">🖼️</span> Upload from Gallery
        </button>
        <input
          ref={cameraInput}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
        <input
          ref={galleryInput}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && <div className="error-banner">{error}</div>}

      {previews.length > 0 && (
        <div className="preview-panel">
          <div className="preview-grid">
            {previews.map((src, i) => (
              <img key={i} src={src} alt={`selected ${i}`} className="preview-thumb" />
            ))}
          </div>
          <div className="preview-meta">
            {previews.length} photo{previews.length > 1 ? "s" : ""} selected
          </div>
          <button className="btn-primary btn-wide" onClick={startScan}>
            Scan Ingredients →
          </button>
        </div>
      )}
    </div>
  );
}
