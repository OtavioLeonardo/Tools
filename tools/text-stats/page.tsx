"use client";

import { useState, useMemo, useCallback } from "react";

const CHINESE_RE = /[\u4e00-\u9fff\u3400-\u4dbf]/g;
const PUNCTUATION_RE = /[，。！？、；：""''（）【】《》〈〉·—…\!\?,\.:;"'\(\)\[\]\{\}]/g;
const MARKDOWN_HEADING_RE = /^#{1,6}\s+.+$/gm;
const MARKDOWN_FENCE_RE = /```[\s\S]*?```/g;
const MARKDOWN_INLINE_RE = /`[^`]+`/g;
const MARKDOWN_LINK_RE = /\[([^\]]*)\]\([^)]*\)/g;
const MARKDOWN_IMG_RE = /!\[.*?\]\([^)]*\)/g;
const MARKDOWN_BOLD_RE = /\*\*([^*]+)\*\*/g;
const MARKDOWN_ITALIC_RE = /\*([^*]+)\*/g;
const MARKDOWN_LIST_RE = /^[\s]*[-*+]\s/gm;
const MARKDOWN_BLOCKQUOTE_RE = /^>\s?/gm;

function stripMarkdown(text: string): string {
  return text
    .replace(MARKDOWN_FENCE_RE, "")
    .replace(MARKDOWN_HEADING_RE, "")
    .replace(MARKDOWN_IMG_RE, "")
    .replace(MARKDOWN_LINK_RE, "$1")
    .replace(MARKDOWN_BOLD_RE, "$1")
    .replace(MARKDOWN_ITALIC_RE, "$1")
    .replace(MARKDOWN_INLINE_RE, "$1")
    .replace(MARKDOWN_LIST_RE, "")
    .replace(MARKDOWN_BLOCKQUOTE_RE, "");;
}

function countChinese(text: string): number {
  const matches = text.match(CHINESE_RE);
  return matches ? matches.length : 0;
}

function countPunctuation(text: string): number {
  const matches = text.match(PUNCTUATION_RE);
  return matches ? matches.length : 0;
}

function countWords(text: string): number {
  const english = text.replace(CHINESE_RE, "").match(/[a-zA-Z0-9]+/g);
  return (english ? english.length : 0) + countChinese(text);
}

function countSentences(text: string): number {
  const matches = text.match(/[^。！？.!?\n]+[。！？.!?]+/g);
  return matches ? matches.length : 0;
}

function countParagraphs(text: string): number {
  return text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;
}

export default function TextStats() {
  const [text, setText] = useState("");
  const [excludeHeadings, setExcludeHeadings] = useState(true);
  const [excludeCode, setExcludeCode] = useState(true);
  const [excludePunctuation, setExcludePunctuation] = useState(false);
  const [stripMd, setStripMd] = useState(true);

  const processed = useMemo(() => {
    let t = text;

    if (stripMd) {
      t = stripMarkdown(t);
    }
    if (excludeHeadings) {
      t = t.replace(MARKDOWN_HEADING_RE, "");
    }
    if (excludeCode) {
      t = t.replace(MARKDOWN_FENCE_RE, "");
    }

    const charsTotal = text.length;
    const charsNoSpace = text.replace(/\s/g, "").length;
    const punctCount = countPunctuation(t);
    const charsNoPunct = charsTotal - punctCount - (text.match(/\s/g) || []).length - (stripMd ? (text.match(MARKDOWN_FENCE_RE) || []).reduce((acc, b) => acc + b.length, 0) : 0);
    const chineseChars = countChinese(t);
    const wordsTotal = countWords(t);
    const lines = text ? text.split("\n").length : 0;
    const paragraphs = countParagraphs(t);
    const sentences = countSentences(t);

    const readingTimeCn = Math.ceil(chineseChars / 400);
    const readingTimeEn = Math.ceil(wordsTotal / 238);
    const readingTime = Math.max(readingTimeCn, readingTimeEn, 1);
    const speakingTime = Math.max(Math.ceil(wordsTotal / 150), 1);

    return {
      charsTotal,
      charsNoSpace,
      charsNoPunct,
      chineseChars,
      wordsTotal,
      lines,
      paragraphs,
      sentences,
      readingTime,
      speakingTime,
    };
  }, [text, excludeHeadings, excludeCode, excludePunctuation, stripMd]);

  const clear = useCallback(() => setText(""), []);

  return (
    <div>
      <div className="tool-header"><h1>字符统计</h1></div>

      <div className="tool-layout">
        <div className="input-side">
          <div className="panel">
            <label className="panel-label">输入文本 (支持 Markdown)</label>
            <textarea
              className="code-area code-area-lg"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="粘贴文本到这里..."
            />
          </div>
        </div>

        <div className="stats-side">
          <div className="opts-box">
            <label className="toggle-row">
              <input type="checkbox" checked={stripMd} onChange={(e) => setStripMd(e.target.checked)} />
              <span>去除 Markdown 语法</span>
            </label>
            <label className="toggle-row">
              <input type="checkbox" checked={excludeHeadings} onChange={(e) => setExcludeHeadings(e.target.checked)} />
              <span>排除标题</span>
            </label>
            <label className="toggle-row">
              <input type="checkbox" checked={excludeCode} onChange={(e) => setExcludeCode(e.target.checked)} />
              <span>排除代码块</span>
            </label>
            <label className="toggle-row">
              <input type="checkbox" checked={excludePunctuation} onChange={(e) => setExcludePunctuation(e.target.checked)} />
              <span>排除标点</span>
            </label>
          </div>

          <div className="stats-grid">
            <StatBox label="总字符" value={processed.charsTotal} />
            <StatBox label="无空格" value={processed.charsNoSpace} />
            <StatBox label="无标点" value={excludePunctuation ? processed.charsNoPunct : "—"} dim={!excludePunctuation} />
            <StatBox label="中文字" value={processed.chineseChars} />
            <StatBox label="总词数" value={processed.wordsTotal} />
            <StatBox label="行数" value={processed.lines} />
            <StatBox label="段落" value={processed.paragraphs} />
            <StatBox label="句子" value={processed.sentences} />
            <StatBox label="阅读时间" value={`${processed.readingTime} 分钟`} accent />
            <StatBox label="朗读时间" value={`${processed.speakingTime} 分钟`} accent />
          </div>

          <button className="btn" onClick={clear} style={{ marginTop: 8 }}>
            清空
          </button>
        </div>
      </div>

      <style jsx>{`
        .tool-header { margin-bottom: 24px; }
        .tool-layout {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 32px;
          align-items: start;
        }
        .panel { display: grid; gap: 8px; }
        .panel-label {
          display: block;
          font-weight: 700;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--muted);
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
          resize: vertical;
        }
        .code-area-lg { min-height: 440px; }
        .code-area:focus { border-color: var(--accent); }
        .stats-side { display: grid; gap: 16px; }
        .opts-box {
          border: var(--border-width) solid var(--border);
          background: var(--panel-bg);
          padding: 16px;
          display: grid;
          gap: 10px;
        }
        .toggle-row {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.8rem;
          cursor: pointer;
        }
        .toggle-row input[type="checkbox"] {
          width: 16px;
          height: 16px;
          accent-color: var(--accent);
          cursor: pointer;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .stat-box {
          border: var(--border-width) solid var(--border);
          background: var(--panel-bg);
          padding: 14px 16px;
        }
        .stat-box.accent { background: var(--fg); color: var(--bg); border-color: var(--fg); }
        .stat-label {
          display: block;
          font-size: 0.6rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--muted);
          margin-bottom: 4px;
        }
        .stat-box.accent .stat-label { color: var(--bg); opacity: 0.6; }
        .stat-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 1.15rem;
          font-weight: 900;
        }
        .stat-value.dim { color: var(--muted); font-weight: 400; }
      `}</style>
    </div>
  );
}

function StatBox({ label, value, accent, dim }: { label: string; value: number | string; accent?: boolean; dim?: boolean }) {
  return (
    <div className={`stat-box ${accent ? "accent" : ""}`}>
      <span className="stat-label">{label}</span>
      <span className={`stat-value ${dim ? "dim" : ""}`}>{value}</span>
    </div>
  );
}
