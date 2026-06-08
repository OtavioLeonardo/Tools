"use client";

import { useCallback, useEffect, useState } from "react";
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

const HISTORY_KEY = "workbench_translator_history";
const HISTORY_LIMIT = 10;

interface TranslationHistoryItem {
  id: string;
  input: string;
  output: string;
  sourceLang: string;
  targetLang: string;
  createdAt: number;
}

function loadHistory(): TranslationHistoryItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, HISTORY_LIMIT) : [];
  } catch {
    return [];
  }
}

function saveHistory(items: TranslationHistoryItem[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, HISTORY_LIMIT)));
  } catch {}
}

function detectDefaultDirection(text: string) {
  const chineseCount = (text.match(/[\u3400-\u9fff]/g) || []).length;
  const englishCount = (text.match(/[A-Za-z]/g) || []).length;

  if (chineseCount === 0 && englishCount === 0) {
    return { sourceLang: "auto", targetLang: "en" };
  }

  if (chineseCount >= englishCount) {
    return { sourceLang: "zh", targetLang: "en" };
  }

  return { sourceLang: "en", targetLang: "zh" };
}

export default function Translator() {
  const { config } = useAIConfig();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("en");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<TranslationHistoryItem[]>([]);
  const [autoDirection, setAutoDirection] = useState(true);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  useEffect(() => {
    if (!autoDirection) return;

    const direction = detectDefaultDirection(input);
    setSourceLang(direction.sourceLang);
    setTargetLang(direction.targetLang);
  }, [autoDirection, input]);

  const pushHistory = useCallback((item: TranslationHistoryItem) => {
    setHistory((prev) => {
      const next = [
        item,
        ...prev.filter((entry) => (
          entry.input !== item.input ||
          entry.output !== item.output ||
          entry.sourceLang !== item.sourceLang ||
          entry.targetLang !== item.targetLang
        )),
      ].slice(0, HISTORY_LIMIT);

      saveHistory(next);
      return next;
    });
  }, []);

  const handleSourceLangChange = (value: string) => {
    setAutoDirection(false);
    setSourceLang(value);
  };

  const handleTargetLangChange = (value: string) => {
    setAutoDirection(false);
    setTargetLang(value);
  };

  const enableAutoDirection = () => {
    setAutoDirection(true);
    const direction = detectDefaultDirection(input);
    setSourceLang(direction.sourceLang);
    setTargetLang(direction.targetLang);
  };

  const applyHistoryItem = (item: TranslationHistoryItem) => {
    setAutoDirection(false);
    setInput(item.input);
    setOutput(item.output);
    setSourceLang(item.sourceLang);
    setTargetLang(item.targetLang);
    setError(null);
  };

  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
  };

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
      const translated = data.choices?.[0]?.message?.content ?? "";
      setOutput(translated);

      if (translated.trim()) {
        pushHistory({
          id: `${Date.now()}`,
          input: input.trim(),
          output: translated.trim(),
          sourceLang,
          targetLang,
          createdAt: Date.now(),
        });
      }
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [config, input, pushHistory, sourceLang, targetLang]);

  return (
    <div>
      <div className="tool-header">
        <h1>AI 翻译</h1>
      </div>
      <div className="tool-body">
        <div className="lang-row">
          <select value={sourceLang} onChange={(e) => handleSourceLangChange(e.target.value)}>
            <option value="auto">自动检测</option>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.name}</option>
            ))}
          </select>
          <span className="lang-arrow">→</span>
          <select value={targetLang} onChange={(e) => handleTargetLangChange(e.target.value)}>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.name}</option>
            ))}
          </select>
        </div>

        <div className="tool-toolbar">
          <span className="direction-hint">
            {autoDirection ? "已开启默认中英互译" : "当前为手动语言方向"}
          </span>
          {!autoDirection && (
            <button className="btn btn-secondary" onClick={enableAutoDirection}>
              恢复自动中英
            </button>
          )}
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

        <div className="panel">
          <div className="history-header">
            <label className="panel-label">最近翻译</label>
            {history.length > 0 && (
              <button className="btn history-clear" onClick={clearHistory}>
                清空历史
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <div className="history-empty">暂无历史记录，最近 10 条翻译会保存在本地。</div>
          ) : (
            <div className="history-list">
              {history.map((item) => (
                <button
                  key={item.id}
                  className="history-item"
                  onClick={() => applyHistoryItem(item)}
                >
                  <div className="history-meta">
                    <span>{item.sourceLang} → {item.targetLang}</span>
                    <span>{new Date(item.createdAt).toLocaleString("zh-CN", {
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}</span>
                  </div>
                  <div className="history-text">
                    <strong>原文：</strong>{item.input}
                  </div>
                  <div className="history-text">
                    <strong>译文：</strong>{item.output}
                  </div>
                </button>
              ))}
            </div>
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
        .tool-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }
        .direction-hint {
          font-size: 0.75rem;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
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
        pre.code-area {
          white-space: pre-wrap;
          word-break: break-word;
          overflow-wrap: anywhere;
        }
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
        .btn-secondary {
          font-size: 0.75rem;
          padding: 6px 12px;
        }
        .history-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 8px;
        }
        .history-clear {
          font-size: 0.75rem;
          padding: 6px 12px;
        }
        .history-empty {
          border: var(--border-width) solid var(--border);
          padding: 16px;
          font-size: 0.85rem;
          color: var(--muted);
          background: var(--panel-bg);
        }
        .history-list {
          display: grid;
          gap: 10px;
        }
        .history-item {
          border: var(--border-width) solid var(--border);
          background: var(--panel-bg);
          padding: 14px 16px;
          text-align: left;
          display: grid;
          gap: 8px;
          transition: background 0.1s, color 0.1s;
        }
        .history-item:hover {
          background: var(--hover-bg);
          color: var(--hover-fg);
        }
        .history-meta {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--muted);
        }
        .history-item:hover .history-meta {
          color: var(--hover-fg);
          opacity: 0.8;
        }
        .history-text {
          font-size: 0.85rem;
          line-height: 1.5;
          white-space: pre-wrap;
          word-break: break-word;
          overflow-wrap: anywhere;
        }
      `}</style>
    </div>
  );
}
