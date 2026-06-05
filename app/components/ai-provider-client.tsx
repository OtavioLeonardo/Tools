"use client";

import { AIProvider, useAIConfig } from "./ai-provider";
import { AISettingsModal } from "./ai-settings";
import Sidebar from "./sidebar";
import { Suspense, type ReactNode } from "react";

function LayoutInner({ children }: { children: ReactNode }) {
  return (
    <div className="app-layout">
      <Suspense fallback={<SidebarFallback />}>
        <Sidebar />
      </Suspense>
      <main className="main-content">
        <Suspense fallback={<div style={{ padding: 32 }}>Loading...</div>}>
          {children}
        </Suspense>
      </main>
      <AISettingsModal />
    </div>
  );
}

function SidebarFallback() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-brand">WORKBENCH</span>
      </div>
    </aside>
  );
}

export function AIProviderClient({ children }: { children: ReactNode }) {
  return (
    <AIProvider>
      <LayoutInner>{children}</LayoutInner>
    </AIProvider>
  );
}
