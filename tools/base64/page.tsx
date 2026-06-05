"use client";

import { useState, useCallback } from "react";

export default function Base64Tool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const encode = useCallback(() => {
    try {
      setOutput(btoa(unescape(encodeURIComponent(input))));
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  }, [input]);

  const decode = useCallback(() => {
    try {
      setOutput(decodeURIComponent(escape(atob(input))));
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  }, [input]);

  return (
    <div>
      <div className="tool-header">
        <h1>BASE64 编解码</h1>
      </div>
      <div className="tool-body">
        <div className="panel">
          <label className="panel-label">输入</label>
          <textarea
            className="code-area"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入要编解码的文本..."
          />
        </div>
        <div className="tool-actions">
          <button className="btn" onClick={encode}>编码 →</button>
          <button className="btn" onClick={decode}>← 解码</button>
        </div>
        <div className="panel">
          <label className="panel-label">输出</label>
          {error ? (
            <pre className="code-area code-error">{error}</pre>
          ) : (
            <pre className="code-area">{output}</pre>
          )}
        </div>
      </div>
      <style jsx>{`
        .tool-header { margin-bottom: 24px; }
        .tool-body { display: grid; gap: 16px; }
        .tool-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .code-area {
          width: 100%;
          min-height: 200px;
          border: var(--border-width) solid var(--border);
          padding: 16px;
          background: var(--panel-bg);
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.85rem;
          line-height: 1.5;
          color: var(--fg);
          outline: none;
        }
        textarea.code-area { resize: vertical; }
        .code-error { color: var(--accent); border-color: var(--accent); }
        .panel-label {
          display: block;
          font-weight: 700;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 8px;
          color: var(--muted);
        }
      `}</style>
    </div>
  );
}
