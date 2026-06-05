"use client";

import { useState, useCallback, useMemo } from "react";

const CHARSETS: Record<string, { label: string; chars: string }> = {
  lowercase: { label: "a-z", chars: "abcdefghijklmnopqrstuvwxyz" },
  uppercase: { label: "A-Z", chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ" },
  numbers:   { label: "0-9", chars: "0123456789" },
  symbols:   { label: "!@#$", chars: "!@#$%^&*()_+-=[]{}|;:,.<>?" },
};

function generatePassword(length: number, charset: string): string {
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += charset[arr[i] % charset.length];
  }
  return result;
}

function passwordStrength(pw: string, charsets: string[]): { label: string; level: number; color: string } {
  let types = 0;
  if (/[a-z]/.test(pw) && charsets.includes("lowercase")) types++;
  if (/[A-Z]/.test(pw) && charsets.includes("uppercase")) types++;
  if (/[0-9]/.test(pw) && charsets.includes("numbers")) types++;
  if (/[^a-zA-Z0-9]/.test(pw) && charsets.includes("symbols")) types++;

  const score = pw.length + types * 6;
  if (score >= 60) return { label: "强", level: 4, color: "#22c55e" };
  if (score >= 40) return { label: "良好", level: 3, color: "#84cc16" };
  if (score >= 25) return { label: "一般", level: 2, color: "#f59e0b" };
  return { label: "弱", level: 1, color: "var(--accent)" };
}

export default function PasswordGenerator() {
  const [length, setLength] = useState(24);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    lowercase: true,
    uppercase: true,
    numbers: true,
    symbols: true,
  });
  const [count, setCount] = useState(1);
  const [results, setResults] = useState<string[]>([]);

  const charset = useMemo(() => {
    let s = "";
    for (const [key, enabled_] of Object.entries(enabled)) {
      if (enabled_ && CHARSETS[key]) s += CHARSETS[key].chars;
    }
    return s;
  }, [enabled]);

  const generate = useCallback(() => {
    if (!charset) return;
    const arr: string[] = [];
    for (let i = 0; i < count; i++) {
      arr.push(generatePassword(length, charset));
    }
    setResults(arr);
  }, [length, charset, count]);

  const toggle = useCallback((key: string) => {
    setEnabled((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (Object.values(next).every((v) => !v)) return prev;
      return next;
    });
  }, []);

  const copyAll = useCallback(async () => {
    const text = results.join("\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
  }, [results]);

  return (
    <div>
      <div className="tool-header"><h1>随机码生成器</h1></div>

      <div className="tool-body">
        <div className="config-grid">
          <label className="field">
            <span>长度</span>
            <div className="range-row">
              <input
                type="range"
                min={4}
                max={128}
                value={length}
                onChange={(e) => setLength(parseInt(e.target.value))}
              />
              <span className="range-num">{length}</span>
            </div>
          </label>

          <label className="field">
            <span>字符类型</span>
            <div className="check-row">
              {Object.entries(CHARSETS).map(([key, cs]) => (
                <button
                  key={key}
                  className={`check-btn ${enabled[key] ? "active" : ""}`}
                  onClick={() => toggle(key)}
                >
                  {cs.label}
                </button>
              ))}
            </div>
          </label>

          <label className="field">
            <span>生成数量</span>
            <div className="range-row">
              <input
                type="range"
                min={1}
                max={10}
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value))}
              />
              <span className="range-num">{count}</span>
            </div>
          </label>
        </div>

        <button className="btn btn-accent btn-lg" onClick={generate} disabled={!charset}>
          生成 →
        </button>

        {results.length > 0 && (
          <div className="results-panel">
            <div className="results-header">
              <span className="panel-label">生成结果</span>
              <button className="btn btn-sm" onClick={copyAll}>
                全部复制
              </button>
            </div>
            <div className="results-list">
              {results.map((pw, i) => {
                const strength = passwordStrength(pw, Object.keys(enabled).filter((k) => enabled[k]));
                return (
                  <CopyRow key={i} password={pw} strength={strength} length={length} />
                );
              })}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .tool-header { margin-bottom: 24px; }
        .tool-body { display: grid; gap: 20px; }
        .config-grid { display: grid; gap: 20px; }
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
        .range-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .range-row input[type="range"] {
          flex: 1;
          accent-color: var(--accent);
          height: 6px;
        }
        .range-num {
          width: 36px;
          text-align: center;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.9rem;
          font-weight: 900;
        }
        .check-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .check-btn {
          padding: 8px 16px;
          border: var(--border-width) solid var(--border);
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          background: var(--panel-bg);
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .check-btn.active {
          background: var(--fg);
          color: var(--bg);
          border-color: var(--fg);
        }
        .btn-lg { padding: 14px 24px; font-size: 1rem; justify-content: center; }
        .btn-sm { padding: 6px 12px; font-size: 0.65rem; }
        .results-panel {
          border: var(--border-width) solid var(--border);
          background: var(--panel-bg);
        }
        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-bottom: var(--border-width) solid var(--border);
        }
        .results-header .panel-label { margin: 0; }
        .results-list { display: grid; }
        .pw-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-bottom: var(--border-width) solid var(--border);
        }
        .pw-row:last-child { border-bottom: none; }
        .pw-bar {
          width: 4px;
          height: 32px;
          flex-shrink: 0;
        }
        .pw-text {
          flex: 1;
          font-family: 'JetBrains Mono', monospace;
          font-size: 1rem;
          letter-spacing: 0.06em;
          word-break: break-all;
        }
        .pw-strength {
          font-size: 0.6rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          flex-shrink: 0;
        }
        .pw-copy {
          padding: 6px 12px;
          font-size: 0.6rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          cursor: pointer;
          border: var(--border-width) solid var(--border);
          background: var(--bg);
          color: var(--muted);
          font-family: inherit;
          flex-shrink: 0;
        }
        .pw-copy:hover { background: var(--fg); color: var(--bg); }
        .pw-copy.copied { background: var(--accent); color: #fff; border-color: var(--accent); }
      `}</style>
    </div>
  );
}

function CopyRow({
  password,
  strength,
  length,
}: {
  password: string;
  strength: { label: string; level: number; color: string };
  length: number;
}) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      const el = document.createElement("textarea");
      el.value = password;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  }, [password]);

  return (
    <div className="pw-row">
      <div className="pw-bar" style={{ background: strength.color }} />
      <div className="pw-text">{password}</div>
      <span className="pw-strength" style={{ color: strength.color }}>
        {strength.label}
      </span>
      <button className={`pw-copy ${copied ? "copied" : ""}`} onClick={copy}>
        {copied ? "已复制" : "复制"}
      </button>
    </div>
  );
}
