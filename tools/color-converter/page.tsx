"use client";

import { useState, useCallback, useMemo, useRef } from "react";

interface ColorInfo {
  hex: string;
  hex6: string;
  rgb: [number, number, number];
  rgba: [number, number, number, number];
  hsl: [number, number, number];
  hsla: [number, number, number, number];
}

function safeParse(input: string): ColorInfo | null {
  let r = 0, g = 0, b = 0, a = 1;
  const s = input.trim().toLowerCase();

  const hexMatch = s.match(/^#?([a-f0-9]{3,8})$/);
  if (hexMatch) {
    let h = hexMatch[1];
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    if (h.length === 4) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2]+h[3]+h[3];
    if (h.length === 6) {
      r = parseInt(h.slice(0,2), 16);
      g = parseInt(h.slice(2,4), 16);
      b = parseInt(h.slice(4,6), 16);
    } else if (h.length === 8) {
      r = parseInt(h.slice(0,2), 16);
      g = parseInt(h.slice(2,4), 16);
      b = parseInt(h.slice(4,6), 16);
      a = Math.round(parseInt(h.slice(6,8), 16) / 255 * 100) / 100;
    } else {
      return null;
    }
  }

  const rgbMatch = s.match(/rgba?\s*\(\s*(\d+)\s*[,\s]\s*(\d+)\s*[,\s]\s*(\d+)\s*(?:[,/]\s*([\d.]+))?\s*\)/);
  if (rgbMatch) {
    r = parseInt(rgbMatch[1]);
    g = parseInt(rgbMatch[2]);
    b = parseInt(rgbMatch[3]);
    if (rgbMatch[4] !== undefined) a = parseFloat(rgbMatch[4]);
  }

  const hslMatch = s.match(/hsla?\s*\(\s*(\d+)\s*[,\s]\s*(\d+)%\s*[,\s]\s*(\d+)%\s*(?:[,/]\s*([\d.]+))?\s*\)/);
  if (hslMatch) {
    const h = parseInt(hslMatch[1]) / 360;
    const sl = parseInt(hslMatch[2]) / 100;
    const l = parseInt(hslMatch[3]) / 100;
    if (hslMatch[4] !== undefined) a = parseFloat(hslMatch[4]);

    if (sl === 0) {
      r = g = b = Math.round(l * 255);
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + sl) : l + sl - l * sl;
      const p = 2 * l - q;
      r = Math.round(hue2rgb(p, q, h + 1/3) * 255);
      g = Math.round(hue2rgb(p, q, h) * 255);
      b = Math.round(hue2rgb(p, q, h - 1/3) * 255);
    }
  }

  if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) return null;
  if (!hexMatch && !rgbMatch && !hslMatch) return null;

  return makeColorInfo(r, g, b, Math.min(1, Math.max(0, a)));
}

function makeColorInfo(r: number, g: number, b: number, a = 1): ColorInfo {
  const hex6 = [r,g,b].map((c) => c.toString(16).padStart(2,"0")).join("");
  const alphaHex = a < 1 ? Math.round(a * 255).toString(16).padStart(2, "0") : "";
  const hex = `#${hex6}${alphaHex}`;

  r = Math.round(r); g = Math.round(g); b = Math.round(b);

  const rf = r / 255, gf = g / 255, bf = b / 255;
  const max = Math.max(rf, gf, bf), min = Math.min(rf, gf, bf);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rf) h = ((gf - bf) / d + (gf < bf ? 6 : 0)) / 6;
    else if (max === gf) h = ((bf - rf) / d + 2) / 6;
    else h = ((rf - gf) / d + 4) / 6;
  }

  const hsl: [number, number, number] = [
    Math.round(h * 360),
    Math.round(s * 100),
    Math.round(l * 100),
  ];

  return { hex, hex6, rgb: [r, g, b], rgba: [r, g, b, a], hsl, hsla: [hsl[0], hsl[1], hsl[2], a] };
}

