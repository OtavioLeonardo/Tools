"use client";

import { useState, useCallback, useRef, useEffect } from "react";

type WatermarkType = "text" | "image";
type Position = "tl" | "tc" | "tr" | "cl" | "cc" | "cr" | "bl" | "bc" | "br";

const POSITIONS: Record<Position, { label: string; gridArea: string }> = {
  tl: { label: "左上", gridArea: "a" }, tc: { label: "中上", gridArea: "b" }, tr: { label: "右上", gridArea: "c" },
  cl: { label: "左中", gridArea: "d" }, cc: { label: "居中", gridArea: "e" }, cr: { label: "右中", gridArea: "f" },
  bl: { label: "左下", gridArea: "g" }, bc: { label: "中下", gridArea: "h" }, br: { label: "右下", gridArea: "i" },
};

function getPos(pos: Position, cw: number, ch: number, mw: number, mh: number, margin: number): [number, number] {
  const col = pos[1] as "l" | "c" | "r";
  const row = pos[0] as "t" | "c" | "b";
  let x = margin;
  let y = margin;
  if (col === "c") x = (cw - mw) / 2;
  else if (col === "r") x = cw - mw - margin;
  if (row === "c") y = (ch - mh) / 2;
  else if (row === "b") y = ch - mh - margin;
  return [x, y];
}

