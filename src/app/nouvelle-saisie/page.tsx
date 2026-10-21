"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { Plus, Trash as Trash2, Package, Target, Percent, FileCheck as FileCheck2, Clock, Factory, Save, Info, Layers, Sunrise, Sunset, Calendar, TrendingDown, TriangleAlert as AlertTriangle, Wrench, Printer, Eye, ClipboardList, CircleCheck as CheckCircle2, Pencil } from "lucide-react";
import { PRODUCT_REFERENTIAL } from "@/lib/production-referential";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Unit } from "@/lib/types";
import { cn, toISODate, formatNumber } from "@/lib/utils";
import { PrintPreviewModal } from "@/components/print-preview-modal";
import type { PrintableReportData } from "@/lib/print-report-types";
import {
  PRODUCTION_LINES,
  getProductById,
  productsForLine,
  isCompatible,
  type ProductionLine,
} from "@/lib/production-referential";
import {
  computeCapacity,
  utilizationRate,
  DEFAULT_SHIFT_DURATION_HOURS,
} from "@/lib/capacity-referential";

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

type ShiftKey = "A" | "B";
type StopStatus = "ouvert" | "en cours" | "résolu";
type Severity = "faible" | "moyenne" | "élevée" | "critique";
type IncidentStatus = "ouvert" | "clôturé";

interface LossRow {
  id: string;
  shift: ShiftKey;
  line: ProductionLine | "";
  productId: string;
  quantity: number;
  cause: string;
  comment: string;
}

interface StopRow {
  id: string;
  shift: ShiftKey;
  equipment: string;
  motif: string;
  startTime: string;
  endTime: string;
  description: string;
  intervention: string;
  status: StopStatus;
}

interface IncidentRow {
  id: string;
  shift: ShiftKey;
  line: ProductionLine | "";
  productId: string;
  type: string;
  description: string;
  severity: Severity;
  quantity: number;
  responsible: string;
  action: string;
  status: IncidentStatus;
}

const LOSS_CAUSES = ["Défaut qualité", "Erreur de dosage", "Réglage ou démarrage", "Défaut de conditionnement", "Produit renversé", "Autre"];
const STOP_MOTIFS = ["Panne mécanique", "Panne électrique", "Réglage", "Nettoyage", "Attente de matière première", "Attente d'emballage", "Manque de personnel", "Autre"];
const STOP_STATUSES: StopStatus[] = ["ouvert", "en cours", "résolu"];
const INCIDENT_TYPES = ["Goût", "Texture", "Couleur", "Dosage", "Emballage", "Étiquetage", "Contamination suspectée", "Autre"];
const SEVERITIES: Severity[] = ["faible", "moyenne", "élevée", "critique"];
const INCIDENT_STATUSES: IncidentStatus[] = ["ouvert", "clôturé"];

const selCls = "h-9 w-full rounded-lg border border-border bg-card px-2 text-sm text-foreground transition-colors focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring";
const inpCls = "h-9 w-full rounded-lg border border-border bg-card px-2 text-sm text-foreground transition-colors focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring";

let auxSeq = 0;
function makeLoss(): LossRow {
  return { id: `loss-${++auxSeq}`, shift: "A", line: "", productId: "", quantity: 0, cause: LOSS_CAUSES[0], comment: "" };
}
function makeStop(): StopRow {
  return { id: `stop-${++auxSeq}`, shift: "A", equipment: "", motif: STOP_MOTIFS[0], startTime: "", endTime: "", description: "", intervention: "", status: "ouvert" };
}
function makeIncident(): IncidentRow {
  return { id: `inc-${++auxSeq}`, shift: "A", line: "", productId: "", type: INCIDENT_TYPES[0], description: "", severity: "faible", quantity: 0, responsible: "", action: "", status: "ouvert" };
}

function stopDurationMinutes(start: string, end: string): number {
  if (!start || !end) return 0;
  const [h1, m1] = start.split(":").map(Number);
  const [h2, m2] = end.split(":").map(Number);
  let mins = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (mins < 0) mins += 24 * 60;
  return mins;
}

function mergeIntervals(intervals: [number, number][]): number {
  if (intervals.length === 0) return 0;
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  let total = 0;
  let curStart = sorted[0][0];
  let curEnd = sorted[0][1];
  for (let i = 1; i < sorted.length; i++) {
    const [s, e] = sorted[i];
    if (s <= curEnd) {
      curEnd = Math.max(curEnd, e);
    } else {
      total += curEnd - curStart;
      curStart = s;
      curEnd = e;
    }
  }
  total += curEnd - curStart;
  return total;
}

function severityStyle(s: Severity): { color: string } {
  switch (s) {
    case "faible": return { color: "#64748b" };
    case "moyenne": return { color: "#f97316" };
    case "élevée": return { color: "#ea580c" };
    case "critique": return { color: "#dc2626" };
  }
}

function stopStatusStyle(s: StopStatus): { color: string } {
  switch (s) {
    case "ouvert": return { color: "#dc2626" };
    case "en cours": return { color: "#f97316" };
    case "résolu": return { color: "#16a34a" };
  }
}

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

// --- Planning (Direction Générale) -------------------------------------------

interface PlanningRow {
  id: string;
  productId: string;
  line: ProductionLine | "";
  plannedQty: number;
  unit: Unit;
  observations: string;
}