export default function ColorConverter() {
  const [input, setInput] = useState("#ff3b00");
  const pickerRef = useRef<HTMLInputElement>(null);

  const color = useMemo(() => safeParse(input), [input]);
  const isLight = color
    ? (color.rgb[0] * 299 + color.rgb[1] * 587 + color.rgb[2] * 114) / 1000 > 150
    : false;

  const handlePickerChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value.toUpperCase());
  }, []);

  const handleOpenPicker = useCallback(() => {
    pickerRef.current?.click();
  }, []);

  if (!color) {
    return (
      <div>
        <div className="tool-header"><h1>颜色转换器</h1></div>
        <div className="tool-body">
          <label className="panel-label">输入颜色值</label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="#ff3b00 / rgb(255,59,0) / hsl(14,100%,50%)"
            style={{ width: "100%" }}
          />
          <p style={{ color: "var(--accent)", marginTop: 8 }}>无法解析颜色值</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="tool-header"><h1>颜色转换器</h1></div>

      <div
        className="color-preview"
        style={{ background: `rgba(${color.rgba.join(",")})` }}
      >
        <input
          ref={pickerRef}
          type="color"
          value={input.startsWith("#") ? input : `#${color.hex6}`}
          onChange={handlePickerChange}
          style={{ position: "absolute", opacity: 0, width: 1, height: 1 }}
        />
        <button
          className="btn picker-btn"
          onClick={handleOpenPicker}
          style={{
            borderColor: isLight ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.3)",
            color: isLight ? "#111" : "#fff",
            background: isLight ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.3)",
          }}
        >
          🎨 取色
        </button>
      </div>

      <div className="tool-body" style={{ marginTop: 20 }}>
        <label className="panel-label">输入 (支持 HEX / RGB / HSL)</label>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ width: "100%" }}
        />

        <div className="format-grid">
          <FormatRow label="HEX" value={color.hex} color={color} />
          <FormatRow label="RGB" value={`rgb(${color.rgb.join(", ")})`} color={color} />
          <FormatRow label="RGBA" value={`rgba(${color.rgba.join(", ")})`} color={color} />
          <FormatRow label="HSL" value={`hsl(${color.hsl[0]}, ${color.hsl[1]}%, ${color.hsl[2]}%)`} color={color} />
          <FormatRow label="HSLA" value={`hsla(${color.hsla[0]}, ${color.hsla[1]}%, ${color.hsla[2]}%, ${color.hsla[3]})`} color={color} />
        </div>
      </div>

      <style jsx>{`
        .tool-header { margin-bottom: 24px; }
        .tool-body { display: grid; gap: 16px; }
        .panel-label {
          display: block;
          font-weight: 700;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 8px;
          color: var(--muted);
        }
        .color-preview {
          position: relative;
          height: 200px;
          border: var(--border-width) solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .picker-btn { font-size: 1rem; padding: 12px 24px; }
        .format-grid {
          display: grid;
          gap: 8px;
        }
        .format-row {
          display: flex;
          align-items: stretch;
          border: var(--border-width) solid var(--border);
          background: var(--panel-bg);
          transition: transform 0.1s;
        }
        .format-row:hover {
          transform: translate(-1px, -1px);
          box-shadow: 3px 3px 0 var(--accent-dim);
        }
        .format-label {
          width: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.65rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          background: var(--fg);
          color: var(--bg);
          flex-shrink: 0;
        }
        .format-swatch {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 2px solid;
          flex-shrink: 0;
          margin: 0;
        }
        .format-middle {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
        }
        .format-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.85rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .format-copy {
          padding: 12px 18px;
          font-size: 0.65rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          cursor: pointer;
          border: none;
          border-left: var(--border-width) solid var(--border);
          background: var(--bg);
          color: var(--muted);
          font-family: inherit;
          flex-shrink: 0;
          transition: background 0.1s, color 0.1s;
        }
        .format-copy:hover:not(.copied) { background: var(--fg); color: var(--bg); }
        .copied { background: var(--accent) !important; color: #fff !important; }
      `}</style>
    </div>
  );
}

function FormatRow({ label, value, color }: { label: string; value: string; color: ColorInfo }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      const el = document.createElement("textarea");
      el.value = value;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  }, [value]);

  return (
    <div className="format-row">
      <span className="format-label">{label}</span>
      <div className="format-middle">
        <span
          className="format-swatch"
          style={{
            background: `rgba(${color.rgba.join(",")})`,
            borderColor: `rgba(${color.rgb.join(",")},0.3)`,
          }}
        />
        <span className="format-value">{value}</span>
      </div>
      <button className={`format-copy ${copied ? "copied" : ""}`} onClick={copy}>
        {copied ? "COPIED" : "COPY"}
      </button>
    </div>
  );
}
