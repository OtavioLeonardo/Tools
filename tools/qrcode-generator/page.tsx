"use client";

import { useState, useCallback, useEffect, useRef } from "react";

let QRCode: typeof import("qrcode") | null = null;

export default function QRCodeGenerator() {
  const [text, setText] = useState("");
  const [size, setSize] = useState(280);
  const [errorLevel, setErrorLevel] = useState<"L" | "M" | "Q" | "H">("M");
  const [darkColor, setDarkColor] = useState("#000000");
  const [lightColor, setLightColor] = useState("#ffffff");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    import("qrcode").then((m) => {
      QRCode = m;
    });
  }, []);

  const generate = useCallback(async () => {
    if (!text.trim() || !QRCode) return;
    setLoading(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      await QRCode.toCanvas(canvas, text.trim(), {
        width: size,
        margin: 2,
        errorCorrectionLevel: errorLevel,
        color: {
          dark: darkColor,
          light: lightColor,
        },
      });

      setQrDataUrl(canvas.toDataURL("image/png"));
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [text, size, errorLevel, darkColor, lightColor]);

  useEffect(() => {
    if (text.trim() && QRCode) {
      const timer = setTimeout(generate, 300);
      return () => clearTimeout(timer);
    } else {
      setQrDataUrl(null);
    }
  }, [text, size, errorLevel, darkColor, lightColor, generate]);

  const download = useCallback(() => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = "qrcode.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [qrDataUrl]);

  return (
    <div>
      <div className="tool-header"><h1>二维码生成器</h1></div>

      <div className="tool-layout">
        <div className="tool-body config-side">
          <label className="field">
            <span>内容 (网址 / 文本)</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="https://example.com"
              rows={4}
            />
          </label>

          <label className="field">
            <span>尺寸 ({size}px)</span>
            <input
              type="range"
              min={140}
              max={600}
              step={20}
              value={size}
              onChange={(e) => setSize(parseInt(e.target.value))}
            />
          </label>

          <label className="field">
            <span>容错级别</span>
            <div className="check-row">
              {[
                ["L", "7%"],
                ["M", "15%"],
                ["Q", "25%"],
                ["H", "30%"],
              ].map(([level, rate]) => (
                <button
                  key={level}
                  className={`check-btn ${errorLevel === level ? "active" : ""}`}
                  onClick={() => setErrorLevel(level as "L" | "M" | "Q" | "H")}
                >
                  {level} ({rate})
                </button>
              ))}
            </div>
          </label>

          <div className="field-row">
            <label className="field">
              <span>前景色</span>
              <div className="color-pick-row">
                <input
                  type="color"
                  value={darkColor}
                  onChange={(e) => setDarkColor(e.target.value)}
                />
                <span className="color-val">{darkColor}</span>
              </div>
            </label>
            <label className="field">
              <span>背景色</span>
              <div className="color-pick-row">
                <input
                  type="color"
                  value={lightColor}
                  onChange={(e) => setLightColor(e.target.value)}
                />
                <span className="color-val">{lightColor}</span>
              </div>
            </label>
          </div>
        </div>

        <div className="preview-side">
          <div className="qr-wrap">
            {text.trim() ? (
              <>
                <canvas ref={canvasRef} width={size} height={size} style={{ width: size, height: size, display: loading ? "none" : "block" }} />
                {loading && <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", border: "var(--border-width) solid var(--border)", background: "var(--panel-bg)" }}>生成中...</div>}
              </>
            ) : (
              <div className="qr-placeholder">输入内容以生成二维码</div>
            )}
          </div>

          {qrDataUrl && (
            <button className="btn btn-accent btn-lg" onClick={download} style={{ width: "100%" }}>
              下载 PNG
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .tool-header { margin-bottom: 24px; }
        .tool-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          align-items: start;
        }
        .config-side { display: grid; gap: 20px; }
        .preview-side { display: grid; gap: 16px; }
        .field {
          display: grid;
          gap: 8px;
        }
        .field span {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--muted);
        }
        .field input[type="range"] {
          accent-color: var(--accent);
          height: 6px;
        }
        .field textarea { resize: vertical; }
        .field-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .check-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .check-btn {
          padding: 8px 16px;
          border: var(--border-width) solid var(--border);
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          background: var(--panel-bg);
          color: var(--muted);
        }
        .check-btn.active {
          background: var(--fg);
          color: var(--bg);
          border-color: var(--fg);
        }
        .color-pick-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .color-pick-row input[type="color"] {
          width: 36px;
          height: 36px;
          border: var(--border-width) solid var(--border);
          padding: 2px;
          cursor: pointer;
          background: none;
        }
        .color-val {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.8rem;
          color: var(--muted);
        }
        .qr-wrap {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .qr-wrap canvas {
          border: var(--border-width) solid var(--border);
        }
        .qr-placeholder {
          width: 280px;
          height: 280px;
          border: var(--border-width) dashed var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
          color: var(--muted);
          text-align: center;
          background: var(--panel-bg);
        }
        .btn-lg { padding: 14px 24px; font-size: 1rem; justify-content: center; }
      `}</style>
    </div>
  );
}