let planSeq = 0;
function makePlanningRow(): PlanningRow {
  return {
    id: `plan-${++planSeq}`,
    productId: "",
    line: "",
    plannedQty: 0,
    unit: "unité",
    observations: "",
  };
}

const PLANNING_STORAGE_KEY = (date: string) => `la-bergere-planning-${date}`;

interface SavedPlanning {
  date: string;
  rows: PlanningRow[];
  savedAt: string;
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

  // Durée productive par shift (heures) — défaut 7h
  const [durationA, setDurationA] = useState(DEFAULT_SHIFT_DURATION_HOURS);
  const [durationB, setDurationB] = useState(DEFAULT_SHIFT_DURATION_HOURS);

  // Saved state
  const [saved, setSaved] = useState(false);

  // Planning (Direction Générale) — persisted in localStorage per date
  const [planningRows, setPlanningRows] = useState<PlanningRow[]>([makePlanningRow()]);
  const [planningSaved, setPlanningSaved] = useState(false);
  const [planningEditLocked, setPlanningEditLocked] = useState(false);
  const loadedDateRef = useRef<string | null>(null);

  // Load planning from localStorage on mount / date change
  useEffect(() => {
    if (loadedDateRef.current === today) return;
    loadedDateRef.current = today;
    try {
      const raw = localStorage.getItem(PLANNING_STORAGE_KEY(today));
      if (raw) {
        const parsed = JSON.parse(raw) as SavedPlanning;
        if (parsed.rows && parsed.rows.length > 0) {
          // Reset sequence counter to avoid id collisions
          for (const r of parsed.rows) {
            const num = parseInt(r.id.replace("plan-", ""), 10);
            if (!isNaN(num) && num > planSeq) planSeq = num;
          }
          setPlanningRows(parsed.rows.map((r) => ({ ...r })));
          setPlanningSaved(true);
          setPlanningEditLocked(true);
          return;
        }
      }
    } catch {
      // ignore parse errors
    }
    setPlanningRows([makePlanningRow()]);
    setPlanningSaved(false);
    setPlanningEditLocked(false);
  }, [today]);

  function updatePlanningRow(id: string, patch: Partial<PlanningRow>) {
    setPlanningRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    setPlanningSaved(false);
  }

  function changePlanningProduct(id: string, productId: string) {
    const product = getProductById(productId);
    if (!product) {
      updatePlanningRow(id, { productId: "", unit: "unité", plannedQty: 0 });
      return;
    }
    const existingLine = planningRows.find((r) => r.id === id)?.line;
    const compatibleLine =
      existingLine && product.allowedLines.includes(existingLine)
        ? existingLine
        : product.allowedLines[0] ?? "";
    updatePlanningRow(id, {
      productId,
      unit: product.unit,
      line: compatibleLine,
    });
  }

  function changePlanningLine(id: string, newLine: ProductionLine) {
    const row = planningRows.find((r) => r.id === id);
    if (!row) return;
    if (row.productId && !isCompatible(row.productId, newLine)) {
      updatePlanningRow(id, { line: newLine, productId: "", unit: "unité" });
    } else {
      updatePlanningRow(id, { line: newLine });
    }
  }

  function addPlanningRow() {
    setPlanningRows((prev) => [...prev, makePlanningRow()]);
    setPlanningSaved(false);
  }

  function removePlanningRow(id: string) {
    setPlanningRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
    setPlanningSaved(false);
  }

  function editPlanning() {
    setPlanningEditLocked(false);
    setPlanningSaved(false);
  }

  function savePlanning() {
    const validRows = planningRows.filter((r) => r.productId && r.plannedQty > 0);
    if (validRows.length === 0) return;
    const payload: SavedPlanning = {
      date: today,
      rows: validRows.map((r) => ({ ...r })),
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(PLANNING_STORAGE_KEY(today), JSON.stringify(payload));
    } catch {
      // storage may be unavailable; state still works in-session
    }
    setPlanningRows(validRows.map((r) => ({ ...r })));
    setPlanningSaved(true);
    setPlanningEditLocked(true);
    // Auto-populate Shift A targets from planning
    populateShiftAFromPlanning(validRows);
  }

  function populateShiftAFromPlanning(planRows: PlanningRow[]) {
    setRowsA((prev) => {
      // Map existing rows by productId+line to update targets; append missing
      const existing = [...prev];
      for (const p of planRows) {
        const match = existing.find(
          (r) => r.productId === p.productId && (p.line === "" || r.line === p.line)
        );
        if (match) {
          match.target = p.plannedQty;
          if (p.line) match.line = p.line;
        } else {
          existing.push({
            id: `row-${++rowSeq}`,
            line: p.line || "",
            productId: p.productId,
            unit: p.unit,
            target: p.plannedQty,
            produced: 0,
            conforme: 0,
            rejete: 0,
          });
        }
      }
      return existing;
    });
  }

