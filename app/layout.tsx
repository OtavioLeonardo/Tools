import type { Metadata } from "next";
import "./globals.css";
import { AIProviderClient } from "./components/ai-provider-client";

export const metadata: Metadata = {
  title: "工作台 — 在线工具集",
  description: "一个野蛮主义风格的在线工具集合",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <AIProviderClient>{children}</AIProviderClient>
      </body>
    </html>
  );
}
