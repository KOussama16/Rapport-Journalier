"use client";

import { useMemo, useState } from "react";
import { Plus, Trash as Trash2, Package, Target, Percent, FileCheck as FileCheck2, Clock, Factory, Save, Info, Layers, Sunrise, Sunset, Calendar } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Unit } from "@/lib/types";
import { cn, toISODate, formatNumber } from "@/lib/utils";
import {
  PRODUCTION_LINES,
  getProductById,
  productsForLine,
  isCompatible,
  type ProductionLine,
} from "@/lib/production-referential";

const SHIFT_TABLES: { key: "A" | "B"; label: string; icon: typeof Factory; start: string; end: string }[] = [
  { key: "A", label: "Shift A", icon: Sunrise, start: "08:00", end: "15:30" },
  { key: "B", label: "Shift B", icon: Sunset, start: "15:30", end: "22:00" },
];

const UNIT_LABELS: Record<Unit, string> = {
  kg: "kg",
  g: "g",
  L: "L",
  "unité": "unités",
};

interface ProductionRow {
  id: string;
  line: ProductionLine | "";
  productId: string;
  unit: Unit;
  target: number;
  produced: number;
  conforme: number;
  rejete: number;
}

let rowSeq = 0;
function makeRow(): ProductionRow {
  return {
    id: `row-${++rowSeq}`,
    line: "",
    productId: "",
    unit: "unité",
    target: 0,
    produced: 0,
    conforme: 0,
    rejete: 0,
  };
}

function clampNonNeg(v: string): number {
  const n = parseFloat(v);
  if (!isFinite(n) || n < 0) return 0;
  return n;
}

function rateOf(target: number, produced: number): number | null {
  if (!target || target <= 0) return null;
  return (produced / target) * 100;
}

function rateColor(rate: number | null): string {
  if (rate === null) return "#64748b";
  if (rate >= 95) return "#16a34a";
  if (rate >= 80) return "#f97316";
  return "#dc2626";
}

function rateBadge(rate: number | null): string {
  return rate !== null ? `${rate.toFixed(1)}%` : "—";
}