export default function ImageWatermark() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState("");
  const [wType, setWType] = useState<WatermarkType>("text");
  const [position, setPosition] = useState<Position>("br");
  const [margin, setMargin] = useState(20);
  const [opacity, setOpacity] = useState(0.5);

  const [text, setText] = useState("WATERMARK");
  const [fontSize, setFontSize] = useState(36);
  const [fontColor, setFontColor] = useState("#ffffff");
  const [fontBold, setFontBold] = useState(true);

  const [wmImage, setWmImage] = useState<string | null>(null);
  const [wmSize, setWmSize] = useState(30);
  const [preview, setPreview] = useState<string | null>(null);

  const handleMainImage = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => { setImage(reader.result as string); setPreview(null); };
    reader.readAsDataURL(file);
  }, []);

  const handleWmImage = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setWmImage(reader.result as string); setPreview(null); };
    reader.readAsDataURL(file);
  }, []);

  const render = useCallback(async () => {
    if (!image) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = image;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to load image"));
    });

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    ctx.globalAlpha = opacity;

    if (wType === "text") {
      const fs = Math.round(fontSize * (canvas.width / 500));
      ctx.font = `${fontBold ? "bold " : ""}${fs}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = fontColor;
      const metrics = ctx.measureText(text);
      const mw = metrics.width;
      const mh = fs;
      const pad = margin * (canvas.width / 500);
      const [x, y] = getPos(position, canvas.width, canvas.height, mw, mh, pad);
      ctx.fillText(text, x, y + fs);
    } else if (wType === "image" && wmImage) {
      const wImg = new Image();
      wImg.crossOrigin = "anonymous";
      wImg.src = wmImage;
      await new Promise<void>((resolve, reject) => {
        wImg.onload = () => resolve();
        wImg.onerror = () => reject(new Error("Failed to load watermark image"));
      });

      const scale = (wmSize / 100) * (canvas.width / 500);
      const mw = wImg.naturalWidth * scale;
      const mh = wImg.naturalHeight * scale;
      const pad = margin * (canvas.width / 500);
      const [x, y] = getPos(position, canvas.width, canvas.height, mw, mh, pad);
      ctx.drawImage(wImg, x, y, mw, mh);
    }

    ctx.globalAlpha = 1;
    setPreview(canvas.toDataURL("image/png"));
  }, [image, wType, text, fontSize, fontColor, fontBold, opacity, position, margin, wmImage, wmSize]);

  const download = useCallback(() => {
    if (!preview) return;
    const a = document.createElement("a");
    a.href = preview;
    a.download = imageName.replace(/(\.[^.]+)$/, "_watermarked$1");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [preview, imageName]);

  return (
    <div>
      <div className="tool-header"><h1>图片水印</h1></div>

      <div className="tool-layout">
        <div className="config-side">
          <label className="field">
            <span>上传图片</span>
            <input type="file" accept="image/*" onChange={handleMainImage} />
          </label>

          {image && (
            <>
              <div className="mode-tabs">
                <button className={`mode-tab ${wType === "text" ? "active" : ""}`} onClick={() => setWType("text")}>文字水印</button>
                <button className={`mode-tab ${wType === "image" ? "active" : ""}`} onClick={() => setWType("image")}>图片水印</button>
              </div>

              {wType === "text" ? (
                <>
                  <label className="field">
                    <span>水印文字</span>
                    <input type="text" value={text} onChange={(e) => setText(e.target.value)} />
                  </label>
                  <div className="field-row">
                    <label className="field">
                      <span>字号</span>
                      <input type="number" min={8} max={200} value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value) || 36)} />
                    </label>
                    <label className="field">
                      <span>颜色</span>
                      <div className="color-pick-row">
                        <input type="color" value={fontColor} onChange={(e) => setFontColor(e.target.value)} />
                        <button className={`check-btn ${fontBold ? "active" : ""}`} onClick={() => setFontBold(!fontBold)}>B</button>
                      </div>
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <label className="field">
                    <span>水印图片</span>
                    <input type="file" accept="image/*" onChange={handleWmImage} />
                  </label>
                  {wmImage && (
                    <label className="field">
                      <span>水印大小 ({wmSize}%)</span>
                      <input type="range" min={5} max={80} value={wmSize} onChange={(e) => setWmSize(parseInt(e.target.value))} />
                    </label>
                  )}
                </>
              )}

              <label className="field">
                <span>透明度 ({Math.round(opacity * 100)}%)</span>
                <input type="range" min={0.05} max={1} step={0.05} value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))} />
              </label>

              <label className="field">
                <span>边距 ({margin}px)</span>
                <input type="range" min={0} max={100} value={margin} onChange={(e) => setMargin(parseInt(e.target.value))} />
              </label>

              <label className="field">
                <span>位置</span>
                <div className="pos-grid">
                  {Object.entries(POSITIONS).map(([key, { label, gridArea }]) => (
                    <button
                      key={key}
                      className={`pos-btn ${position === key ? "active" : ""}`}
                      style={{ gridArea }}
                      onClick={() => setPosition(key as Position)}
                      title={label}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </label>

              <button className="btn btn-accent" onClick={render}>应用水印</button>

              {preview && (
                <button className="btn" onClick={download}>下载 PNG</button>
              )}
            </>
          )}
        </div>

        <div className="preview-side">
          {image ? (
            <div className="preview-wrap">
              <p className="preview-label">{preview ? "预览 (带水印)" : "原图"}</p>
              <img src={preview || image} alt="preview" className="preview-img" />
              <p className="preview-name">{imageName}</p>
            </div>
          ) : (
            <div className="preview-placeholder">选择图片后编辑水印</div>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      <style jsx>{`
        .tool-header { margin-bottom: 24px; }
        .tool-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: start; }
        .config-side { display: grid; gap: 16px; }
        .preview-side { display: grid; gap: 12px; }
        .field { display: grid; gap: 8px; }
        .field span {
          font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.06em; color: var(--muted);
        }
        .field input[type="file"] { font-size: 0.85rem; }
        .field input[type="text"], .field input[type="number"] { width: 100%; }
        .field input[type="range"] { accent-color: var(--accent); height: 6px; }
        .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .color-pick-row { display: flex; align-items: center; gap: 8px; }
        .color-pick-row input[type="color"] {
          width: 30px; height: 30px; border: var(--border-width) solid var(--border); padding: 2px; cursor: pointer;
        }
        .mode-tabs { display: flex; }
        .mode-tab {
          flex: 1; border: var(--border-width) solid var(--border); padding: 10px 16px;
          font-family: inherit; font-size: 0.85rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.06em; background: var(--panel-bg); color: var(--muted); cursor: pointer;
        }
        .mode-tab:first-child { border-right: none; }
        .mode-tab.active { background: var(--fg); color: var(--bg); border-color: var(--fg); }
        .check-btn {
          padding: 8px 14px; border: var(--border-width) solid var(--border);
          font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; font-weight: 900;
          cursor: pointer; background: var(--panel-bg); color: var(--muted);
        }
        .check-btn.active { background: var(--fg); color: var(--bg); border-color: var(--fg); }
        .pos-grid {
          display: grid; grid-template-areas: 'a b c' 'd e f' 'g h i';
          gap: 4px;
        }
        .pos-btn {
          padding: 8px 4px; border: var(--border-width) solid var(--border);
          font-size: 0.65rem; cursor: pointer;
          background: var(--panel-bg); color: var(--muted);
          font-family: inherit;
        }
        .pos-btn.active { background: var(--fg); color: var(--bg); border-color: var(--fg); }
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
