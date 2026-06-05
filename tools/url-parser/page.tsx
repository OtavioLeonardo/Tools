"use client";

import { useState, useCallback, useMemo } from "react";

interface ParsedURL {
  url: string;
  protocol: string;
  host: string;
  hostname: string;
  port: string;
  origin: string;
  pathname: string;
  search: string;
  hash: string;
  params: [string, string][];
}

function parse(input: string): ParsedURL | null {
  try {
    const u = new URL(input);
    return {
      url: u.href,
      protocol: u.protocol.replace(/:$/, ""),
      host: u.host,
      hostname: u.hostname,
      port: u.port || "(默认)",
      origin: u.origin,
      pathname: u.pathname,
      search: u.search,
      hash: u.hash || "",
      params: Array.from(u.searchParams.entries()),
    };
  } catch {
    return null;
  }
}

export default function URLParser() {
  const [input, setInput] = useState("https://example.com:8080/path/to/page?q=hello&lang=zh&page=1#section");
  const [copied, setCopied] = useState<string | null>(null);

  const parsed = useMemo(() => parse(input.trim()), [input]);

  const copy = useCallback(async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(null), 1200);
    } catch {
      const el = document.createElement("textarea");
      el.value = value;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(key);
      setTimeout(() => setCopied(null), 1200);
    }
  }, []);

  return (
    <div>
      <div className="tool-header"><h1>URL 解析器</h1></div>

      <div className="tool-body">
        <label className="field">
          <span>输入 URL</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="https://example.com/path?key=val#hash"
            style={{ width: "100%", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.9rem" }}
          />
        </label>

        {parsed ? (
          <div className="result-panel">
            <div className="section-title">概览</div>
            <div className="overview-box">{parsed.url}</div>

            <div className="section-title">基本组成</div>
            <div className="format-grid">
              <Row label="协议" value={parsed.protocol} copied={copied} onCopy={copy} />
              <Row label="主机" value={parsed.host} copied={copied} onCopy={copy} />
              <Row label="域名" value={parsed.hostname} copied={copied} onCopy={copy} />
              <Row label="端口" value={parsed.port} dim={parsed.port === "(默认)"} copied={copied} onCopy={copy} />
              <Row label="源" value={parsed.origin} copied={copied} onCopy={copy} />
              <Row label="路径" value={parsed.pathname} copied={copied} onCopy={copy} />
              <Row label="查询串" value={parsed.search || "(无)"} dim={!parsed.search} copied={copied} onCopy={copy} />
              <Row label="哈希" value={parsed.hash || "(无)"} dim={!parsed.hash} copied={copied} onCopy={copy} />
            </div>

            {parsed.params.length > 0 && (
              <>
                <div className="section-title">查询参数 ({parsed.params.length})</div>
                <div className="params-grid">
                  <div className="params-header">
                    <span>键</span>
                    <span>值</span>
                  </div>
                  {parsed.params.map(([key, value], i) => (
                    <div key={i} className="params-row">
                      <span className="param-key" onClick={() => copy(key, `param-key-${i}`)} title="点击复制">{key}</span>
                      <span className="param-val" onClick={() => copy(value, `param-val-${i}`)} title="点击复制">{decodeURIComponent(value)}</span>
                      <button
                        className="param-copy"
                        onClick={() => copy(`${key}=${value}`, `param-pair-${i}`)}
                      >
                        {copied === `param-pair-${i}` ? "已复制" : "复制"}
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : input.trim() ? (
          <div className="error-box">无法解析此 URL，请检查格式</div>
        ) : null}
      </div>

      <style jsx>{`
        .tool-header { margin-bottom: 24px; }
        .tool-body { display: grid; gap: 20px; }
        .field { display: grid; gap: 8px; }
        .field span {
          font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.06em; color: var(--muted);
        }
        .result-panel {
          border: var(--border-width) solid var(--border);
          background: var(--panel-bg);
          padding: 24px;
          display: grid; gap: 20px;
        }
        .section-title {
          font-size: 0.7rem; font-weight: 900; text-transform: uppercase;
          letter-spacing: 0.08em; color: var(--accent);
          padding-bottom: 8px;
          border-bottom: var(--border-width) solid var(--border);
        }
        .overview-box {
          font-family: 'JetBrains Mono', monospace; font-size: 0.9rem;
          padding: 14px; border: var(--border-width) solid var(--border);
          background: var(--bg); word-break: break-all; line-height: 1.5;
        }
        .format-grid { display: grid; gap: 6px; }
        .url-row {
          display: flex; align-items: center; border: var(--border-width) solid var(--border);
          background: var(--bg);
        }
        .url-row-label {
          width: 60px; padding: 8px 12px; font-size: 0.65rem; font-weight: 900;
          letter-spacing: 0.06em; border-right: var(--border-width) solid var(--border);
          flex-shrink: 0; background: var(--fg); color: var(--bg);
        }
        .url-row-val {
          flex: 1; padding: 8px 12px;
          font-family: 'JetBrains Mono', monospace; font-size: 0.8rem;
          cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .url-row-val.dim { color: var(--muted); font-style: italic; }
        .url-row-copy {
          padding: 8px 14px; font-size: 0.6rem; font-weight: 900;
          text-transform: uppercase; letter-spacing: 0.06em;
          cursor: pointer; border: none; border-left: var(--border-width) solid var(--border);
          background: var(--panel-bg); color: var(--muted); font-family: inherit;
        }
        .url-row-copy:hover { background: var(--accent); color: #fff; }
        .copied-btn { background: var(--accent) !important; color: #fff !important; }
        .params-grid { border: var(--border-width) solid var(--border); }
        .params-header {
          display: grid; grid-template-columns: 1fr 1fr auto; gap: 0;
          background: var(--fg); color: var(--bg);
          padding: 8px 12px; font-size: 0.65rem; font-weight: 900;
          text-transform: uppercase; letter-spacing: 0.06em;
        }
        .params-row {
          display: grid; grid-template-columns: 1fr 1fr auto; gap: 0;
          border-top: var(--border-width) solid var(--border);
          background: var(--bg);
        }
        .param-key, .param-val {
          padding: 8px 12px;
          font-family: 'JetBrains Mono', monospace; font-size: 0.8rem;
          cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .param-key { font-weight: 700; }
        .param-val { border-left: var(--border-width) solid var(--border); }
        .param-copy {
          padding: 8px 14px; font-size: 0.6rem; font-weight: 900;
          text-transform: uppercase; letter-spacing: 0.06em;
          cursor: pointer; border: none; border-left: var(--border-width) solid var(--border);
          background: var(--panel-bg); color: var(--muted); font-family: inherit;
        }
        .param-copy:hover { background: var(--accent); color: #fff; }
        .error-box {
          padding: 16px; border: var(--border-width) solid var(--accent);
          color: var(--accent); font-weight: 700;
        }
      `}</style>
    </div>
  );
}

function Row({
  label, value, dim, copied, onCopy,
}: {
  label: string; value: string; dim?: boolean; copied: string | null;
  onCopy: (value: string, key: string) => void;
}) {
  return (
    <div className="url-row">
      <span className="url-row-label">{label}</span>
      <span className={`url-row-val ${dim ? "dim" : ""}`} onClick={() => onCopy(value, label)} title="点击复制">
        {value}
      </span>
      <button
        className={`url-row-copy ${copied === label ? "copied-btn" : ""}`}
        onClick={() => onCopy(value, label)}
      >
        {copied === label ? "已复制" : "复制"}
      </button>
    </div>
  );
}
