"use client";

import { useState, useCallback } from "react";

interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export function useAIChat(systemPrompt?: string) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (apiUrl: string, apiKey: string, model: string, temperature: number, maxTokens: number, userMessage: string) => {
      setLoading(true);
      setError(null);

      const msgs: AIMessage[] = [];
      if (systemPrompt) {
        msgs.push({ role: "system", content: systemPrompt });
      }
      msgs.push(...messages, { role: "user", content: userMessage });

      setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

      try {
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: msgs,
            temperature,
            max_tokens: maxTokens,
          }),
        });

        if (!res.ok) {
          const body = await res.text();
          throw new Error(`API error ${res.status}: ${body.slice(0, 200)}`);
        }

        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content ?? "";
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      } catch (err: any) {
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    },
    [messages, systemPrompt]
  );

  const clear = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, loading, error, send, clear };
}
