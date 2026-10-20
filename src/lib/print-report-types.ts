import type { Unit } from "./types";
import type { ProductionLine } from "./production-referential";

export type ShiftKey = "A" | "B";

export interface PrintProductionRow {
  line: ProductionLine | "";
  productId: string;
  productName: string;
  unit: Unit;
  target: number;
  produced: number;
  conforme: number;
  rejete: number;
}

export interface PrintLossRow {
  shift: ShiftKey;
  line: ProductionLine | "";
  productName: string;
  unit: Unit;
  quantity: number;
  cause: string;
  comment: string;
}

export interface PrintStopRow {
  shift: ShiftKey;
  equipment: string;
  motif: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  description: string;
  intervention: string;
  status: string;
}

export interface PrintIncidentRow {
  shift: ShiftKey;
  line: ProductionLine | "";
  productName: string;
  unit: Unit;
  type: string;
  description: string;
  severity: string;
  quantity: number;
  responsible: string;
  action: string;
  status: string;
}

export interface PrintableReportData {
  reportId: string;
  date: string;
  dateDisplay: string;
  status: string;
  operator: string;
  observations: string;
  shifts: {
    key: ShiftKey;
    label: string;
    start: string;
    end: string;
    rows: PrintProductionRow[];
  }[];
  losses: PrintLossRow[];
  stops: PrintStopRow[];
  incidents: PrintIncidentRow[];
}
