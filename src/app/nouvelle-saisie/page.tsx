"use client";

import { useMemo, useState, useId } from "react";
import { Plus, Trash as Trash2, Package, Target, Percent, CircleAlert, FileCheck as FileCheck2, Clock, Factory, ClipboardList, Save, Info, Layers } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, Input } from "@/components/ui/select";
import type { Unit, Shift } from "@/lib/types";
import { cn, toISODate, formatNumber } from "@/lib/utils";
import {
  PRODUCTION_LINES,
  getProductById,
  productsForLine,
  isCompatible,
  type ProductionLine,
} from "@/lib/production-referential";

const SHIFTS: { value: Shift; label: string }[] = [
  { value: "Matin", label: "Shift A — Matin" },
  { value: "Après-midi", label: "Shift B — Après-midi" },
  { value: "Nuit", label: "Nuit" },
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
  heureDebut: string;
  heureFin: string;
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
    heureDebut: "",
    heureFin: "",
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

const EMPTY_SUMMARY = {
  byUnit: {} as Record<Unit, { target: number; produced: number; conforme: number; rejete: number; rows: number }>,
  sequences: 0,
  linesUsed: 0,
};

export default function NouvelleSaisiePage() {
  const reactId = useId();
  const today = toISODate(new Date());

  // General info
  const [date, setDate] = useState(today);
  const [shift, setShift] = useState<Shift>("Matin");
  const [responsable, setResponsable] = useState("");
  const [heureDebut, setHeureDebut] = useState("06:00");
  const [heureFin, setHeureFin] = useState("14:00");
  const [observations, setObservations] = useState("");

  // Production rows — start empty; the operator chooses a line first, then a product.
  const [rows, setRows] = useState<ProductionRow[]>([makeRow()]);

  // Saved state
  const [saved, setSaved] = useState(false);

  const generalValid = date && shift && responsable.trim().length > 0 && heureDebut && heureFin;

  function updateRow(id: string, patch: Partial<ProductionRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function changeLine(id: string, newLine: ProductionLine) {
    const row = rows.find((r) => r.id === id);
    if (!row) return;
    // If a product is selected and is no longer compatible with the new line, reset it.
    if (row.productId && !isCompatible(row.productId, newLine)) {
      updateRow(id, { line: newLine, productId: "", unit: "unité", target: 0 });
    } else {
      updateRow(id, { line: newLine });
    }
  }

  function changeProduct(id: string, productId: string) {
    const product = getProductById(productId);
    if (!product) {
      updateRow(id, { productId: "", unit: "unité", target: 0 });
      return;
    }
    updateRow(id, { productId, unit: product.unit, target: product.defaultTarget });
  }

  function addRow() {
    setRows((prev) => [...prev, makeRow()]);
  }

  function removeRow(id: string) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  }

  const summary = useMemo(() => {
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
  }, [rows]);

  const overallRate = useMemo(() => {
    let t = 0;
    let p = 0;
    for (const u of Object.values(summary.byUnit)) {
      t += u.target;
      p += u.produced;
    }
    return t > 0 ? (p / t) * 100 : null;
  }, [summary]);

  const validSequences = rows.filter((r) => r.line && r.productId).length;

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
            <ClipboardList className="h-4 w-4 text-secondary" /> Informations générales
          </CardTitle>
          <CardDescription>Identification du rapport de production</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${reactId}-date`} className="text-xs font-medium text-muted-foreground">
                Date de production
              </label>
              <input
                id={`${reactId}-date`}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground transition-colors focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <Select label="Équipe" value={shift} onChange={(e) => setShift(e.target.value as Shift)}>
              {SHIFTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
            <Input
              label="Responsable de production"
              placeholder="Nom du responsable"
              value={responsable}
              onChange={(e) => setResponsable(e.target.value)}
            />
            <Input
              label="Heure de début du shift"
              type="time"
              value={heureDebut}
              onChange={(e) => setHeureDebut(e.target.value)}
            />
            <Input
              label="Heure de fin du shift"
              type="time"
              value={heureFin}
              onChange={(e) => setHeureFin(e.target.value)}
            />
            <div className="flex flex-col gap-1.5 sm:col-span-1 lg:col-span-3">
              <label htmlFor={`${reactId}-obs`} className="text-xs font-medium text-muted-foreground">
                Observations générales
              </label>
              <textarea
                id={`${reactId}-obs`}
                rows={3}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Contexte, événements particuliers, commentaires sur la journée…"
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
          {!generalValid && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-warning">
              <CircleAlert className="h-3.5 w-3.5" />
              La date, l&apos;équipe, le responsable et les heures de shift sont obligatoires.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Production entries */}
      <Card className="animate-fade-in">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Factory className="h-4 w-4 text-secondary" /> Saisie de la production
            </CardTitle>
            <CardDescription>
              Sélectionnez une ligne, puis un produit compatible. Une ligne peut apparaître plusieurs fois lors d&apos;un changement de produit.
            </CardDescription>
          </div>
          <Button variant="secondary" size="sm" onClick={addRow}>
            <Plus className="h-4 w-4" /> Ajouter une ligne
          </Button>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1100px]">
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
                  <th className="px-3 py-3 font-medium w-[90px]">Début</th>
                  <th className="px-3 py-3 font-medium w-[90px]">Fin</th>
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
                          onChange={(e) => changeLine(r.id, e.target.value as ProductionLine)}
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
                          onChange={(e) => changeProduct(r.id, e.target.value)}
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
                        <NumInput value={r.target} onChange={(v) => updateRow(r.id, { target: v })} />
                      </td>
                      <td className="px-3 py-2">
                        <NumInput value={r.produced} onChange={(v) => updateRow(r.id, { produced: v })} />
                      </td>
                      <td className="px-3 py-2">
                        <NumInput value={r.conforme} onChange={(v) => updateRow(r.id, { conforme: v })} />
                      </td>
                      <td className="px-3 py-2">
                        <NumInput value={r.rejete} onChange={(v) => updateRow(r.id, { rejete: v })} />
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
                      <td className="px-3 py-2">
                        <input
                          type="time"
                          value={r.heureDebut}
                          onChange={(e) => updateRow(r.id, { heureDebut: e.target.value })}
                          className="h-9 w-full rounded-lg border border-border bg-card px-1 text-xs text-foreground transition-colors focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="time"
                          value={r.heureFin}
                          onChange={(e) => updateRow(r.id, { heureFin: e.target.value })}
                          className="h-9 w-full rounded-lg border border-border bg-card px-1 text-xs text-foreground transition-colors focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => removeRow(r.id)}
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

          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{validSequences}</span> séquence(s) validée(s) · {rows.length - validSequences} incomplète(s)
            </p>
            <Button variant="outline" size="sm" onClick={addRow}>
              <Plus className="h-4 w-4" /> Ajouter une ligne
            </Button>
          </div>
        </CardContent>
      </Card>

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
              label="Séquences saisies"
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
              label="Amplitude shift"
              value={shiftDuration(heureDebut, heureFin)}
            />
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