  // Planning vs actual comparison
  const planningComparison = useMemo(() => {
    const planByProduct = new Map<string, { productName: string; planned: number; unit: Unit; line: string }>();
    for (const r of planningRows) {
      if (!r.productId || r.plannedQty <= 0) continue;
      const product = getProductById(r.productId);
      const existing = planByProduct.get(r.productId);
      if (existing) {
        // Avoid double-counting: take max planned across rows for same product
        existing.planned = Math.max(existing.planned, r.plannedQty);
        if (!existing.line && r.line) existing.line = r.line;
      } else {
        planByProduct.set(r.productId, {
          productName: product?.name ?? r.productId,
          planned: r.plannedQty,
          unit: r.unit,
          line: r.line || "",
        });
      }
    }
    // Sum actual produced per product across both shifts
    const actualByProduct = new Map<string, number>();
    for (const r of [...rowsA, ...rowsB]) {
      if (!r.productId) continue;
      actualByProduct.set(r.productId, (actualByProduct.get(r.productId) ?? 0) + r.produced);
    }
    const rows = Array.from(planByProduct.entries()).map(([pid, p]) => {
      const actual = actualByProduct.get(pid) ?? 0;
      const ecart = actual - p.planned;
      const rate = p.planned > 0 ? (actual / p.planned) * 100 : null;
      return { productId: pid, productName: p.productName, planned: p.planned, actual, ecart, rate, unit: p.unit, line: p.line };
    });
    const totalPlanned = rows.reduce((s, r) => s + r.planned, 0);
    const totalActual = rows.reduce((s, r) => s + r.actual, 0);
    const overallRate = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : null;
    return { rows, totalPlanned, totalActual, overallRate };
  }, [planningRows, rowsA, rowsB]);

  // Pertes, arrêts, incidents
  const [losses, setLosses] = useState<LossRow[]>([makeLoss()]);
  const [stops, setStops] = useState<StopRow[]>([makeStop()]);
  const [incidents, setIncidents] = useState<IncidentRow[]>([makeIncident()]);

  // Informations complémentaires pour le rapport imprimable
  const [operator, setOperator] = useState("");
  const [reportStatus, setReportStatus] = useState<"en attente" | "validé" | "rejeté">("en attente");
  const [observations, setObservations] = useState("");

  // Aperçu / impression
  const [printData, setPrintData] = useState<PrintableReportData | null>(null);

  // Date is auto-filled with today's date (JJ/MM/AAAA).
  const dateDisplay = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
  const generalValid = Boolean(today);

