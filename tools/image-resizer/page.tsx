"use client";

import { useState, useCallback, useRef } from "react";

type Mode = "pixels" | "filesize";

export default function ImageResizer() {
  const [image, setImage] = useState<{ src: string; name: string; origWidth: number; origHeight: number } | null>(null);
  const [mode, setMode] = useState<Mode>("pixels");
  const [origFileSize, setOrigFileSize] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [lockAspect, setLockAspect] = useState(true);

  const [targetSize, setTargetSize] = useState(100);
  const [targetUnit, setTargetUnit] = useState<"KB" | "MB">("KB");
  const [compQuality, setCompQuality] = useState(0.8);
  const [resultSize, setResultSize] = useState<number | null>(null);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOrigFileSize(file.size);

    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const img = new Image();
      img.onload = () => {
        setImage({ src, name: file.name, origWidth: img.naturalWidth, origHeight: img.naturalHeight });
        setWidth(img.naturalWidth);
        setHeight(img.naturalHeight);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleWidthChange = useCallback((w: number) => {
    setWidth(w);
    if (lockAspect && image) {
      setHeight(Math.round(w * (image.origHeight / image.origWidth)));
    }
  }, [lockAspect, image]);

  const handleHeightChange = useCallback((h: number) => {
    setHeight(h);
    if (lockAspect && image) {
      setWidth(Math.round(h * (image.origWidth / image.origHeight)));
    }
  }, [lockAspect, image]);

  const toggleLock = useCallback(() => setLockAspect((p) => !p), []);

  const resize = useCallback(async () => {
    if (!image) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = image.src;
    await new Promise<void>((r) => { img.onload = () => r(); });

    if (mode === "pixels") {
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) => {
        if (!blob) return;
        setResultSize(blob.size);
        download(blob, image.name.replace(/(\.[^.]+)$/, `_${width}x${height}$1`));
      }, "image/png");
    } else {
      const targetBytes = targetUnit === "KB" ? targetSize * 1024 : targetSize * 1024 * 1024;
      let q = compQuality;
      let blob: Blob | null = null;

      canvas.width = image.origWidth;
      canvas.height = image.origHeight;
      const ctx = canvas.getContext("2d")!;

      const format = image.name.endsWith(".png") ? "image/png" : "image/jpeg";

      // JPEG: adjust quality; PNG: adjust dimensions
      if (format === "image/jpeg") {
        for (let i = 0; i < 8; i++) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", q));
          if (!blob) break;
          const ratio = targetBytes / blob.size;
          q = Math.min(1, Math.max(0.01, q * Math.sqrt(ratio)));
          if (Math.abs(blob.size - targetBytes) / targetBytes < 0.15) break;
        }
      } else {
        let scale = Math.sqrt(targetBytes / origFileSize);
        scale = Math.min(1, Math.max(0.05, scale));
        canvas.width = Math.round(image.origWidth * scale);
        canvas.height = Math.round(image.origHeight * scale);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), "image/png"));
      }

      if (blob) {
        setResultSize(blob.size);
        download(blob, image.name.replace(/(\.[^.]+)$/, `_resized$1`));
      }
    }
  }, [image, mode, width, height, targetSize, targetUnit, compQuality, origFileSize]);

  const download = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="tool-header"><h1>图片缩放</h1></div>

      <div className="tool-layout">
        <div className="config-side">
          <label className="field">
            <span>上传图片</span>
            <input type="file" accept="image/*" onChange={handleFile} />
          </label>

          {image && (
            <>
              <div className="mode-tabs">
                <button className={`mode-tab ${mode === "pixels" ? "active" : ""}`} onClick={() => setMode("pixels")}>按像素</button>
                <button className={`mode-tab ${mode === "filesize" ? "active" : ""}`} onClick={() => setMode("filesize")}>按文件大小</button>
              </div>

              {mode === "pixels" ? (
                <>
                  <label className="field">
                    <span>原图尺寸: {image.origWidth} × {image.origHeight}</span>
                  </label>
                  <div className="dim-row">
                    <label className="field">
                      <span>宽度</span>
                      <input type="number" min={1} max={10000} value={width} onChange={(e) => handleWidthChange(parseInt(e.target.value) || 1)} />
                    </label>
                    <span className="lock-btn" onClick={toggleLock} title={lockAspect ? "已锁定比例" : "未锁定"}>
                      {lockAspect ? "🔗" : "🔓"}
                    </span>
                    <label className="field">
                      <span>高度</span>
                      <input type="number" min={1} max={10000} value={height} onChange={(e) => handleHeightChange(parseInt(e.target.value) || 1)} />
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <label className="field">
                    <span>原始大小: {origFileSize < 1024 * 1024 ? `${(origFileSize / 1024).toFixed(1)} KB` : `${(origFileSize / 1024 / 1024).toFixed(2)} MB`}</span>
                  </label>
                  <div className="dim-row">
                    <label className="field">
                      <span>目标大小</span>
                      <input type="number" min={1} value={targetSize} onChange={(e) => setTargetSize(parseInt(e.target.value) || 1)} />
                    </label>
                    <div className="check-row" style={{ alignSelf: "end" }}>
                      <button className={`check-btn ${targetUnit === "KB" ? "active" : ""}`} onClick={() => setTargetUnit("KB")}>KB</button>
                      <button className={`check-btn ${targetUnit === "MB" ? "active" : ""}`} onClick={() => setTargetUnit("MB")}>MB</button>
                    </div>
                  </div>
                </>
              )}

              <button className="btn btn-accent btn-lg" onClick={resize}>
                缩放 →
              </button>

              {resultSize !== null && (
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem" }}>
                  输出大小: {resultSize < 1024 * 1024 ? `${(resultSize / 1024).toFixed(1)} KB` : `${(resultSize / 1024 / 1024).toFixed(2)} MB`}
                </p>
              )}
            </>
          )}
        </div>

        <div className="preview-side">
          {image ? (
            <div className="preview-wrap">
              <p className="preview-label">原图预览</p>
              <img src={image.src} alt="preview" className="preview-img" />
              <p className="preview-name">{image.name}</p>
            </div>
          ) : (
            <div className="preview-placeholder">选择图片后预览</div>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      <style jsx>{`
        .tool-header { margin-bottom: 24px; }
        .tool-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: start; }
        .config-side { display: grid; gap: 20px; }
        .preview-side { display: grid; gap: 12px; }
        .field { display: grid; gap: 8px; }
        .field span {
          font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.06em; color: var(--muted);
        }
        .field input[type="file"] { font-size: 0.85rem; }
        .field input[type="number"] { width: 100%; }
        .mode-tabs { display: flex; gap: 0; }
        .mode-tab {
          flex: 1; border: var(--border-width) solid var(--border); padding: 10px 16px;
          font-family: inherit; font-size: 0.85rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.06em; background: var(--panel-bg); color: var(--muted); cursor: pointer;
        }
        .mode-tab:first-child { border-right: none; }
        .mode-tab.active { background: var(--fg); color: var(--bg); border-color: var(--fg); }
        .dim-row { display: flex; align-items: flex-end; gap: 12px; }
        .dim-row .field { flex: 1; }
        .lock-btn { font-size: 1.2rem; cursor: pointer; padding: 8px; align-self: center; user-select: none; }
        .check-row { display: flex; gap: 8px; align-items: flex-end; }
        .check-btn {
          padding: 10px 16px; border: var(--border-width) solid var(--border);
          font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; font-weight: 700;
          cursor: pointer; background: var(--panel-bg); color: var(--muted);
        }
        .check-btn.active { background: var(--fg); color: var(--bg); border-color: var(--fg); }
        .btn-lg { padding: 14px 24px; font-size: 1rem; justify-content: center; }
        .preview-wrap {
          border: var(--border-width) solid var(--border); background: var(--panel-bg); padding: 16px;
        }
        .preview-label {
          font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.06em; color: var(--muted); margin-bottom: 12px;
        }
        .preview-img { max-width: 100%; max-height: 360px; display: block; margin: 0 auto; }
        .preview-name {
          font-family: 'JetBrains Mono', monospace; font-size: 0.75rem;
          color: var(--muted); margin-top: 12px; text-align: center; word-break: break-all;
        }
        .preview-placeholder {
          height: 300px; border: var(--border-width) dashed var(--border);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.85rem; color: var(--muted); background: var(--panel-bg);
        }
      `}</style>
    </div>
  );
}
