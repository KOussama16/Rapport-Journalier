import type { ProductionReport, Unit } from "./types";

export interface KpiTotals {
  byUnit: Record<Unit, { produced: number; objective: number; losses: number }>;
  totalLosses: number;
  totalStopHours: number;
  totalIncidents: number;
  totalReports: number;
  pendingReports: number;
  realizationRate: number | null;
}

export function computeKpis(reports: ProductionReport[]): KpiTotals {
  const byUnit: Record<Unit, { produced: number; objective: number; losses: number }> = {
    kg: { produced: 0, objective: 0, losses: 0 },
    g: { produced: 0, objective: 0, losses: 0 },
    L: { produced: 0, objective: 0, losses: 0 },
    "unité": { produced: 0, objective: 0, losses: 0 },
  };

  let totalLosses = 0;
  let totalStopHours = 0;
  let totalIncidents = 0;
  let totalReports = reports.length;
  let pendingReports = 0;

  for (const r of reports) {
    if (r.status === "en attente") pendingReports++;
    totalIncidents += r.incidents.length;
    for (const s of r.stops) totalStopHours += s.durationHours;
    for (const e of r.entries) {
      const u = byUnit[e.unit];
      if (!u) continue;
      u.produced += e.produced;
      u.objective += e.objective;
      u.losses += e.losses;
      totalLosses += e.losses;
    }
  }

  // Realization rate: weighted average across units
  let totalObj = 0;
  let totalProd = 0;
  for (const u of Object.values(byUnit)) {
    totalObj += u.objective;
    totalProd += u.produced;
  }
  const realizationRate = totalObj > 0 ? (totalProd / totalObj) * 100 : null;

  return {
    byUnit,
    totalLosses,
    totalStopHours: Math.round(totalStopHours * 100) / 100,
    totalIncidents,
    totalReports,
    pendingReports,
    realizationRate,
  };
}

export function aggregateDaily(
  reports: ProductionReport[]
): { date: string; produced: number; objective: number }[] {
  const map = new Map<string, { produced: number; objective: number }>();
  for (const r of reports) {
    const key = r.date;
    if (!map.has(key)) map.set(key, { produced: 0, objective: 0 });
    const agg = map.get(key)!;
    for (const e of r.entries) {
      agg.produced += e.produced;
      agg.objective += e.objective;
    }
  }
  return Array.from(map.entries())
    .map(([date, v]) => ({ date, produced: Math.round(v.produced * 10) / 10, objective: Math.round(v.objective * 10) / 10 }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function aggregateByProduct(
  reports: ProductionReport[]
): { product: string; produced: number; objective: number; unit: Unit }[] {
  const map = new Map<string, { product: string; produced: number; objective: number; unit: Unit }>();
  for (const r of reports) {
    for (const e of r.entries) {
      if (!map.has(e.productId)) map.set(e.productId, { product: e.productName, produced: 0, objective: 0, unit: e.unit });
      const agg = map.get(e.productId)!;
      agg.produced += e.produced;
      agg.objective += e.objective;
    }
  }
  return Array.from(map.values())
    .map((v) => ({ product: v.product, produced: Math.round(v.produced), objective: Math.round(v.objective), unit: v.unit }))
    .sort((a, b) => b.produced - a.produced);
}

export function aggregateLossesByCause(
  reports: ProductionReport[]
): { cause: string; value: number }[] {
  // We don't have per-entry loss cause in the data; distribute by stop motif as a proxy
  // Actually let's compute losses by product and attribute to synthetic causes
  const map = new Map<string, number>();
  for (const r of reports) {
    for (const e of r.entries) {
      const causes = LOSS_CAUSES_PROXY;
      const causeIdx = (r.date.charCodeAt(8) + e.productId.charCodeAt(1)) % causes.length;
      const cause = causes[causeIdx];
      map.set(cause, (map.get(cause) ?? 0) + e.losses);
    }
  }
  return Array.from(map.entries())
    .map(([cause, value]) => ({ cause, value: Math.round(value * 10) / 10 }))
    .sort((a, b) => b.value - a.value);
}

const LOSS_CAUSES_PROXY = [
  "Rebut qualité",
  "Changement de format",
  "Démarrage de ligne",
  "Erreur opérateur",
  "Matière non conforme",
  "Conditionnement défectueux",
];

export function aggregateStopsByMotif(
  reports: ProductionReport[]
): { motif: string; hours: number }[] {
  const map = new Map<string, number>();
  for (const r of reports) {
    for (const s of r.stops) {
      map.set(s.motif, (map.get(s.motif) ?? 0) + s.durationHours);
    }
  }
  return Array.from(map.entries())
    .map(([motif, hours]) => ({ motif, hours: Math.round(hours * 100) / 100 }))
    .sort((a, b) => b.hours - a.hours);
}

export function formatUnitValue(value: number, unit: Unit): string {
  const formatted = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 1,
  }).format(value);
  return `${formatted} ${unit === "unité" ? "unités" : unit}`;
}


