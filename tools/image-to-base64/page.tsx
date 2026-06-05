"use client";

import { useState, useCallback } from "react";

export default function ImageToBase64() {
  const [base64, setBase64] = useState("");
  const [imgSize, setImgSize] = useState("");
  const [preview, setPreview] = useState("");
  const [copied, setCopied] = useState(false);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgSize(file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(1)} KB` : `${(file.size / 1024 / 1024).toFixed(2)} MB`);

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setBase64(dataUrl);
      setPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  }, []);

  const copyBase64 = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(base64);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      const el = document.createElement("textarea");
      el.value = base64;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [base64]);

  const copyMarkdown = useCallback(async () => {
    const md = `![image](${base64})`;
    try {
      await navigator.clipboard.writeText(md);
    } catch {
      const el = document.createElement("textarea");
      el.value = md;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
  }, [base64]);

  const copyHtml = useCallback(async () => {
    const html = `<img src="${base64}" alt="image" />`;
    try {
      await navigator.clipboard.writeText(html);
    } catch {
      const el = document.createElement("textarea");
      el.value = html;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
  }, [base64]);

  const copyCss = useCallback(async () => {
    const css = `url(${base64})`;
    try {
      await navigator.clipboard.writeText(css);
    } catch {
      const el = document.createElement("textarea");
      el.value = css;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
  }, [base64]);

  return (
    <div>
      <div className="tool-header"><h1>图片转 Base64</h1></div>

      <div className="tool-layout">
        <div className="config-side">
          <label className="field">
            <span>上传图片</span>
            <input type="file" accept="image/*" onChange={handleFile} />
          </label>

          {base64 && (
            <>
              <div className="field">
                <span>Base64 编码 ({imgSize} → {(base64.length / 1024).toFixed(1)} KB)</span>
                <textarea className="code-area code-sm" value={base64} readOnly rows={6} />
              </div>

              <div className="copy-actions">
                <button className="btn" onClick={copyBase64}>
                  {copied ? "已复制" : "复制 Data URL"}
                </button>
                <button className="btn btn-sm" onClick={copyMarkdown}>MD</button>
                <button className="btn btn-sm" onClick={copyHtml}>HTML</button>
                <button className="btn btn-sm" onClick={copyCss}>CSS</button>
              </div>
            </>
          )}
        </div>

        <div className="preview-side">
          {preview ? (
            <div className="preview-wrap">
              <p className="preview-label">预览</p>
              <img src={preview} alt="preview" className="preview-img" />
            </div>
          ) : (
            <div className="preview-placeholder">选择图片后预览</div>
          )}
        </div>
      </div>

      <style jsx>{`
        .tool-header { margin-bottom: 24px; }
        .tool-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: start; }
        .config-side { display: grid; gap: 16px; }
        .preview-side { display: grid; gap: 12px; }
        .field { display: grid; gap: 8px; }
        .field span {
          font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.06em; color: var(--muted);
        }
        .field input[type="file"] { font-size: 0.85rem; }
        .code-area {
          width: 100%; border: var(--border-width) solid var(--border); padding: 12px;
          background: var(--panel-bg); font-family: 'JetBrains Mono', monospace;
          font-size: 0.7rem; line-height: 1.4; color: var(--fg); outline: none;
          resize: vertical; word-break: break-all;
        }
        .code-sm { min-height: 120px; }
        .copy-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .btn-sm { padding: 6px 12px; font-size: 0.65rem; }
        .preview-wrap {
          border: var(--border-width) solid var(--border); background: var(--panel-bg); padding: 16px;
        }
        .preview-label {
          font-size: 0.65rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.06em; color: var(--muted); margin-bottom: 12px;
        }
        .preview-img { max-width: 100%; max-height: 360px; display: block; margin: 0 auto; }
        .preview-placeholder {
          height: 300px; border: var(--border-width) dashed var(--border);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.85rem; color: var(--muted); background: var(--panel-bg);
        }
      `}</style>
    </div>
  );
}
