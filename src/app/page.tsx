"use client";

import { useMemo, useState } from "react";
import {
  Package,
  Target,
  Percent,
  TrendingDown,
  Clock,
  AlertTriangle,
  FileCheck2,
  FileClock,
  ArrowRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { PRODUCTS, SHIFTS_LIST, generateDemoReports } from "@/lib/demo-data";
import {
  computeKpis,
  aggregateDaily,
  aggregateByProduct,
  aggregateLossesByCause,
  aggregateStopsByMotif,
  formatUnitValue,
} from "@/lib/kpis";
import { toISODate, addDays, formatDateShort, cn } from "@/lib/utils";
import Link from "next/link";
import type { ReportStatus } from "@/lib/types";

const STATUS_CONFIG: Record<ReportStatus, { label: string; variant: "success" | "warning" | "error" }> = {
  "validé": { label: "Validé", variant: "success" },
  "en attente": { label: "En attente", variant: "warning" },
  "rejeté": { label: "Rejeté", variant: "error" },
};

const CHART_COLORS = [
  "#2563eb", "#16a34a", "#f97316", "#dc2626", "#0891b2", "#7c3aed",
  "#db2777", "#ca8a04", "#4f46e5", "#059669", "#ea580c", "#be123c",
];

const UNIT_LABELS: Record<string, string> = {
  kg: "kg",
  g: "g",
  L: "L",
  "unité": "unités",
};

export default function DashboardPage() {
  const allReports = useMemo(() => generateDemoReports(), []);
  const today = toISODate(new Date());

  const [selectedDate, setSelectedDate] = useState(today);
  const [period, setPeriod] = useState<"7" | "30">("7");
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [selectedShift, setSelectedShift] = useState("all");

  // Filter reports by period and optional product/shift
  const periodDays = parseInt(period);
  const periodStart = toISODate(addDays(new Date(selectedDate), -(periodDays - 1)));

  const filteredReports = useMemo(() => {
    return allReports.filter((r) => {
      const inPeriod = r.date >= periodStart && r.date <= selectedDate;
      if (!inPeriod) return false;
      if (selectedShift !== "all" && r.shift !== selectedShift) return false;
      if (selectedProduct !== "all" && !r.entries.some((e) => e.productId === selectedProduct)) return false;
      return true;
    });
  }, [allReports, periodStart, selectedDate, selectedProduct, selectedShift]);

  const kpis = useMemo(() => computeKpis(filteredReports), [filteredReports]);
  const dailyData = useMemo(() => aggregateDaily(filteredReports), [filteredReports]);
  const productData = useMemo(() => aggregateByProduct(filteredReports).slice(0, 8), [filteredReports]);
  const lossData = useMemo(() => aggregateLossesByCause(filteredReports), [filteredReports]);
  const stopData = useMemo(() => aggregateStopsByMotif(filteredReports), [filteredReports]);

  const recentReports = useMemo(() => {
    return [...filteredReports]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8);
  }, [filteredReports]);

  const realizationPct = kpis.realizationRate ?? 0;
  const realizationColor =
    realizationPct >= 95 ? "#16a34a" : realizationPct >= 80 ? "#f97316" : "#dc2626";

  return (
    <div className="space-y-6">
      {/* Filters bar */}
      <Card className="animate-fade-in">
        <CardContent className="pt-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="filter-date" className="text-xs font-medium text-muted-foreground">
                Date
              </label>
              <input
                type="date"
                id="filter-date"
                value={selectedDate}
                max={today}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground transition-colors focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <Select
              label="Période"
              value={period}
              onChange={(e) => setPeriod(e.target.value as "7" | "30")}
            >
              <option value="7">7 derniers jours</option>
              <option value="30">30 derniers jours</option>
            </Select>
            <Select
              label="Produit"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
            >
              <option value="all">Tous les produits</option>
              {PRODUCTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
            <Select
              label="Équipe / Shift"
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
            >
              <option value="all">Toutes les équipes</option>
              {SHIFTS_LIST.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSelectedDate(today);
                  setPeriod("7");
                  setSelectedProduct("all");
                  setSelectedShift("all");
                }}
              >
                Réinitialiser
              </Button>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            <span className="font-medium text-warning">Données fictives</span> — générées automatiquement pour démonstration sur 14 jours. Les indicateurs sont calculés à partir de ces données et actualisés selon les filtres.
          </p>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
        {/* Quantité totale produite — by unit */}
        <KpiCard
          label="Quantité totale produite"
          value={formatTotalProduced(kpis)}
          subValue="par unité de mesure"
          icon={Package}
          color="#2563eb"
        />
        <KpiCard
          label="Objectif de production"
          value={formatTotalObjective(kpis)}
          subValue="par unité de mesure"
          icon={Target}
          color="#0891b2"
        />
        <KpiCard
          label="Taux de réalisation"
          value={`${kpis.realizationRate !== null ? kpis.realizationRate.toFixed(1) : "0"} %`}
          subValue={realizationPct >= 95 ? "Objectif atteint" : realizationPct >= 80 ? "Sous l'objectif" : "Critique"}
          icon={Percent}
          color={realizationColor}
        />
        <KpiCard
          label="Quantité de pertes"
          value={formatLosses(kpis)}
          subValue="toutes unités confondues"
          icon={TrendingDown}
          color="#dc2626"
        />
        <KpiCard
          label="Temps total d'arrêt"
          value={`${kpis.totalStopHours.toFixed(2)} h`}
          subValue={`${filteredReports.reduce((n, r) => n + r.stops.length, 0)} arrêts`}
          icon={Clock}
          color="#f97316"
        />
        <KpiCard
          label="Nombre d'incidents"
          value={String(kpis.totalIncidents)}
          subValue="incidents qualité"
          icon={AlertTriangle}
          color="#dc2626"
        />
        <KpiCard
          label="Rapports saisis"
          value={String(kpis.totalReports)}
          subValue={`sur la période ${period} j`}
          icon={FileCheck2}
          color="#16a34a"
        />
        <KpiCard
          label="Rapports en attente"
          value={String(kpis.pendingReports)}
          subValue="à valider"
          icon={FileClock}
          color="#f97316"
        />
      </div>

      {/* Charts row 1: Production vs Objective + Trend */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Production réelle vs objectif par jour</CardTitle>
            <CardDescription>Comparaison journalière sur la période sélectionnée</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tickFormatter={formatDateShort} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  labelFormatter={(v) => formatDateShort(v as string)}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="objective" name="Objectif" fill="#0891b2" radius={[4, 4, 0, 0]} />
                <Bar dataKey="produced" name="Produit" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Évolution de la production</CardTitle>
            <CardDescription>Tendance sur la période sélectionnée</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tickFormatter={formatDateShort} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  labelFormatter={(v) => formatDateShort(v as string)}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Line type="monotone" dataKey="produced" name="Production réelle" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="objective" name="Objectif" stroke="#f97316" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2: Production by product + Losses pie + Stops bar */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="animate-fade-in lg:col-span-2">
          <CardHeader>
            <CardTitle>Production par produit</CardTitle>
            <CardDescription>Top 8 produits sur la période</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={productData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis type="category" dataKey="product" width={140} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v: string) => v.length > 20 ? v.slice(0, 18) + "…" : v} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value, _name, props) => [`${value} ${(props as { payload?: { unit?: string } }).payload?.unit ?? ""}`, "Produit"]}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="produced" name="Quantité produite" fill="#2563eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Répartition des pertes par cause</CardTitle>
            <CardDescription>Causes identifiées sur la période</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={lossData}
                  dataKey="value"
                  nameKey="cause"
                  cx="50%"
                  cy="45%"
                  outerRadius={90}
                  innerRadius={45}
                  paddingAngle={2}
                >
                  {lossData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value) => [`${value}`, "Pertes"]}
                />
                <Legend wrapperStyle={{ fontSize: "10px" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Stop by motif */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle>Temps d'arrêt par motif</CardTitle>
          <CardDescription>Répartition des arrêts de production (heures)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stopData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="motif" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 16) + "…" : v} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value) => [`${value} h`, "Durée"]}
              />
              <Bar dataKey="hours" name="Heures d'arrêt" fill="#f97316" radius={[4, 4, 0, 0]}>
                {stopData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent reports table */}
      <Card className="animate-fade-in">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Derniers rapports de production</CardTitle>
            <CardDescription>Rapports récents sur la période filtrée</CardDescription>
          </div>
          <Link href="/historique">
            <Button variant="ghost" size="sm">
              Voir tout <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="px-0">
          {recentReports.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">
              Aucun rapport sur cette période. Ajustez les filtres ou créez un nouveau rapport.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Équipe</th>
                    <th className="px-5 py-3 font-medium">Opérateur</th>
                    <th className="px-5 py-3 font-medium">Produits</th>
                    <th className="px-5 py-3 text-right font-medium">Qté réalisée</th>
                    <th className="px-5 py-3 font-medium">Taux</th>
                    <th className="px-5 py-3 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {recentReports.map((r) => {
                    const totalObj = r.entries.reduce((s, e) => s + e.objective, 0);
                    const totalProd = r.entries.reduce((s, e) => s + e.produced, 0);
                    const rate = totalObj > 0 ? (totalProd / totalObj) * 100 : 0;
                    const statusCfg = STATUS_CONFIG[r.status];
                    const products = r.entries.map((e) => e.productName).join(", ");
                    const producedSummary = summarizeProduced(r.entries);

                    return (
                      <tr key={r.id} className="border-b border-border/50 transition-colors hover:bg-muted/50">
                        <td className="px-5 py-3 whitespace-nowrap">{formatDateShort(r.date)}</td>
                        <td className="px-5 py-3 whitespace-nowrap">{r.shift}</td>
                        <td className="px-5 py-3 whitespace-nowrap">{r.operator}</td>
                        <td className="px-5 py-3 max-w-[200px] truncate text-muted-foreground" title={products}>
                          {products}
                        </td>
                        <td className="px-5 py-3 text-right whitespace-nowrap text-muted-foreground text-xs">
                          {producedSummary}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <Progress value={rate} color={rate >= 95 ? "#16a34a" : rate >= 80 ? "#f97316" : "#dc2626"} className="w-16" />
                            <span className={cn("text-xs font-medium", rate >= 95 ? "text-accent" : rate >= 80 ? "text-warning" : "text-error")}>
                              {rate.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New report CTA */}
      <Card className="animate-fade-in border-secondary/30 bg-gradient-to-r from-secondary/5 to-transparent">
        <CardContent className="flex flex-col items-start gap-4 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold">Nouveau rapport de production</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Saisissez les données de production, pertes et arrêts pour une équipe.
            </p>
          </div>
          <Link href="/nouvelle-saisie">
            <Button variant="secondary" size="lg">
              <FileCheck2 className="h-4 w-4" />
              Nouveau rapport
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function formatTotalProduced(kpis: ReturnType<typeof computeKpis>): string {
  const parts: string[] = [];
  for (const [unit, data] of Object.entries(kpis.byUnit)) {
    if (data.produced > 0) {
      parts.push(formatUnitValue(data.produced, unit as import("@/lib/types").Unit));
    }
  }
  return parts.length > 0 ? parts.join(" · ") : "0";
}

function formatTotalObjective(kpis: ReturnType<typeof computeKpis>): string {
  const parts: string[] = [];
  for (const [unit, data] of Object.entries(kpis.byUnit)) {
    if (data.objective > 0) {
      parts.push(formatUnitValue(data.objective, unit as import("@/lib/types").Unit));
    }
  }
  return parts.length > 0 ? parts.join(" · ") : "0";
}

function formatLosses(kpis: ReturnType<typeof computeKpis>): string {
  const parts: string[] = [];
  for (const [unit, data] of Object.entries(kpis.byUnit)) {
    if (data.losses > 0) {
      parts.push(`${data.losses.toFixed(1)} ${UNIT_LABELS[unit] ?? unit}`);
    }
  }
  return parts.length > 0 ? parts.join(" · ") : "0";
}

function summarizeProduced(entries: { produced: number; unit: string; productName: string }[]): string {
  const byUnit = new Map<string, number>();
  for (const e of entries) {
    byUnit.set(e.unit, (byUnit.get(e.unit) ?? 0) + e.produced);
  }
  const parts: string[] = [];
  for (const [unit, total] of byUnit) {
    parts.push(`${total.toFixed(0)} ${UNIT_LABELS[unit] ?? unit}`);
  }
  return parts.join(" · ");
}
