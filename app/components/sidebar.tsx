"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAIConfig } from "./ai-provider";
import { getTools, type ToolMeta } from "@/lib/tools";

const CATEGORY_LABELS: Record<string, { label: string; icon: string; order: number }> = {
  ai: { label: "AI", icon: "🤖", order: 0 },
  image: { label: "图片", icon: "🖼", order: 1 },
  text: { label: "文本", icon: "📝", order: 2 },
  data: { label: "数据", icon: "📊", order: 3 },
  encode: { label: "编码", icon: "🔣", order: 4 },
  web: { label: "网络", icon: "🌐", order: 5 },
  security: { label: "安全", icon: "🔒", order: 6 },
  color: { label: "颜色", icon: "🎨", order: 7 },
};

export default function Sidebar() {
  const { openSettings } = useAIConfig();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") ?? "";

  const tools = useMemo(() => getTools(), []);

  const categories = useMemo(() => {
    const map = new Map<string, { tools: ToolMeta[]; label: string; icon: string }>();
    for (const tool of tools) {
      const cat = tool.category || "other";
      if (!map.has(cat)) {
        map.set(cat, { tools: [], label: CATEGORY_LABELS[cat]?.label ?? cat, icon: CATEGORY_LABELS[cat]?.icon ?? "🔧" });
      }
      map.get(cat)!.tools.push(tool);
    }
    return Array.from(map.entries()).sort(([a], [b]) => (CATEGORY_LABELS[a]?.order ?? 99) - (CATEGORY_LABELS[b]?.order ?? 99));
  }, [tools]);

  const handleCategoryClick = (cat: string) => {
    if (activeCategory === cat) {
      router.push("/");
    } else {
      router.push(`/?category=${cat}`);
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <a href="/" className="sidebar-brand">工作台</a>
      </div>

      <nav className="sidebar-nav">
        <button
          className={`sidebar-item ${!activeCategory ? "active" : ""}`}
          onClick={() => router.push("/")}
        >
          <span className="sidebar-icon">🗂</span>
          <span className="sidebar-label">全部</span>
          <span className="sidebar-count">{tools.length}</span>
        </button>

        {categories.map(([cat, { tools: catTools, label, icon }]) => (
          <button
            key={cat}
            className={`sidebar-item ${activeCategory === cat ? "active" : ""}`}
            onClick={() => handleCategoryClick(cat)}
          >
            <span className="sidebar-icon">{icon}</span>
            <span className="sidebar-label">{label}</span>
            <span className="sidebar-count">{catTools.length}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-item ai-btn" onClick={openSettings}>
          <span className="sidebar-icon">⚡</span>
          <span className="sidebar-label">AI 配置</span>
        </button>
      </div>
    </aside>
  );
}
