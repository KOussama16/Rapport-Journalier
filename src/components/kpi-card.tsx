import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: LucideIcon;
  color?: string;
  trend?: number;
}

export function KpiCard({ label, value, subValue, icon: Icon, color = "hsl(var(--primary))" }: KpiCardProps) {
  return (
    <Card className="animate-fade-in transition-shadow hover:shadow-md">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-1.5 text-2xl font-bold leading-tight text-foreground">{value}</p>
            {subValue && <p className="mt-1 text-xs text-muted-foreground">{subValue}</p>}
          </div>
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
