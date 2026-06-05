"use client";

import { useState, useCallback } from "react";
import { useAIConfig } from "@/app/components/ai-provider";

const SYSTEM_PROMPT = `You are a professional text summarizer. Your task:

1. Read the provided text carefully.
2. Extract 3-8 key points that capture the main ideas.
3. Output in this format:

## 摘要
[One paragraph summary in 2-3 sentences]

## 关键要点
- Point 1
- Point 2
- ...

Reply in Chinese. Be concise. Only include information from the source text.`;

export default function Summarizer() {
  const { config } = useAIConfig();
  const [inputMode, setInputMode] = useState<"text" | "url">("text");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const summarize = useCallback(async () => {
    if (!input.trim()) return;
    if (!config.apiKey) {
      setError("请先在侧边栏 AI 配置中设置 API。");
      return;
    }

    setLoading(true);
    setError(null);
    setOutput("");

    let content = input;

    if (inputMode === "url") {
      try {
        const url = input.trim();
        if (!/^https?:\/\//.test(url)) {
          throw new Error("请输入有效的 URL（以 http:// 或 https:// 开头）");
        }
        setOutput("正在抓取网页...");

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15000);

        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timer);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: 无法访问该页面`);
        }

        const html = await res.text();
        if (!html || html.length < 200) {
          throw new Error("页面内容过短，可能不是有效的文章页面");
        }

        const doc = new DOMParser().parseFromString(html, "text/html");

        doc.querySelectorAll("script, style, nav, footer, header, iframe, noscript, [role='navigation'], .sidebar, .nav, .menu, .ad, .advertisement, .cookie").forEach((el) => el.remove());
        doc.querySelectorAll("[aria-hidden='true']").forEach((el) => el.remove());

        const mainArea = doc.querySelector("article, main, .article, .post, .content, .entry-content, .post-content");
        const source = mainArea || doc.body;

        if (source) {
          content = (source.textContent || "").replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ").trim();
        } else {
          content = html.replace(/<[^>]*>/g, "").replace(/\n{3,}/g, "\n\n").trim();
        }

        if (!content || content.length < 100) {
          throw new Error("无法从页面提取有效文本，请切换到纯文本模式手动粘贴内容。");
        }
      } catch (e: any) {
        setLoading(false);
        setOutput("");
        if (e.name === "AbortError") {
          setError("抓取超时。请切换到纯文本模式，手动复制粘贴文章内容。");
        } else if (e.message?.includes("Failed to fetch") || e.message?.includes("NetworkError")) {
          setError("无法跨域访问该网页（CORS 限制）。请切换到纯文本模式，手动复制粘贴文章内容。");
        } else {
          setError(e.message || "抓取失败，请尝试纯文本模式。");
        }
        return;
      }
    }

    if (content.length < 50) {
      setLoading(false);
      setError("文本太短，至少需要 50 个字符。");
      return;
    }

    const maxContentLen = config.maxTokens * 3;
    const truncated = content.length > maxContentLen
      ? content.slice(0, maxContentLen) + "\n\n[文本已截断...]"
      : content;

    try {
      const res = await fetch(config.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: truncated },
          ],
          temperature: Math.min(config.temperature, 0.5),
          max_tokens: config.maxTokens,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`API 错误 ${res.status}: ${body.slice(0, 200)}`);
      }

      const data = await res.json();
      setOutput(data.choices?.[0]?.message?.content ?? "");
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [config, input, inputMode]);

  return (
    <div>
      <div className="tool-header">
        <h1>摘要总结</h1>
      </div>

      <div className="tool-body">
        <div className="mode-tabs">
          <button
            className={`mode-tab ${inputMode === "text" ? "active" : ""}`}
            onClick={() => setInputMode("text")}
          >
            纯文本
          </button>
          <button
            className={`mode-tab ${inputMode === "url" ? "active" : ""}`}
            onClick={() => setInputMode("url")}
          >
            URL
          </button>
        </div>

        <div className="panel">
          <label className="panel-label">
            {inputMode === "url" ? "文章链接" : "输入文本"}
          </label>
          {inputMode === "text" ? (
            <textarea
              className="code-area"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="粘贴长文本到这里..."
              rows={12}
            />
          ) : (
            <input
              type="text"
              className="code-area url-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="https://example.com/article"
            />
          )}
        </div>

        <div className="tool-actions">
          <button
            className="btn btn-accent"
            onClick={summarize}
            disabled={loading || !input.trim()}
          >
            {loading ? "生成中..." : "生成摘要 →"}
          </button>
          {output && (
            <button className="btn" onClick={() => { setOutput(""); setInput(""); setError(null); }}>
              清空
            </button>
          )}
        </div>

        {error && (
          <div className="panel">
            <label className="panel-label">错误</label>
            <pre className="code-area code-error">{error}</pre>
          </div>
        )}

        {output && (
          <div className="panel">
            <label className="panel-label">摘要结果</label>
            <div className="summary-output">
              {output.split("\n").map((line, i) => {
                if (line.startsWith("## ")) {
                  return <h2 key={i} style={{ fontSize: "1.1rem", marginTop: i > 0 ? "16px" : 0, marginBottom: "8px" }}>{line.replace("## ", "")}</h2>;
                }
                if (line.startsWith("- ")) {
                  return (
                    <div key={i} style={{ display: "flex", gap: "8px", padding: "4px 0", fontSize: "0.9rem" }}>
                      <span style={{ color: "var(--accent)", fontWeight: 900 }}>•</span>
                      <span>{line.replace("- ", "")}</span>
                    </div>
                  );
                }
                if (line.trim()) {
                  return <p key={i} style={{ marginBottom: "8px", fontSize: "0.9rem", lineHeight: 1.6 }}>{line}</p>;
                }
                return null;
              })}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .tool-header { margin-bottom: 24px; }
        .tool-body { display: grid; gap: 16px; }
        .tool-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .mode-tabs { display: flex; gap: 0; }
        .mode-tab {
          flex: 1;
          border: var(--border-width) solid var(--border);
          padding: 10px 16px;
          font-family: inherit;
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          background: var(--panel-bg);
          color: var(--muted);
          cursor: pointer;
        }
        .mode-tab:first-child { border-right: none; }
        .mode-tab.active {
          background: var(--fg);
          color: var(--bg);
          border-color: var(--fg);
        }
        .code-area {
          width: 100%;
          border: var(--border-width) solid var(--border);
          padding: 16px;
          background: var(--panel-bg);
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.85rem;
          line-height: 1.5;
          color: var(--fg);
          outline: none;
        }
        .url-input { padding: 12px 16px; }
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
        .summary-output {
          border: var(--border-width) solid var(--border);
          padding: 20px;
          background: var(--panel-bg);
        }
      `}</style>
    </div>
  );
}
