"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <ThemeProvider>
      <div className="flex min-h-screen bg-background">
        <div className="hidden lg:block">
          <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        </div>
        <div className="flex flex-1 flex-col min-w-0">
          <Header
            onToggleSidebar={() => setCollapsed(!collapsed)}
            title="Tableau de bord"
            subtitle="Pilotage quotidien de l'unité de production"
          />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </ThemeProvider>
  );
}
