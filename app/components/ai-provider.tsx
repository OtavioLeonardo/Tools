import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

export interface AIConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export const PROVIDERS: Record<string, { label: string; apiUrl: string; model: string }> = {
  deepseek: { label: "DeepSeek", apiUrl: "https://api.deepseek.com/v1/chat/completions", model: "deepseek-chat" },
  openai: { label: "OpenAI", apiUrl: "https://api.openai.com/v1/chat/completions", model: "gpt-4o" },
  anthropic: { label: "Anthropic", apiUrl: "https://api.anthropic.com/v1/messages", model: "claude-sonnet-4-20250514" },
  ollama: { label: "Ollama (本地)", apiUrl: "http://localhost:11434/v1/chat/completions", model: "llama3" },
  custom: { label: "自定义", apiUrl: "", model: "" },
};

const DEFAULT_CONFIG: AIConfig = {
  apiUrl: "https://api.deepseek.com/v1/chat/completions",
  apiKey: "",
  model: "deepseek-chat",
  temperature: 0.7,
  maxTokens: 4096,
};

const STORAGE_KEY = "workbench_ai_config";

function loadConfig(): AIConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_CONFIG;
}

function saveConfig(config: AIConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {}
}

interface AIContextValue {
  config: AIConfig;
  setConfig: (config: AIConfig) => void;
  showSettings: boolean;
  openSettings: () => void;
  closeSettings: () => void;
}

const AIContext = createContext<AIContextValue>({
  config: DEFAULT_CONFIG,
  setConfig: () => {},
  showSettings: false,
  openSettings: () => {},
  closeSettings: () => {},
});

export function useAIConfig() {
  return useContext(AIContext);
}

export function AIProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<AIConfig>(DEFAULT_CONFIG);
  const [showSettings, setShowSettings] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setConfigState(loadConfig());
    setMounted(true);
  }, []);

  const setConfig = useCallback((cfg: AIConfig) => {
    setConfigState(cfg);
    saveConfig(cfg);
  }, []);

  const openSettings = useCallback(() => setShowSettings(true), []);
  const closeSettings = useCallback(() => setShowSettings(false), []);

  if (!mounted) {
    return (
      <AIContext.Provider value={{ config, setConfig, showSettings: false, openSettings, closeSettings }}>
        {children}
      </AIContext.Provider>
    );
  }

  return (
    <AIContext.Provider value={{ config, setConfig, showSettings, openSettings, closeSettings }}>
      {children}
    </AIContext.Provider>
  );
}