export default function NouvelleSaisiePage() {
  const today = toISODate(new Date());

  // Production rows per shift — each shift has its own independent table.
  const [rowsA, setRowsA] = useState<ProductionRow[]>([makeRow()]);
  const [rowsB, setRowsB] = useState<ProductionRow[]>([makeRow()]);

  // Saved state
  const [saved, setSaved] = useState(false);

  // Date is auto-filled with today's date (JJ/MM/AAAA).
  const dateDisplay = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
  const generalValid = Boolean(today);

  type ShiftKey = "A" | "B";
  function rowsFor(key: ShiftKey): ProductionRow[] {
    return key === "A" ? rowsA : rowsB;
  }
  function setRowsFor(key: ShiftKey, updater: (prev: ProductionRow[]) => ProductionRow[]) {
    if (key === "A") setRowsA(updater);
    else setRowsB(updater);
  }

  function updateRow(key: ShiftKey, id: string, patch: Partial<ProductionRow>) {
    setRowsFor(key, (prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function changeLine(key: ShiftKey, id: string, newLine: ProductionLine) {
    const row = rowsFor(key).find((r) => r.id === id);
    if (!row) return;
    if (row.productId && !isCompatible(row.productId, newLine)) {
      updateRow(key, id, { line: newLine, productId: "", unit: "unité", target: 0 });
    } else {
      updateRow(key, id, { line: newLine });
    }
  }

  function changeProduct(key: ShiftKey, id: string, productId: string) {
    const product = getProductById(productId);
    if (!product) {
      updateRow(key, id, { productId: "", unit: "unité", target: 0 });
      return;
    }
    updateRow(key, id, { productId, unit: product.unit, target: product.defaultTarget });
  }

  function addRow(key: ShiftKey) {
    setRowsFor(key, (prev) => [...prev, makeRow()]);
  }

  function removeRow(key: ShiftKey, id: string) {
    setRowsFor(key, (prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  }

  function summarize(rows: ProductionRow[]) {
    const byUnit = {} as Record<Unit, { target: number; produced: number; conforme: number; rejete: number; rows: number }>;
    const lines = new Set<string>();
    let sequences = 0;
    for (const r of rows) {
      if (!r.productId) continue;
      sequences += 1;
      lines.add(r.line);
      if (!byUnit[r.unit]) byUnit[r.unit] = { target: 0, produced: 0, conforme: 0, rejete: 0, rows: 0 };
      const u = byUnit[r.unit];
      u.target += r.target;
      u.produced += r.produced;
      u.conforme += r.conforme;
      u.rejete += r.rejete;
      u.rows += 1;
    }
    return { byUnit, sequences, linesUsed: lines.size };
  }

  const summaryA = useMemo(() => summarize(rowsA), [rowsA]);
  const summaryB = useMemo(() => summarize(rowsB), [rowsB]);

  const allRows = useMemo(() => [...rowsA, ...rowsB], [rowsA, rowsB]);

  const summary = useMemo(() => summarize(allRows), [allRows]);

  const overallRate = useMemo(() => {
    let t = 0;
    let p = 0;
    for (const u of Object.values(summary.byUnit)) {
      t += u.target;
      p += u.produced;
    }
    return t > 0 ? (p / t) * 100 : null;
  }, [summary]);

  const validSequences = allRows.filter((r) => r.line && r.productId).length;
  const validA = rowsA.filter((r) => r.line && r.productId).length;
  const validB = rowsB.filter((r) => r.line && r.productId).length;

  return (
    <div className="space-y-6">
      {/* Page intro */}
      <div className="flex flex-col gap-1 animate-fade-in">
        <h1 className="text-xl font-bold text-foreground">Nouvelle saisie de rapport</h1>
        <p className="text-sm text-muted-foreground">
          Étape 1 — Informations générales et saisie de la production. Les pertes, arrêts et incidents qualité seront ajoutés à l&apos;étape suivante.
        </p>
      </div>

      {/* Step badge */}
      <Badge variant="warning" className="w-fit">
        <Info className="h-3 w-3" /> Étape 1 / 4
      </Badge>

      {/* Section 1: General info */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-secondary" /> Date de production
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/10">
              <Calendar className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{dateDisplay}</p>
              <p className="text-xs text-muted-foreground">Date du jour, renseignée automatiquement</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Production entries — two independent shift tables */}
      {SHIFT_TABLES.map((table) => {
        const key = table.key;
        const rows = rowsFor(key);
        const sum = key === "A" ? summaryA : summaryB;
        const validCount = key === "A" ? validA : validB;
        const Icon = table.icon;
        return (
          <Card key={key} className="animate-fade-in">
            <CardHeader>
              <div className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-secondary" /> {table.label} — Saisie de la production
                  </CardTitle>
                  <CardDescription>
                    {table.start} – {table.end} · Sélectionnez une ligne puis un produit compatible. Une ligne peut apparaître plusieurs fois.
                  </CardDescription>
                </div>
                <div className="hidden items-center gap-2 sm:flex">
                  <Badge variant="default">{validCount} séquence{validCount > 1 ? "s" : ""}</Badge>
                  <Badge variant="neutral">{sum.linesUsed} ligne{sum.linesUsed > 1 ? "s" : ""}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[900px]">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="px-3 py-3 font-medium w-[90px]">Ligne</th>
                      <th className="px-3 py-3 font-medium min-w-[220px]">Produit</th>
                      <th className="px-3 py-3 font-medium w-[70px]">Unité</th>
                      <th className="px-3 py-3 text-right font-medium w-[100px]">Qté cible</th>
                      <th className="px-3 py-3 text-right font-medium w-[100px]">Qté réalisée</th>
                      <th className="px-3 py-3 text-right font-medium w-[100px]">Conforme</th>
                      <th className="px-3 py-3 text-right font-medium w-[100px]">Rejetée</th>
                      <th className="px-3 py-3 text-right font-medium w-[110px]">Écart</th>
                      <th className="px-3 py-3 font-medium w-[80px]">Taux</th>
                      <th className="px-3 py-3 font-medium w-[44px]" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const ecart = r.produced - r.target;
                      const rate = rateOf(r.target, r.produced);
                      const rColor = rateColor(rate);
                      const ecartColor = ecart >= 0 ? "text-accent" : "text-error";
                      const availableProducts = r.line ? productsForLine(r.line) : [];
                      const product = r.productId ? getProductById(r.productId) : undefined;
                      return (
                        <tr key={r.id} className="border-b border-border/50 align-middle hover:bg-muted/40">
                          <td className="px-3 py-2">
                            <select
                              value={r.line}
                              onChange={(e) => changeLine(key, r.id, e.target.value as ProductionLine)}
                              className="h-9 w-full rounded-lg border border-border bg-card px-2 text-sm text-foreground transition-colors focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                            >
                              <option value="">—</option>
                              {PRODUCTION_LINES.map((l) => (
                                <option key={l} value={l}>
                                  {l}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={r.productId}
                              disabled={!r.line}
                              onChange={(e) => changeProduct(key, r.id, e.target.value)}
                              className={cn(
                                "h-9 w-full rounded-lg border border-border bg-card px-2 text-sm text-foreground transition-colors focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring",
                                !r.line && "cursor-not-allowed opacity-50"
                              )}
                            >
                              <option value="">{r.line ? "Sélectionner un produit" : "Choisir une ligne d&apos;abord"}</option>
                              {availableProducts.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                            {product && (
                              <span className="mt-1 block text-[10px] text-muted-foreground">
                                Lignes autorisées : {product.allowedLines.join(", ")}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <span className="inline-flex rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                              {UNIT_LABELS[r.unit]}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <NumInput value={r.target} onChange={(v) => updateRow(key, r.id, { target: v })} />
                          </td>
                          <td className="px-3 py-2">
                            <NumInput value={r.produced} onChange={(v) => updateRow(key, r.id, { produced: v })} />
                          </td>
                          <td className="px-3 py-2">
                            <NumInput value={r.conforme} onChange={(v) => updateRow(key, r.id, { conforme: v })} />
                          </td>
                          <td className="px-3 py-2">
                            <NumInput value={r.rejete} onChange={(v) => updateRow(key, r.id, { rejete: v })} />
                          </td>
                          <td className={cn("px-3 py-2 text-right whitespace-nowrap font-medium", ecartColor)}>
                            {ecart >= 0 ? "+" : ""}
                            {formatNumber(ecart, 1)} <span className="text-muted-foreground font-normal">{UNIT_LABELS[r.unit]}</span>
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold"
                              style={{ backgroundColor: `${rColor}15`, color: rColor }}
                            >
                              {rateBadge(rate)}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              onClick={() => removeRow(key, r.id)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-error/10 hover:text-error disabled:opacity-30"
                              aria-label="Supprimer la ligne"
                              title="Supprimer"
                              disabled={rows.length === 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="px-5 pt-4">
                <Button variant="secondary" size="sm" onClick={() => addRow(key)}>
                  <Plus className="h-4 w-4" /> Ajouter un produit
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Visual summary */}
      <Card className="animate-fade-in border-secondary/30 bg-gradient-to-r from-secondary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-secondary" /> Récapitulatif de production
          </CardTitle>
          <CardDescription>Synthèse par unité de mesure — calculs en temps réel, unités non mélangées</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryStat
              icon={Layers}
              color="#2563eb"
              label="Séquences saisies (A + B)"
              value={String(summary.sequences)}
            />
            <SummaryStat
              icon={Factory}
              color="#0891b2"
              label="Lignes utilisées"
              value={String(summary.linesUsed)}
            />
            <SummaryStat
              icon={Target}
              color={rateColor(overallRate)}
              label="Taux de réalisation global"
              value={overallRate !== null ? `${overallRate.toFixed(1)} %` : "—"}
            />
            <SummaryStat
              icon={Clock}
              color="#f97316"
              label="Amplitude totale (A + B)"
              value={shiftDuration(SHIFT_TABLES[0].start, SHIFT_TABLES[SHIFT_TABLES.length - 1].end)}
            />
          </div>

          {/* Per-shift mini summary */}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ShiftMiniSummary label="Shift A" sequences={summaryA.sequences} linesUsed={summaryA.linesUsed} />
            <ShiftMiniSummary label="Shift B" sequences={summaryB.sequences} linesUsed={summaryB.linesUsed} />
          </div>

          {/* Per-unit breakdown */}
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Unité</th>
                  <th className="px-3 py-2 text-right font-medium">Séquences</th>
                  <th className="px-3 py-2 text-right font-medium">Qté cible</th>
                  <th className="px-3 py-2 text-right font-medium">Qté réalisée</th>
                  <th className="px-3 py-2 text-right font-medium">Conforme</th>
                  <th className="px-3 py-2 text-right font-medium">Rejetée</th>
                  <th className="px-3 py-2 text-right font-medium">Écart</th>
                  <th className="px-3 py-2 font-medium">Taux</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(summary.byUnit).length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">
                      Aucune séquence complète. Sélectionnez une ligne et un produit.
                    </td>
                  </tr>
                ) : (
                  Object.entries(summary.byUnit).map(([unit, d]) => {
                    const ecart = d.produced - d.target;
                    const rate = rateOf(d.target, d.produced);
                    const rColor = rateColor(rate);
                    return (
                      <tr key={unit} className="border-b border-border/50">
                        <td className="px-3 py-2 font-medium">{UNIT_LABELS[unit as Unit]}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">{d.rows}</td>
                        <td className="px-3 py-2 text-right">{formatNumber(d.target, 1)}</td>
                        <td className="px-3 py-2 text-right">{formatNumber(d.produced, 1)}</td>
                        <td className="px-3 py-2 text-right text-accent">{formatNumber(d.conforme, 1)}</td>
                        <td className="px-3 py-2 text-right text-error">{formatNumber(d.rejete, 1)}</td>
                        <td className={cn("px-3 py-2 text-right font-medium", ecart >= 0 ? "text-accent" : "text-error")}>
                          {ecart >= 0 ? "+" : ""}
                          {formatNumber(ecart, 1)}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className="inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold"
                            style={{ backgroundColor: `${rColor}15`, color: rColor }}
                          >
                            {rateBadge(rate)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
        {saved && (
          <span className="text-sm text-muted-foreground">
            <Info className="mr-1 inline h-3.5 w-3.5 text-secondary" />
            Étape 1 prête. La sauvegarde définitive sera disponible à l&apos;étape suivante.
          </span>
        )}
        <Button
          variant="secondary"
          size="lg"
          disabled={!generalValid || validSequences === 0}
          onClick={() => setSaved(true)}
        >
          <Save className="h-4 w-4" /> Enregistrer l&apos;étape 1
        </Button>
      </div>
    </div>
  );
}

function NumInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      min={0}
      step="any"
      value={value === 0 ? "" : value}
      placeholder="0"
      onChange={(e) => onChange(clampNonNeg(e.target.value))}
      className="h-9 w-full rounded-lg border border-border bg-card px-2 text-right text-sm text-foreground transition-colors focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
    />
  );
}

function SummaryStat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Package;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-lg font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function ShiftMiniSummary({ label, sequences, linesUsed }: { label: string; sequences: number; linesUsed: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span><span className="font-medium text-foreground">{sequences}</span> séquence{sequences > 1 ? "s" : ""}</span>
        <span className="text-border">|</span>
        <span><span className="font-medium text-foreground">{linesUsed}</span> ligne{linesUsed > 1 ? "s" : ""}</span>
      </div>
    </div>
  );
}

function shiftDuration(debut: string, fin: string): string {
  if (!debut || !fin) return "—";
  const [h1, m1] = debut.split(":").map(Number);
  const [h2, m2] = fin.split(":").map(Number);
  let mins = h2 * 60 + m2 - (h1 * 60 + m1);
  if (mins < 0) mins += 24 * 60; // overnight
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h${m.toString().padStart(2, "0")}`;
}
