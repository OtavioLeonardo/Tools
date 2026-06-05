"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";

interface ColorItem {
  hex: string;
  rgb: [number, number, number];
  count: number;
  percent: number;
}

function extractPalette(imageData: ImageData, maxColors = 8): ColorItem[] {
  const { data } = imageData;
  const colorMap = new Map<string, number>();

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a < 128) continue;
    const qr = Math.round(r / 32) * 32;
    const qg = Math.round(g / 32) * 32;
    const qb = Math.round(b / 32) * 32;
    const key = `${qr},${qg},${qb}`;
    colorMap.set(key, (colorMap.get(key) || 0) + 1);
  }

  const total = Array.from(colorMap.values()).reduce((a, b) => a + b, 0);
  const entries = Array.from(colorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxColors);

  return entries.map(([key, count]) => {
    const [r, g, b] = key.split(",").map(Number);
    const hex = `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
    return { hex, rgb: [r, g, b], count, percent: Math.round((count / total) * 100) };
  });
}

export default function ImagePalette() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [colors, setColors] = useState<ColorItem[]>([]);
  const [mainColor, setMainColor] = useState<ColorItem | null>(null);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      setImage(src);
    };
    reader.readAsDataURL(file);
  }, []);

  const onImageLoad = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const scale = Math.min(1, 200 / Math.max(img.naturalWidth, img.naturalHeight));
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);

    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const palette = extractPalette(imageData, 8);
    setColors(palette);
    setMainColor(palette[0] || null);
  }, []);

  const copyColor = useCallback(async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
    } catch {
      const el = document.createElement("textarea");
      el.value = hex;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
  }, []);

  return (
    <div>
      <div className="tool-header"><h1>图片取色器</h1></div>

      <div className="tool-layout">
        <div className="config-side">
          <label className="field">
            <span>上传图片</span>
            <input type="file" accept="image/*" onChange={handleFile} />
          </label>

          {mainColor && (
            <div className="main-color-preview" style={{ background: mainColor.hex }}>
              <span style={{ color: isLight(mainColor.rgb) ? "#111" : "#fff" }}>
                {mainColor.hex} — {mainColor.percent}%
              </span>
            </div>
          )}

          {colors.length > 0 && (
            <div className="palette-grid">
              {colors.map((c, i) => (
                <div key={i} className="palette-item" onClick={() => copyColor(c.hex)} title={`点击复制 ${c.hex}`}>
                  <div className="palette-swatch" style={{ background: c.hex }} />
                  <span className="palette-hex">{c.hex}</span>
                  <span className="palette-pct">{c.percent}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="preview-side">
          {image ? (
            <div className="preview-wrap">
              <p className="preview-label">原图</p>
              <img ref={imgRef} src={image} alt="preview" className="preview-img" onLoad={onImageLoad} />
            </div>
          ) : (
            <div className="preview-placeholder">选择图片后显示调色板</div>
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
        .main-color-preview {
          height: 100px; border: var(--border-width) solid var(--border);
          display: flex; align-items: center; justify-content: center;
          font-family: 'JetBrains Mono', monospace; font-size: 1.1rem; font-weight: 900;
        }
        .palette-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
        }
        .palette-item {
          border: var(--border-width) solid var(--border);
          background: var(--panel-bg); cursor: pointer;
          transition: transform 0.1s;
        }
        .palette-item:hover { transform: translate(-1px, -1px); }
        .palette-swatch {
          height: 48px;
        }
        .palette-hex {
          display: block; padding: 6px 8px 2px;
          font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; font-weight: 700;
        }
        .palette-pct {
          display: block; padding: 0 8px 8px;
          font-size: 0.65rem; color: var(--muted);
        }
        .preview-wrap {
          border: var(--border-width) solid var(--border); background: var(--panel-bg); padding: 16px;
        }
        .preview-label {
          font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.06em; color: var(--muted); margin-bottom: 12px;
        }
        .preview-img { max-width: 100%; max-height: 360px; display: block; margin: 0 auto; }
        .preview-placeholder {
          height: 300px; border: var(--border-width) dashed var(--border);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.85rem; color: var(--muted); background: var(--panel-bg);
        }
      `}</style>
    </div>
  );
}

function isLight(rgb: [number, number, number]): boolean {
  return (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000 > 150;
}
