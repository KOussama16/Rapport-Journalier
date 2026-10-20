"use client";

import { Menu } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";
import Link from "next/link";

interface HeaderProps {
  onToggleSidebar: () => void;
  title: string;
  subtitle?: string;
}

export function Header({ onToggleSidebar, title, subtitle }: HeaderProps) {
  const today = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card px-4 shadow-sm md:px-6">
      <button
        onClick={onToggleSidebar}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted lg:hidden"
        aria-label="Basculer le menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1">
        <h1 className="text-base font-semibold leading-tight md:text-lg">{title}</h1>
        {subtitle && <p className="hidden text-xs text-muted-foreground sm:block">{subtitle}</p>}
      </div>

      <div className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
        <span className="capitalize">{today}</span>
      </div>

      <Link href="/nouvelle-saisie">
        <Button size="sm" variant="secondary">
          Nouveau rapport
        </Button>
      </Link>

      <ThemeToggle />
    </header>
  );
}
