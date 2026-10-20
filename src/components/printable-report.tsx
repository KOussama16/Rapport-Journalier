"use client";

import { useMemo } from "react";
import Image from "next/image";
import type { PrintableReportData } from "@/lib/print-report-types";
import type { Unit } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

const UNIT_LABELS: Record<Unit, string> = {
  kg: "kg",
  g: "g",
  L: "L",
  "unité": "unités",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  "validé": { label: "Validé", color: "#16a34a" },
  "en attente": { label: "En attente", color: "#f97316" },
  "rejeté": { label: "Rejeté", color: "#dc2626" },
};

function rateOf(target: number, produced: number): number | null {
  if (!target || target <= 0) return null;
  return (produced / target) * 100;
}

function rateBadge(rate: number | null): string {
  return rate !== null ? `${rate.toFixed(1)} %` : "—";
}

function rateColor(rate: number | null): string {
  if (rate === null) return "#64748b";
  if (rate >= 95) return "#16a34a";
  if (rate >= 80) return "#f97316";
  return "#dc2626";
}

function ecartColor(ecart: number): string {
  return ecart >= 0 ? "#16a34a" : "#dc2626";
}

interface SectionTitleProps {
  children: React.ReactNode;
  index?: string;
}

function SectionTitle({ children, index }: SectionTitleProps) {
  return (
    <h2 className="print-section-title">
      {index && <span className="print-section-index">{index}</span>}
      {children}
    </h2>
  );
}

interface ShiftSummary {
  byUnit: Record<Unit, { target: number; produced: number; conforme: number; rejete: number; rows: number }>;
  sequences: number;
  linesUsed: number;
}