  function rowsFor(key: ShiftKey): ProductionRow[] {
    return key === "A" ? rowsA : rowsB;
  }
  function setRowsFor(key: ShiftKey, updater: (prev: ProductionRow[]) => ProductionRow[]) {
    if (key === "A") setRowsA(updater);
    else setRowsB(updater);
  }
  function durationFor(key: ShiftKey): number {
    return key === "A" ? durationA : durationB;
  }
  function setDurationFor(key: ShiftKey, v: number) {
    if (key === "A") setDurationA(v);
    else setDurationB(v);
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

  function updateLoss(id: string, patch: Partial<LossRow>) {
    setLosses((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }
  function changeLossLine(id: string, line: ProductionLine) {
    const row = losses.find((l) => l.id === id);
    if (!row) return;
    if (row.productId && !isCompatible(row.productId, line)) {
      updateLoss(id, { line, productId: "" });
    } else {
      updateLoss(id, { line });
    }
  }
  function addLoss() {
    setLosses((p) => [...p, makeLoss()]);
  }
  function removeLoss(id: string) {
    setLosses((p) => (p.length > 1 ? p.filter((l) => l.id !== id) : p));
  }

  function updateStop(id: string, patch: Partial<StopRow>) {
    setStops((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }
  function addStop() {
    setStops((p) => [...p, makeStop()]);
  }
  function removeStop(id: string) {
    setStops((p) => (p.length > 1 ? p.filter((s) => s.id !== id) : p));
  }

  function updateIncident(id: string, patch: Partial<IncidentRow>) {
    setIncidents((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }
  function changeIncidentLine(id: string, line: ProductionLine) {
    const row = incidents.find((i) => i.id === id);
    if (!row) return;
    if (row.productId && !isCompatible(row.productId, line)) {
      updateIncident(id, { line, productId: "" });
    } else {
      updateIncident(id, { line });
    }
  }
  function addIncident() {
    setIncidents((p) => [...p, makeIncident()]);
  }
  function removeIncident(id: string) {
    setIncidents((p) => (p.length > 1 ? p.filter((i) => i.id !== id) : p));
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

  const lossSummary = useMemo(() => {
    const byUnit = {} as Record<Unit, number>;
    let total = 0;
    for (const l of losses) {
      const product = l.productId ? getProductById(l.productId) : undefined;
      if (!product || l.quantity <= 0) continue;
      byUnit[product.unit] = (byUnit[product.unit] ?? 0) + l.quantity;
      total += l.quantity;
    }
    return { byUnit, total };
  }, [losses]);

  const totalStopMinutes = useMemo(() => {
    const intervals: [number, number][] = [];
    for (const s of stops) {
      if (!s.startTime || !s.endTime) continue;
      const dur = stopDurationMinutes(s.startTime, s.endTime);
      if (dur <= 0) continue;
      const [h1, m1] = s.startTime.split(":").map(Number);
      const start = h1 * 60 + m1;
      intervals.push([start, start + dur]);
    }
    return mergeIntervals(intervals);
  }, [stops]);

  const incidentSummary = useMemo(() => {
    const critical = incidents.filter((i) => i.severity === "critique").length;
    const open = incidents.filter((i) => i.status === "ouvert").length;
    return { count: incidents.length, critical, open };
  }, [incidents]);

  const buildPrintData = useCallback((): PrintableReportData => {
    const reportId = `RPT-${today}`;
    const shiftData = SHIFT_TABLES.map((t) => {
      const duration = durationFor(t.key);
      const rows = rowsFor(t.key)
        .filter((r) => r.productId)
        .map((r) => {
          const product = getProductById(r.productId);
          const capacity = computeCapacity(r.productId, r.line, duration);
          return {
            line: r.line,
            productId: r.productId,
            productName: product?.name ?? r.productId,
            unit: r.unit,
            capacity,
            target: r.target,
            produced: r.produced,
            conforme: r.conforme,
            rejete: r.rejete,
          };
        });
      return { key: t.key, label: t.label, start: t.start, end: t.end, rows };
    });

    const printLosses = losses
      .filter((l) => l.productId)
      .map((l) => {
        const product = getProductById(l.productId);
        return {
          shift: l.shift,
          line: l.line,
          productName: product?.name ?? l.productId,
          unit: product?.unit ?? ("unité" as Unit),
          quantity: l.quantity,
          cause: l.cause,
          comment: l.comment,
        };
      });

    const printStops = stops
      .filter((s) => s.startTime && s.endTime)
      .map((s) => ({
        shift: s.shift,
        equipment: s.equipment,
        motif: s.motif,
        startTime: s.startTime,
        endTime: s.endTime,
        durationMinutes: stopDurationMinutes(s.startTime, s.endTime),
        description: s.description,
        intervention: s.intervention,
        status: s.status,
      }));

    const printIncidents = incidents.map((i) => {
      const product = i.productId ? getProductById(i.productId) : undefined;
      return {
        shift: i.shift,
        line: i.line,
        productName: product?.name ?? i.productId ?? "—",
        unit: product?.unit ?? ("unité" as Unit),
        type: i.type,
        description: i.description,
        severity: i.severity,
        quantity: i.quantity,
        responsible: i.responsible,
        action: i.action,
        status: i.status,
      };
    });

    return {
      reportId,
      date: today,
      dateDisplay,
      status: reportStatus,
      operator,
      observations,
      shifts: shiftData,
      losses: printLosses,
      stops: printStops,
      incidents: printIncidents,
    };
  }, [rowsA, rowsB, losses, stops, incidents, operator, reportStatus, observations, today, dateDisplay, durationA, durationB]);

  function openPrintPreview() {
    setPrintData(buildPrintData());
  }

  return (
    <div className="space-y-6">
      {/* Page intro */}
      <div className="flex flex-col gap-1 animate-fade-in">
        <h1 className="text-xl font-bold text-foreground">Nouvelle saisie de rapport</h1>
        <p className="text-sm text-muted-foreground">
          Étape 1 — Informations générales, saisie de la production, pertes, arrêts et incidents qualité. La sauvegarde définitive sera disponible à l&apos;étape suivante.
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section: Planification de production — Objectifs Direction Générale */}
      <Card className="animate-fade-in border-secondary/30">
        <CardHeader>
          <div className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-secondary" /> Planification de production — Objectifs communiqués par la Direction Générale
              </CardTitle>
              <CardDescription>
                Saisissez le planning journalier communiqué par la DG.
              </CardDescription>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              {planningSaved ? (
                <Badge variant="success"><CheckCircle2 className="h-3 w-3" /> Planning enregistré</Badge>
              ) : (
                <Badge variant="warning">Non enregistré</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {planningEditLocked && planningSaved ? (
            <div className="px-5">
              <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">
                    Planning enregistré le {new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date())}
                  </p>
                  <Button variant="outline" size="sm" onClick={editPlanning}>
                    <Pencil className="h-3.5 w-3.5" /> Modifier
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[480px]">
                    <thead>
                      <tr className="border-b border-border text-left text-xs text-muted-foreground">
                        <th className="px-3 py-2 font-medium">Produit</th>
                        <th className="px-3 py-2 text-right font-medium w-[120px]">Qté planifiée</th>
                        <th className="px-3 py-2 font-medium">Observations</th>
                      </tr>
                    </thead>
                    <tbody>
                      {planningRows.filter((r) => r.productId).map((r) => {
                        const product = getProductById(r.productId);
                        return (
                          <tr key={r.id} className="border-b border-border/50">
                            <td className="px-3 py-2 font-medium">{product?.name ?? r.productId}</td>
                            <td className="px-3 py-2 text-right font-semibold">{formatNumber(r.plannedQty, 1)}</td>
                            <td className="px-3 py-2 text-muted-foreground">{r.observations || "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="px-3 py-3 font-medium min-w-[220px]">Produit</th>
                      <th className="px-3 py-3 text-right font-medium w-[120px]">Qté planifiée</th>
                      <th className="px-3 py-3 font-medium min-w-[180px]">Observations</th>
                      <th className="px-3 py-3 font-medium w-[44px]" />
                    </tr>
                  </thead>
                  <tbody>
                    {planningRows.map((r) => {
                      const product = r.productId ? getProductById(r.productId) : undefined;
                      const availableProducts = r.line ? productsForLine(r.line) : PRODUCT_REFERENTIAL;
                      return (
                        <tr key={r.id} className="border-b border-border/50 align-middle hover:bg-muted/40">
                          <td className="px-3 py-2">
                            <select
                              value={r.productId}
                              onChange={(e) => changePlanningProduct(r.id, e.target.value)}
                              className={cn(selCls)}
                            >
                              <option value="">Sélectionner un produit</option>
                              {availableProducts.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                            {product && (
                              <span className="mt-1 block text-[10px] text-muted-foreground">
                                Lignes autorisées : {product.allowedLines.join(", ")}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min={0}
                              step="any"
                              value={r.plannedQty === 0 ? "" : r.plannedQty}
                              placeholder="0"
                              onChange={(e) => updatePlanningRow(r.id, { plannedQty: clampNonNeg(e.target.value) })}
                              className="h-9 w-full rounded-lg border border-border bg-card px-2 text-right text-sm text-foreground transition-colors focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={r.observations}
                              onChange={(e) => updatePlanningRow(r.id, { observations: e.target.value })}
                              placeholder="Facultatif…"
                              className={inpCls}
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              onClick={() => removePlanningRow(r.id)}
                              disabled={planningRows.length === 1}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-error/10 hover:text-error disabled:opacity-30"
                              aria-label="Supprimer la ligne"
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
              <div className="flex flex-col gap-3 px-5 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <Button variant="secondary" size="sm" onClick={addPlanningRow}>
                  <Plus className="h-4 w-4" /> Ajouter un produit
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={savePlanning}
                  disabled={planningRows.filter((r) => r.productId && r.plannedQty > 0).length === 0}
                >
                  <Save className="h-4 w-4" /> Enregistrer le planning
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Production entries — two independent shift tables */}
      {SHIFT_TABLES.map((table) => {
        const key = table.key;
        const rows = rowsFor(key);
        const sum = key === "A" ? summaryA : summaryB;
        const validCount = key === "A" ? validA : validB;
        const duration = durationFor(key);
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
                    {table.start} – {table.end} · Sélectionnez une ligne puis un produit compatible. La capacité est calculée automatiquement selon la cadence et la durée productive.
                  </CardDescription>
                </div>
                <div className="hidden items-center gap-2 sm:flex">
                  <Badge variant="default">{validCount} séquence{validCount > 1 ? "s" : ""}</Badge>
                  <Badge variant="neutral">{sum.linesUsed} ligne{sum.linesUsed > 1 ? "s" : ""}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-0">
              {/* Durée productive du shift */}
              <div className="flex items-center gap-3 px-5 pb-3">
                <label htmlFor={`duration-${key}`} className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                  Durée productive du shift :
                </label>
                <input
                  type="number"
                  id={`duration-${key}`}
                  min={0}
                  step="0.25"
                  value={duration}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setDurationFor(key, (!isFinite(v) || v < 0) ? 0 : v);
                  }}
                  className="h-8 w-20 rounded-lg border border-border bg-card px-2 text-right text-sm text-foreground transition-colors focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <span className="text-xs text-muted-foreground">heures (défaut {DEFAULT_SHIFT_DURATION_HOURS} h)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[1040px]">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="px-3 py-3 font-medium w-[90px]">Ligne</th>
                      <th className="px-3 py-3 font-medium min-w-[200px]">Produit</th>
                      <th className="px-3 py-3 text-right font-medium w-[110px]">Capacité</th>
                      <th className="px-3 py-3 text-right font-medium w-[100px]">Qté cible</th>
                      <th className="px-3 py-3 text-right font-medium w-[100px]">Qté réalisée</th>
                      <th className="px-3 py-3 text-right font-medium w-[100px]">Conforme</th>
                      <th className="px-3 py-3 text-right font-medium w-[100px]">Rejetée</th>
                      <th className="px-3 py-3 text-right font-medium w-[110px]">Écart</th>
                      <th className="px-3 py-3 font-medium w-[80px]">Taux</th>
                      <th className="px-3 py-3 font-medium w-[90px]">Utilis.</th>
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
                      const capacity = computeCapacity(r.productId, r.line, duration);
                      const util = utilizationRate(r.produced, capacity);
                      const utilColor = util === null ? "#64748b" : util >= 90 ? "#16a34a" : util >= 70 ? "#f97316" : "#dc2626";
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
                          <td className="px-3 py-2 text-right whitespace-nowrap">
                            {capacity !== null ? (
                              <span className="font-medium text-foreground">{formatNumber(capacity, 0)}</span>
                            ) : r.productId && r.line ? (
                              <span className="text-xs italic text-muted-foreground" title="Aucune cadence définie pour ce produit/ligne">Non définie</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                            {capacity !== null && (
                              <span className="ml-1 text-[10px] text-muted-foreground">{UNIT_LABELS[r.unit]}</span>
                            )}
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
                          <td className="px-3 py-2">
                            <span
                              className="inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold"
                              style={{ backgroundColor: `${utilColor}15`, color: utilColor }}
                            >
                              {util !== null ? `${util.toFixed(1)}%` : "—"}
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

      {/* Section: Pertes de production */}
      <Card className="animate-fade-in">
        <CardHeader>
          <div className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-error" /> Pertes de production
              </CardTitle>
              <CardDescription>Saisissez les pertes par produit. L&apos;unité est déduite automatiquement du produit sélectionné.</CardDescription>
            </div>
            <Badge variant="error">{losses.filter((l) => l.productId && l.quantity > 0).length} perte(s)</Badge>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[960px]">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-3 py-3 font-medium w-[80px]">Shift</th>
                  <th className="px-3 py-3 font-medium w-[90px]">Ligne</th>
                  <th className="px-3 py-3 font-medium min-w-[200px]">Produit</th>
                  <th className="px-3 py-3 text-right font-medium w-[110px]">Qté perdue</th>
                  <th className="px-3 py-3 font-medium w-[70px]">Unité</th>
                  <th className="px-3 py-3 font-medium min-w-[160px]">Cause</th>
                  <th className="px-3 py-3 font-medium min-w-[180px]">Commentaire</th>
                  <th className="px-3 py-3 font-medium w-[44px]" />
                </tr>
              </thead>
              <tbody>
                {losses.map((l) => {
                  const product = l.productId ? getProductById(l.productId) : undefined;
                  const availableProducts = l.line ? productsForLine(l.line) : [];
                  return (
                    <tr key={l.id} className="border-b border-border/50 align-middle hover:bg-muted/40">
                      <td className="px-3 py-2">
                        <select value={l.shift} onChange={(e) => updateLoss(l.id, { shift: e.target.value as ShiftKey })} className={selCls}>
                          {SHIFT_TABLES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select value={l.line} onChange={(e) => changeLossLine(l.id, e.target.value as ProductionLine)} className={selCls}>
                          <option value="">—</option>
                          {PRODUCTION_LINES.map((pl) => <option key={pl} value={pl}>{pl}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={l.productId}
                          disabled={!l.line}
                          onChange={(e) => updateLoss(l.id, { productId: e.target.value })}
                          className={cn(selCls, !l.line && "cursor-not-allowed opacity-50")}
                        >
                          <option value="">{l.line ? "Sélectionner" : "Choisir une ligne"}</option>
                          {availableProducts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <NumInput value={l.quantity} onChange={(v) => updateLoss(l.id, { quantity: v })} />
                      </td>
                      <td className="px-3 py-2">
                        <span className="inline-flex rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                          {product ? UNIT_LABELS[product.unit] : "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <select value={l.cause} onChange={(e) => updateLoss(l.id, { cause: e.target.value })} className={selCls}>
                          {LOSS_CAUSES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input type="text" value={l.comment} onChange={(e) => updateLoss(l.id, { comment: e.target.value })} placeholder="Précisions…" className={inpCls} />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => removeLoss(l.id)}
                          disabled={losses.length === 1}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-error/10 hover:text-error disabled:opacity-30"
                          aria-label="Supprimer la ligne"
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
            <Button variant="secondary" size="sm" onClick={addLoss}>
              <Plus className="h-4 w-4" /> Ajouter une perte
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Section: Arrêts de production */}
      <Card className="animate-fade-in">
        <CardHeader>
          <div className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-warning" /> Arrêts de production
              </CardTitle>
              <CardDescription>Début et fin des arrêts. La durée est calculée automatiquement (gestion des arrêts traversant minuit). Les chevauchements ne sont comptés qu&apos;une fois dans le total.</CardDescription>
            </div>
            <Badge variant="warning">{stops.filter((s) => s.startTime && s.endTime).length} arrêt(s)</Badge>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1180px]">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-3 py-3 font-medium w-[80px]">Shift</th>
                  <th className="px-3 py-3 font-medium min-w-[120px]">Ligne / équipement</th>
                  <th className="px-3 py-3 font-medium min-w-[160px]">Motif</th>
                  <th className="px-3 py-3 font-medium w-[80px]">Début</th>
                  <th className="px-3 py-3 font-medium w-[80px]">Fin</th>
                  <th className="px-3 py-3 text-right font-medium w-[80px]">Durée (min)</th>
                  <th className="px-3 py-3 font-medium min-w-[160px]">Description</th>
                  <th className="px-3 py-3 font-medium min-w-[160px]">Intervention</th>
                  <th className="px-3 py-3 font-medium w-[110px]">Statut</th>
                  <th className="px-3 py-3 font-medium w-[44px]" />
                </tr>
              </thead>
              <tbody>
                {stops.map((s) => {
                  const dur = stopDurationMinutes(s.startTime, s.endTime);
                  const ss = stopStatusStyle(s.status);
                  return (
                    <tr key={s.id} className="border-b border-border/50 align-middle hover:bg-muted/40">
                      <td className="px-3 py-2">
                        <select value={s.shift} onChange={(e) => updateStop(s.id, { shift: e.target.value as ShiftKey })} className={selCls}>
                          {SHIFT_TABLES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input type="text" value={s.equipment} onChange={(e) => updateStop(s.id, { equipment: e.target.value })} placeholder="L1…L9 ou équipement" className={inpCls} />
                      </td>
                      <td className="px-3 py-2">
                        <select value={s.motif} onChange={(e) => updateStop(s.id, { motif: e.target.value })} className={selCls}>
                          {STOP_MOTIFS.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input type="time" value={s.startTime} onChange={(e) => updateStop(s.id, { startTime: e.target.value })} className={cn(inpCls, "px-2")} />
                      </td>
                      <td className="px-3 py-2">
                        <input type="time" value={s.endTime} onChange={(e) => updateStop(s.id, { endTime: e.target.value })} className={cn(inpCls, "px-2")} />
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-foreground whitespace-nowrap">
                        {s.startTime && s.endTime ? `${dur} min` : "—"}
                      </td>
                      <td className="px-3 py-2">
                        <input type="text" value={s.description} onChange={(e) => updateStop(s.id, { description: e.target.value })} placeholder="Description…" className={inpCls} />
                      </td>
                      <td className="px-3 py-2">
                        <input type="text" value={s.intervention} onChange={(e) => updateStop(s.id, { intervention: e.target.value })} placeholder="Intervention réalisée…" className={inpCls} />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: ss.color }} />
                          <select value={s.status} onChange={(e) => updateStop(s.id, { status: e.target.value as StopStatus })} className={cn(selCls, "flex-1")}>
                            {STOP_STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
                          </select>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => removeStop(s.id)}
                          disabled={stops.length === 1}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-error/10 hover:text-error disabled:opacity-30"
                          aria-label="Supprimer la ligne"
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
            <Button variant="secondary" size="sm" onClick={addStop}>
              <Plus className="h-4 w-4" /> Ajouter un arrêt
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Section: Incidents qualité */}
      <Card className="animate-fade-in">
        <CardHeader>
          <div className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-error" /> Incidents qualité
              </CardTitle>
              <CardDescription>Signalement des incidents qualité, gravité, action corrective et responsable de suivi.</CardDescription>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <Badge variant="error">{incidentSummary.critical} critique(s)</Badge>
              <Badge variant="neutral">{incidentSummary.count} incident(s)</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1280px]">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-3 py-3 font-medium w-[80px]">Shift</th>
                  <th className="px-3 py-3 font-medium w-[90px]">Ligne</th>
                  <th className="px-3 py-3 font-medium min-w-[180px]">Produit</th>
                  <th className="px-3 py-3 font-medium min-w-[140px]">Type</th>
                  <th className="px-3 py-3 font-medium w-[110px]">Gravité</th>
                  <th className="px-3 py-3 font-medium min-w-[160px]">Description</th>
                  <th className="px-3 py-3 text-right font-medium w-[90px]">Qté concernée</th>
                  <th className="px-3 py-3 font-medium w-[60px]">Unité</th>
                  <th className="px-3 py-3 font-medium min-w-[160px]">Action corrective</th>
                  <th className="px-3 py-3 font-medium min-w-[130px]">Responsable</th>
                  <th className="px-3 py-3 font-medium w-[90px]">Statut</th>
                  <th className="px-3 py-3 font-medium w-[44px]" />
                </tr>
              </thead>
              <tbody>
                {incidents.map((i) => {
                  const product = i.productId ? getProductById(i.productId) : undefined;
                  const availableProducts = i.line ? productsForLine(i.line) : [];
                  const sev = severityStyle(i.severity);
                  return (
                    <tr key={i.id} className="border-b border-border/50 align-middle hover:bg-muted/40">
                      <td className="px-3 py-2">
                        <select value={i.shift} onChange={(e) => updateIncident(i.id, { shift: e.target.value as ShiftKey })} className={selCls}>
                          {SHIFT_TABLES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select value={i.line} onChange={(e) => changeIncidentLine(i.id, e.target.value as ProductionLine)} className={selCls}>
                          <option value="">—</option>
                          {PRODUCTION_LINES.map((pl) => <option key={pl} value={pl}>{pl}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={i.productId}
                          disabled={!i.line}
                          onChange={(e) => updateIncident(i.id, { productId: e.target.value })}
                          className={cn(selCls, !i.line && "cursor-not-allowed opacity-50")}
                        >
                          <option value="">{i.line ? "Sélectionner" : "Choisir une ligne"}</option>
                          {availableProducts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select value={i.type} onChange={(e) => updateIncident(i.id, { type: e.target.value })} className={selCls}>
                          {INCIDENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: sev.color }} />
                          <select value={i.severity} onChange={(e) => updateIncident(i.id, { severity: e.target.value as Severity })} className={cn(selCls, "flex-1")}>
                            {SEVERITIES.map((sv) => <option key={sv} value={sv}>{sv}</option>)}
                          </select>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <input type="text" value={i.description} onChange={(e) => updateIncident(i.id, { description: e.target.value })} placeholder="Description…" className={inpCls} />
                      </td>
                      <td className="px-3 py-2">
                        <NumInput value={i.quantity} onChange={(v) => updateIncident(i.id, { quantity: v })} />
                      </td>
                      <td className="px-3 py-2">
                        <span className="inline-flex rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                          {product ? UNIT_LABELS[product.unit] : "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <input type="text" value={i.action} onChange={(e) => updateIncident(i.id, { action: e.target.value })} placeholder="Action corrective…" className={inpCls} />
                      </td>
                      <td className="px-3 py-2">
                        <input type="text" value={i.responsible} onChange={(e) => updateIncident(i.id, { responsible: e.target.value })} placeholder="Nom…" className={inpCls} />
                      </td>
                      <td className="px-3 py-2">
                        <select value={i.status} onChange={(e) => updateIncident(i.id, { status: e.target.value as IncidentStatus })} className={selCls}>
                          {INCIDENT_STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => removeIncident(i.id)}
                          disabled={incidents.length === 1}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-error/10 hover:text-error disabled:opacity-30"
                          aria-label="Supprimer la ligne"
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
            <Button variant="secondary" size="sm" onClick={addIncident}>
              <Plus className="h-4 w-4" /> Ajouter un incident
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Section: Synthèse Planning DG vs Production réelle */}
      {planningComparison.rows.length > 0 && (
        <Card className="animate-fade-in border-secondary/30 bg-gradient-to-r from-secondary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-secondary" /> Synthèse — Planning Direction Générale vs Production réelle
            </CardTitle>
            <CardDescription>
              Comparaison automatique entre les objectifs planifiés par la DG et les quantités réellement produites (Shift A + Shift B). L&apos;objectif planifié n&apos;est compté qu&apos;une fois par produit, même s&apos;il est fabriqué sur les deux shifts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-5">
              <SummaryStat
                icon={Target}
                color="#0891b2"
                label="Total planifié (DG)"
                value={formatNumber(planningComparison.totalPlanned, 1)}
              />
              <SummaryStat
                icon={Package}
                color="#2563eb"
                label="Total réalisé"
                value={formatNumber(planningComparison.totalActual, 1)}
              />
              <SummaryStat
                icon={Percent}
                color={rateColor(planningComparison.overallRate)}
                label="Taux de réalisation global"
                value={planningComparison.overallRate !== null ? `${planningComparison.overallRate.toFixed(1)} %` : "—"}
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-3 py-2 font-medium min-w-[200px]">Produit</th>
                    <th className="px-3 py-2 font-medium w-[80px]">Ligne</th>
                    <th className="px-3 py-2 text-right font-medium w-[110px]">Planifié (DG)</th>
                    <th className="px-3 py-2 text-right font-medium w-[110px]">Réalisé</th>
                    <th className="px-3 py-2 text-right font-medium w-[110px]">Écart</th>
                    <th className="px-3 py-2 font-medium w-[80px]">Taux</th>
                  </tr>
                </thead>
                <tbody>
                  {planningComparison.rows.map((r) => {
                    const rate = r.rate;
                    const rColor = rateColor(rate);
                    const ecartColor = r.ecart >= 0 ? "text-accent" : "text-error";
                    return (
                      <tr key={r.productId} className="border-b border-border/50">
                        <td className="px-3 py-2 font-medium">{r.productName}</td>
                        <td className="px-3 py-2 text-muted-foreground">{r.line || "—"}</td>
                        <td className="px-3 py-2 text-right">{formatNumber(r.planned, 1)} <span className="text-muted-foreground font-normal">{UNIT_LABELS[r.unit]}</span></td>
                        <td className="px-3 py-2 text-right">{formatNumber(r.actual, 1)} <span className="text-muted-foreground font-normal">{UNIT_LABELS[r.unit]}</span></td>
                        <td className={cn("px-3 py-2 text-right font-medium", ecartColor)}>
                          {r.ecart >= 0 ? "+" : ""}{formatNumber(r.ecart, 1)} <span className="text-muted-foreground font-normal">{UNIT_LABELS[r.unit]}</span>
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className="inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold"
                            style={{ backgroundColor: `${rColor}15`, color: rColor }}
                          >
                            {rate !== null ? `${rate.toFixed(1)}%` : "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section: Résumé global */}
      <Card className="animate-fade-in border-secondary/30 bg-gradient-to-r from-secondary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-secondary" /> Résumé global
          </CardTitle>
          <CardDescription>Synthèse des pertes, arrêts et incidents qualité saisis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryStat
              icon={TrendingDown}
              color="#dc2626"
              label="Pertes totales"
              value={lossSummary.total > 0 ? formatNumber(lossSummary.total, 1) : "0"}
            />
            <SummaryStat
              icon={Clock}
              color="#f97316"
              label="Temps d&apos;arrêt total"
              value={totalStopMinutes > 0 ? `${(totalStopMinutes / 60).toFixed(2)} h` : "0 h"}
            />
            <SummaryStat
              icon={AlertTriangle}
              color="#dc2626"
              label="Nombre d&apos;incidents"
              value={String(incidentSummary.count)}
            />
            <SummaryStat
              icon={AlertTriangle}
              color="#dc2626"
              label="Incidents critiques"
              value={String(incidentSummary.critical)}
            />
          </div>

          <div className="mt-5">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Détail des pertes par unité</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(lossSummary.byUnit).length === 0 ? (
                <span className="text-sm text-muted-foreground">Aucune perte saisie.</span>
              ) : (
                Object.entries(lossSummary.byUnit).map(([unit, val]) => (
                  <span key={unit} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm">
                    <span className="font-medium text-foreground">{formatNumber(val, 1)}</span>
                    <span className="text-muted-foreground">{UNIT_LABELS[unit as Unit]}</span>
                  </span>
                ))
              )}
            </div>
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
          variant="outline"
          size="lg"
          disabled={!generalValid || validSequences === 0}
          onClick={openPrintPreview}
        >
          <Eye className="h-4 w-4" /> Aperçu / Imprimer PDF
        </Button>
        <Button
          variant="secondary"
          size="lg"
          disabled={!generalValid || validSequences === 0}
          onClick={() => setSaved(true)}
        >
          <Save className="h-4 w-4" /> Enregistrer l&apos;étape 1
        </Button>
      </div>

      {/* Modal d'aperçu / impression */}
      <PrintPreviewModal data={printData} onClose={() => setPrintData(null)} />
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
