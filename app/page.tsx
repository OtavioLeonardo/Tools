"use client";

import { getTools } from "@/lib/tools";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useMemo } from "react";

export default function HomePage() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category") ?? "";

  const tools = useMemo(() => getTools(), []);

  const filtered = category
    ? tools.filter((t) => t.category === category)
    : tools;

  const groups = useMemo(() => {
    const map = new Map<string, (typeof tools)>();
    for (const tool of filtered) {
      const cat = tool.category || "other";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(tool);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "8px" }}>
          {category ? category.toUpperCase() : "工作台"}
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
          {filtered.length} 个工具
          {category ? ` / 共 ${tools.length} 个` : ""}
        </p>
      </div>

      <div style={{ display: "grid", gap: "40px" }}>
        {groups.map(([cat, catTools]) => (
          <section key={cat}>
            {!category && (
              <h2 className="category-heading">{cat.toUpperCase()}</h2>
            )}
            <div className="tool-grid">
              {catTools.map((tool) => (
                <Link key={tool.slug} href={`/tools/${tool.slug}`} className="tool-card">
                  <div className="tool-card-header">
                    <span className="tool-card-icon">{tool.ai ? "🤖" : "🔧"}</span>
                    <div className="tool-card-tags">
                      {tool.tags.map((tag) => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <h3 className="tool-card-name">{tool.name}</h3>
                  <p className="tool-card-desc">{tool.description}</p>
                  <span className="tool-card-arrow">→</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