function summarizeRows(rows: { productId: string; line: string; unit: Unit; target: number; produced: number; conforme: number; rejete: number }[]): ShiftSummary {
  const byUnit = {} as Record<Unit, { target: number; produced: number; conforme: number; rejete: number; rows: number }>;
  const lines = new Set<string>();
  let sequences = 0;
  for (const r of rows) {
    if (!r.productId) continue;
    sequences += 1;
    if (r.line) lines.add(r.line);
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

interface PrintableReportProps {
  data: PrintableReportData;
}

export function PrintableReport({ data }: PrintableReportProps) {
  const statusCfg = STATUS_LABELS[data.status] ?? STATUS_LABELS["en attente"];

  const allRows = useMemo(() => data.shifts.flatMap((s) => s.rows), [data.shifts]);
  const totalSummary = useMemo(() => summarizeRows(allRows), [allRows]);

  const overallRate = useMemo(() => {
    let t = 0;
    let p = 0;
    for (const u of Object.values(totalSummary.byUnit)) {
      t += u.target;
      p += u.produced;
    }
    return t > 0 ? (p / t) * 100 : null;
  }, [totalSummary]);

  const lossSummary = useMemo(() => {
    const byUnit = {} as Record<Unit, number>;
    let total = 0;
    for (const l of data.losses) {
      if (l.quantity <= 0) continue;
      byUnit[l.unit] = (byUnit[l.unit] ?? 0) + l.quantity;
      total += l.quantity;
    }
    return { byUnit, total };
  }, [data.losses]);

  const totalStopMinutes = useMemo(() => {
    return data.stops.reduce((sum, s) => sum + s.durationMinutes, 0);
  }, [data.stops]);

  const incidentSummary = useMemo(() => {
    const critical = data.incidents.filter((i) => i.severity === "critique").length;
    const open = data.incidents.filter((i) => i.status === "ouvert").length;
    return { count: data.incidents.length, critical, open };
  }, [data.incidents]);

  const generatedAt = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());

  return (
    <div id="print-report-root" className="print-report-root">
      {/* En-tête entreprise */}
      <header className="print-header">
        <div className="print-header-left">
          <div className="print-logo-wrap">
            <Image src="/images.jpg" alt="La Bergère SPA" fill sizes="120px" className="object-contain" />
          </div>
          <div>
            <h1 className="print-company-name">La Bergère SPA</h1>
            <p className="print-company-sub">Unité de production sauce</p>
          </div>
        </div>
        <div className="print-header-right">
          <h2 className="print-doc-title">Rapport de production</h2>
          <div className="print-meta-grid">
            <div className="print-meta-item">
              <span className="print-meta-label">N° rapport</span>
              <span className="print-meta-value">{data.reportId}</span>
            </div>
            <div className="print-meta-item">
              <span className="print-meta-label">Date</span>
              <span className="print-meta-value">{data.dateDisplay}</span>
            </div>
            <div className="print-meta-item">
              <span className="print-meta-label">Statut</span>
              <span className="print-meta-value" style={{ color: statusCfg.color, fontWeight: 700 }}>
                {statusCfg.label}
              </span>
            </div>
            <div className="print-meta-item">
              <span className="print-meta-label">Opérateur</span>
              <span className="print-meta-value">{data.operator || "—"}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Bandeau de synthèse */}
      <div className="print-synopsis">
        <div className="print-synopsis-item">
          <span className="print-synopsis-label">Taux de réalisation global</span>
          <span className="print-synopsis-value" style={{ color: rateColor(overallRate) }}>
            {overallRate !== null ? `${overallRate.toFixed(1)} %` : "—"}
          </span>
        </div>
        <div className="print-synopsis-item">
          <span className="print-synopsis-label">Séquences saisies</span>
          <span className="print-synopsis-value">{totalSummary.sequences}</span>
        </div>
        <div className="print-synopsis-item">
          <span className="print-synopsis-label">Lignes utilisées</span>
          <span className="print-synopsis-value">{totalSummary.linesUsed}</span>
        </div>
        <div className="print-synopsis-item">
          <span className="print-synopsis-label">Pertes totales</span>
          <span className="print-synopsis-value" style={{ color: "#dc2626" }}>
            {formatNumber(lossSummary.total, 1)}
          </span>
        </div>
        <div className="print-synopsis-item">
          <span className="print-synopsis-label">Temps d&apos;arrêt</span>
          <span className="print-synopsis-value" style={{ color: "#f97316" }}>
            {totalStopMinutes > 0 ? `${(totalStopMinutes / 60).toFixed(2)} h` : "0 h"}
          </span>
        </div>
        <div className="print-synopsis-item">
          <span className="print-synopsis-label">Incidents qualité</span>
          <span className="print-synopsis-value" style={{ color: incidentSummary.critical > 0 ? "#dc2626" : "#182433" }}>
            {incidentSummary.count}
            {incidentSummary.critical > 0 ? ` (${incidentSummary.critical} critique${incidentSummary.critical > 1 ? "s" : ""})` : ""}
          </span>
        </div>
      </div>

      {/* Synthèse par unité de mesure */}
      {Object.keys(totalSummary.byUnit).length > 0 && (
        <section className="print-section">
          <SectionTitle index="1">Synthèse par unité de mesure</SectionTitle>
          <table className="print-table">
            <thead>
              <tr>
                <th className="print-th-left">Unité</th>
                <th className="print-th-right">Séquences</th>
                <th className="print-th-right">Qté cible</th>
                <th className="print-th-right">Qté réalisée</th>
                <th className="print-th-right">Conforme</th>
                <th className="print-th-right">Rejetée</th>
                <th className="print-th-right">Écart</th>
                <th className="print-th-right">Taux</th>
              </tr>
            </thead>
            <tbody>
              {(Object.entries(totalSummary.byUnit) as [Unit, { target: number; produced: number; conforme: number; rejete: number; rows: number }][]).map(([unit, d]) => {
                const ecart = d.produced - d.target;
                const rate = rateOf(d.target, d.produced);
                return (
                  <tr key={unit}>
                    <td className="print-td-strong">{UNIT_LABELS[unit]}</td>
                    <td className="print-td-right">{d.rows}</td>
                    <td className="print-td-right">{formatNumber(d.target, 1)}</td>
                    <td className="print-td-right">{formatNumber(d.produced, 1)}</td>
                    <td className="print-td-right" style={{ color: "#16a34a" }}>{formatNumber(d.conforme, 1)}</td>
                    <td className="print-td-right" style={{ color: "#dc2626" }}>{formatNumber(d.rejete, 1)}</td>
                    <td className="print-td-right" style={{ color: ecartColor(ecart), fontWeight: 600 }}>
                      {ecart >= 0 ? "+" : ""}{formatNumber(ecart, 1)}
                    </td>
                    <td className="print-td-right" style={{ color: rateColor(rate), fontWeight: 700 }}>
                      {rateBadge(rate)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      {/* Détail par shift */}
      {data.shifts.map((shift, idx) => {
        const shiftSum = summarizeRows(shift.rows);
        const validRows = shift.rows.filter((r) => r.productId);
        if (validRows.length === 0) return null;
        const sectionIndex = String(idx + 2);
        return (
          <section className="print-section" key={shift.key}>
            <SectionTitle index={sectionIndex}>
              Production {shift.label} ({shift.start} – {shift.end})
            </SectionTitle>

            {/* Mini-synthèse shift */}
            <div className="print-shift-summary">
              <span><strong>{shiftSum.sequences}</strong> séquence{shiftSum.sequences > 1 ? "s" : ""}</span>
              <span className="print-shift-summary-sep">|</span>
              <span><strong>{shiftSum.linesUsed}</strong> ligne{shiftSum.linesUsed > 1 ? "s" : ""}</span>
              {Object.entries(shiftSum.byUnit).map(([unit, d]) => {
                const rate = rateOf(d.target, d.produced);
                return (
                  <span key={unit} className="print-shift-summary-unit">
                    {UNIT_LABELS[unit as Unit]} : {formatNumber(d.produced, 1)} / {formatNumber(d.target, 1)}
                    <span style={{ color: rateColor(rate), fontWeight: 700 }}> · {rateBadge(rate)}</span>
                  </span>
                );
              })}
            </div>

            <table className="print-table">
              <thead>
                <tr>
                  <th className="print-th-left" style={{ width: "8%" }}>Ligne</th>
                  <th className="print-th-left" style={{ width: "34%" }}>Produit</th>
                  <th className="print-th-right" style={{ width: "9%" }}>Cible</th>
                  <th className="print-th-right" style={{ width: "9%" }}>Réalisée</th>
                  <th className="print-th-right" style={{ width: "8%" }}>Conforme</th>
                  <th className="print-th-right" style={{ width: "8%" }}>Rejetée</th>
                  <th className="print-th-right" style={{ width: "9%" }}>Écart</th>
                  <th className="print-th-right" style={{ width: "8%" }}>Taux</th>
                </tr>
              </thead>
              <tbody>
                {validRows.map((r, i) => {
                  const ecart = r.produced - r.target;
                  const rate = rateOf(r.target, r.produced);
                  return (
                    <tr key={i}>
                      <td className="print-td-strong">{r.line || "—"}</td>
                      <td className="print-td-left">{r.productName}</td>
                      <td className="print-td-right">{formatNumber(r.target, 1)}</td>
                      <td className="print-td-right">{formatNumber(r.produced, 1)}</td>
                      <td className="print-td-right" style={{ color: "#16a34a" }}>{formatNumber(r.conforme, 1)}</td>
                      <td className="print-td-right" style={{ color: "#dc2626" }}>{formatNumber(r.rejete, 1)}</td>
                      <td className="print-td-right" style={{ color: ecartColor(ecart), fontWeight: 600 }}>
                        {ecart >= 0 ? "+" : ""}{formatNumber(ecart, 1)}
                      </td>
                      <td className="print-td-right" style={{ color: rateColor(rate), fontWeight: 700 }}>
                        {rateBadge(rate)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        );
      })}

      {/* Pertes de production */}
      {data.losses.filter((l) => l.productName && l.productName !== "—").length > 0 && (
        <section className="print-section">
          <SectionTitle index={String(data.shifts.filter((s) => s.rows.some((r) => r.productId)).length + 2)}>
            Pertes de production
          </SectionTitle>
          {Object.keys(lossSummary.byUnit).length > 0 && (
            <div className="print-loss-summary">
              {Object.entries(lossSummary.byUnit).map(([unit, val]) => (
                <span key={unit} className="print-loss-badge">
                  {formatNumber(val, 1)} {UNIT_LABELS[unit as Unit]}
                </span>
              ))}
            </div>
          )}
          <table className="print-table">
            <thead>
              <tr>
                <th className="print-th-left" style={{ width: "8%" }}>Shift</th>
                <th className="print-th-left" style={{ width: "8%" }}>Ligne</th>
                <th className="print-th-left" style={{ width: "34%" }}>Produit</th>
                <th className="print-th-right" style={{ width: "10%" }}>Qté perdue</th>
                <th className="print-th-left" style={{ width: "8%" }}>Unité</th>
                <th className="print-th-left" style={{ width: "16%" }}>Cause</th>
                <th className="print-th-left">Commentaire</th>
              </tr>
            </thead>
            <tbody>
              {data.losses.filter((l) => l.productName && l.productName !== "—").map((l, i) => (
                <tr key={i}>
                  <td className="print-td-strong">{l.shift}</td>
                  <td>{l.line || "—"}</td>
                  <td className="print-td-left">{l.productName}</td>
                  <td className="print-td-right" style={{ fontWeight: 600, color: "#dc2626" }}>{formatNumber(l.quantity, 1)}</td>
                  <td>{UNIT_LABELS[l.unit]}</td>
                  <td className="print-td-left">{l.cause}</td>
                  <td className="print-td-left print-td-muted">{l.comment || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Arrêts de production */}
      {data.stops.filter((s) => s.startTime && s.endTime).length > 0 && (
        <section className="print-section">
          <SectionTitle index={String(data.shifts.filter((s) => s.rows.some((r) => r.productId)).length + 3)}>
            Arrêts de production
          </SectionTitle>
          <table className="print-table">
            <thead>
              <tr>
                <th className="print-th-left" style={{ width: "8%" }}>Shift</th>
                <th className="print-th-left" style={{ width: "14%" }}>Équipement</th>
                <th className="print-th-left" style={{ width: "16%" }}>Motif</th>
                <th className="print-th-right" style={{ width: "8%" }}>Début</th>
                <th className="print-th-right" style={{ width: "8%" }}>Fin</th>
                <th className="print-th-right" style={{ width: "9%" }}>Durée</th>
                <th className="print-th-left">Description / Intervention</th>
                <th className="print-th-left" style={{ width: "8%" }}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {data.stops.filter((s) => s.startTime && s.endTime).map((s, i) => (
                <tr key={i}>
                  <td className="print-td-strong">{s.shift}</td>
                  <td>{s.equipment || "—"}</td>
                  <td className="print-td-left">{s.motif}</td>
                  <td className="print-td-right">{s.startTime}</td>
                  <td className="print-td-right">{s.endTime}</td>
                  <td className="print-td-right" style={{ fontWeight: 600 }}>{s.durationMinutes} min</td>
                  <td className="print-td-left print-td-muted">
                    {s.description || "—"}
                    {s.intervention && <><br /><em>Intervention : {s.intervention}</em></>}
                  </td>
                  <td className="print-td-strong">{s.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Incidents qualité */}
      {data.incidents.length > 0 && (
        <section className="print-section">
          <SectionTitle index={String(data.shifts.filter((s) => s.rows.some((r) => r.productId)).length + 4)}>
            Incidents qualité et actions correctives
          </SectionTitle>
          <table className="print-table">
            <thead>
              <tr>
                <th className="print-th-left" style={{ width: "8%" }}>Shift</th>
                <th className="print-th-left" style={{ width: "8%" }}>Ligne</th>
                <th className="print-th-left" style={{ width: "24%" }}>Produit</th>
                <th className="print-th-left" style={{ width: "10%" }}>Type</th>
                <th className="print-th-left" style={{ width: "9%" }}>Gravité</th>
                <th className="print-th-left">Description / Action corrective</th>
                <th className="print-th-left" style={{ width: "11%" }}>Responsable</th>
                <th className="print-th-left" style={{ width: "8%" }}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {data.incidents.map((inc, i) => {
                const sevColors: Record<string, string> = {
                  "faible": "#64748b",
                  "moyenne": "#f97316",
                  "élevée": "#ea580c",
                  "critique": "#dc2626",
                };
                return (
                  <tr key={i}>
                    <td className="print-td-strong">{inc.shift}</td>
                    <td>{inc.line || "—"}</td>
                    <td className="print-td-left">{inc.productName}</td>
                    <td className="print-td-left">{inc.type}</td>
                    <td className="print-td-strong" style={{ color: sevColors[inc.severity] ?? "#182433" }}>{inc.severity}</td>
                    <td className="print-td-left print-td-muted">
                      {inc.description || "—"}
                      {inc.action && <><br /><em>Action : {inc.action}</em></>}
                      {inc.quantity > 0 && <><br /><em>Qté concernée : {formatNumber(inc.quantity, 1)} {UNIT_LABELS[inc.unit]}</em></>}
                    </td>
                    <td>{inc.responsible || "—"}</td>
                    <td className="print-td-strong">{inc.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      {/* Observations */}
      {data.observations && (
        <section className="print-section">
          <SectionTitle index={String(data.shifts.filter((s) => s.rows.some((r) => r.productId)).length + 5)}>
            Observations
          </SectionTitle>
          <div className="print-observations">{data.observations}</div>
        </section>
      )}

      {/* Espaces de signature */}
      <section className="print-signatures">
        <div className="print-sign-block">
          <div className="print-sign-line" />
          <p className="print-sign-label">Opérateur — {data.operator || "—"}</p>
        </div>
        <div className="print-sign-block">
          <div className="print-sign-line" />
          <p className="print-sign-label">Responsable de production</p>
        </div>
        <div className="print-sign-block">
          <div className="print-sign-line" />
          <p className="print-sign-label">Contrôle qualité</p>
        </div>
      </section>

      {/* Pied de page */}
      <footer className="print-footer">
        <p>
          La Bergère SPA — Unité de production sauce · Rapport {data.reportId} du {data.dateDisplay}
        </p>
        <p className="print-footer-gen">Édité le {generatedAt}</p>
      </footer>
    </div>
  );
}
