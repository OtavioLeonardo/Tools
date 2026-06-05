"use client";

import { useState, useCallback } from "react";

export default function JsonFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const format = useCallback(() => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch (e: any) {
      setError(e.message);
      setOutput("");
    }
  }, [input]);

  const minify = useCallback(() => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setError(null);
    } catch (e: any) {
      setError(e.message);
      setOutput("");
    }
  }, [input]);

  const validate = useCallback(() => {
    try {
      JSON.parse(input);
      setError(null);
      setOutput("✓ JSON 格式正确");
    } catch (e: any) {
      setError(e.message);
      setOutput("");
    }
  }, [input]);

  return (
    <div>
      <div className="tool-header">
        <h1>JSON FORMATTER</h1>
      </div>
      <div className="tool-body">
        <div className="panel">
          <label className="panel-label">输入</label>
          <textarea
            className="code-area"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"key": "value"}'
          />
        </div>
        <div className="tool-actions">
          <button className="btn" onClick={format}>格式化</button>
          <button className="btn" onClick={minify}>压缩</button>
          <button className="btn" onClick={validate}>校验</button>
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
