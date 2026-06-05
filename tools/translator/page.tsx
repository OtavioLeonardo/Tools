"use client";

import { useState, useCallback } from "react";
import { useAIConfig } from "@/app/components/ai-provider";

const LANGUAGES = [
  { code: "zh", name: "Chinese" },
  { code: "en", name: "English" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "es", name: "Spanish" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "ar", name: "Arabic" },
];

export default function Translator() {
  const { config } = useAIConfig();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("en");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translate = useCallback(async () => {
    if (!input.trim()) return;
    if (!config.apiKey) {
      setError("请先在侧边栏 AI 配置中设置 API。");
      return;
    }

    setLoading(true);
    setError(null);

    const systemPrompt =
      sourceLang === "auto"
        ? `Translate the following text to ${targetLang}. Only output the translation, nothing else.`
        : `Translate the following text from ${sourceLang} to ${targetLang}. Only output the translation, nothing else.`;

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
            { role: "system", content: systemPrompt },
            { role: "user", content: input },
          ],
          temperature: config.temperature,
          max_tokens: config.maxTokens,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`API error ${res.status}: ${body.slice(0, 200)}`);
      }

      const data = await res.json();
      setOutput(data.choices?.[0]?.message?.content ?? "");
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [config, input, sourceLang, targetLang]);

  return (
    <div>
      <div className="tool-header">
        <h1>AI 翻译</h1>
      </div>
      <div className="tool-body">
        <div className="lang-row">
          <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
            <option value="auto">自动检测</option>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.name}</option>
            ))}
          </select>
          <span className="lang-arrow">→</span>
          <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.name}</option>
            ))}
          </select>
        </div>

        <div className="panel">
          <label className="panel-label">原文</label>
          <textarea
            className="code-area"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入要翻译的文本..."
          />
        </div>

        <button className="btn btn-accent" onClick={translate} disabled={loading || !input.trim()}>
          {loading ? "翻译中..." : "翻译 →"}
        </button>

        <div className="panel">
          <label className="panel-label">译文</label>
          {error ? (
            <pre className="code-area code-error">{error}</pre>
          ) : loading ? (
            <pre className="code-area">翻译中...</pre>
          ) : (
            <pre className="code-area">{output}</pre>
          )}
        </div>
      </div>
      <style jsx>{`
        .tool-header { margin-bottom: 24px; }
        .tool-body { display: grid; gap: 16px; }
        .lang-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .lang-row select {
          flex: 1;
          border: var(--border-width) solid var(--border);
          padding: 8px 12px;
          background: var(--panel-bg);
          font-family: inherit;
          font-size: 0.9rem;
          outline: none;
          cursor: pointer;
        }
        .lang-arrow { font-weight: 900; font-size: 1.2rem; }
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
