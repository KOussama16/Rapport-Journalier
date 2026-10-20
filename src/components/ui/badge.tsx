import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

const variantStyles: Record<string, string> = {
  default: "bg-primary/10 text-primary border-primary/20",
  success: "bg-accent/10 text-accent border-accent/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  error: "bg-error/10 text-error border-error/20",
  neutral: "bg-muted text-muted-foreground border-border",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variantStyles;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
