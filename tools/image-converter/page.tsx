"use client";

import { useState, useCallback, useRef } from "react";

const FORMATS = [
  { ext: "png", label: "PNG", mime: "image/png" },
  { ext: "jpeg", label: "JPEG", mime: "image/jpeg" },
  { ext: "webp", label: "WebP", mime: "image/webp" },
] as const;

export default function ImageConverter() {
  const [image, setImage] = useState<{ src: string; name: string; type: string } | null>(null);
  const [format, setFormat] = useState<"png" | "jpeg" | "webp">("png");
  const [quality, setQuality] = useState(0.92);
  const [svgSize, setSvgSize] = useState(800);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isSvg = image?.type === "image/svg+xml" || image?.name?.endsWith(".svg");

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImage({ src: reader.result as string, name: file.name, type: file.type });
    };
    reader.readAsDataURL(file);
  }, []);

  const convert = useCallback(async () => {
    if (!image) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = image.src;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to load image"));
    });

    canvas.width = img.naturalWidth || svgSize;
    canvas.height = img.naturalHeight || svgSize;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const mime = FORMATS.find((f) => f.ext === format)!.mime;
    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), mime, quality)
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${image.name.replace(/\.[^.]+$/, "")}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [image, format, quality, svgSize]);

  return (
    <div>
      <div className="tool-header"><h1>图片格式互转</h1></div>

      <div className="tool-layout">
        <div className="config-side">
          <label className="field">
            <span>上传图片 (PNG / JPEG / WebP / SVG)</span>
            <input type="file" accept=".png,.jpg,.jpeg,.webp,.svg,image/*" onChange={handleFile} />
          </label>

          {image && (
            <>
              <label className="field">
                <span>输出格式</span>
                <div className="check-row">
                  {FORMATS.map((f) => (
                    <button
                      key={f.ext}
                      className={`check-btn ${format === f.ext ? "active" : ""}`}
                      onClick={() => setFormat(f.ext)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </label>

              {format === "jpeg" && (
                <label className="field">
                  <span>质量 ({Math.round(quality * 100)}%)</span>
                  <input type="range" min={0.1} max={1} step={0.01} value={quality} onChange={(e) => setQuality(parseFloat(e.target.value))} />
                </label>
              )}

              {isSvg && (
                <label className="field">
                  <span>SVG 渲染尺寸 ({svgSize}px)</span>
                  <input type="range" min={200} max={4000} step={50} value={svgSize} onChange={(e) => setSvgSize(parseInt(e.target.value))} />
                </label>
              )}

              <button className="btn btn-accent btn-lg" onClick={convert}>
                转换为 .{format.toUpperCase()} →
              </button>
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
        .field input[type="range"] { accent-color: var(--accent); height: 6px; }
        .check-row { display: flex; gap: 8px; }
        .check-btn {
          padding: 8px 16px; border: var(--border-width) solid var(--border);
          font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; font-weight: 700;
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
