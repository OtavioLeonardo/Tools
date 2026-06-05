"use client";

import { useState } from "react";
import { useAIConfig, PROVIDERS, type AIConfig } from "./ai-provider";

export function AISettingsModal() {
  const { config, setConfig, showSettings, closeSettings } = useAIConfig();
  const [draft, setDraft] = useState<AIConfig>(config);
  const [provider, setProvider] = useState<string>("deepseek");

  if (!showSettings) return null;

  const handleSave = () => {
    setConfig(draft);
    closeSettings();
  };

  const handleProviderChange = (key: string) => {
    setProvider(key);
    const p = PROVIDERS[key];
    setDraft((prev) => ({
      ...prev,
      apiUrl: p.apiUrl || prev.apiUrl,
      model: p.model || prev.model,
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") closeSettings();
  };

  return (
    <div className="modal-overlay" onClick={closeSettings} onKeyDown={handleKeyDown}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>AI 配置</h2>
          <button className="btn modal-close" onClick={closeSettings}>✕</button>
        </div>
        <div className="modal-body">
          <label className="field">
            <span>服务商</span>
            <select value={provider} onChange={(e) => handleProviderChange(e.target.value)}>
              {Object.entries(PROVIDERS).map(([key, p]) => (
                <option key={key} value={key}>{p.label}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>API URL</span>
            <input
              type="text"
              value={draft.apiUrl}
              onChange={(e) => { setProvider("custom"); setDraft({ ...draft, apiUrl: e.target.value }); }}
              placeholder="https://api.openai.com/v1/chat/completions"
            />
          </label>
          <label className="field">
            <span>API KEY</span>
            <input
              type="password"
              value={draft.apiKey}
              onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
              placeholder="sk-..."
            />
          </label>
          <label className="field">
            <span>MODEL</span>
            <input
              type="text"
              value={draft.model}
              onChange={(e) => setDraft({ ...draft, model: e.target.value })}
              placeholder="deepseek-chat"
            />
          </label>
          <div className="field-row">
            <label className="field">
              <span>TEMPERATURE</span>
              <input
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={draft.temperature}
                onChange={(e) => setDraft({ ...draft, temperature: parseFloat(e.target.value) || 0.7 })}
              />
            </label>
            <label className="field">
              <span>MAX TOKENS</span>
              <input
                type="number"
                min="1"
                max="128000"
                step="1"
                value={draft.maxTokens}
                onChange={(e) => setDraft({ ...draft, maxTokens: parseInt(e.target.value) || 4096 })}
              />
            </label>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={closeSettings}>取消</button>
          <button className="btn btn-accent" onClick={handleSave}>保存</button>
        </div>
      </div>
    </div>
  );
}
