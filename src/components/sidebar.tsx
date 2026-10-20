"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out",
        collapsed ? "w-[68px]" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
          <Image src="/images.jpg" alt="La Bergère" fill sizes="36px" className="object-cover" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden animate-slide-in">
            <p className="truncate text-sm font-bold leading-tight">La Bergère SPA</p>
            <p className="truncate text-[11px] text-white/60">Unité Production Sauce</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-0.5 px-2">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    active
                      ? "bg-secondary text-white shadow-sm"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon className={cn("h-5 w-5 shrink-0", active && "text-white")} />
                  {!collapsed && <span className="truncate animate-slide-in">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse button */}
      <div className="border-t border-white/10 p-2">
        <button
          onClick={onToggle}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          )}
          title={collapsed ? "Déplier le menu" : "Replier le menu"}
        >
          <ChevronLeft className={cn("h-5 w-5 shrink-0 transition-transform duration-300", collapsed && "rotate-180")} />
          {!collapsed && <span className="animate-slide-in">Replier</span>}
        </button>
      </div>
    </aside>
  );
}
