export type Unit = "kg" | "g" | "L" | "unité";

export type Shift = "Matin" | "Après-midi" | "Nuit";

export type ReportStatus = "validé" | "en attente" | "rejeté";

export interface Product {
  id: string;
  name: string;
  unit: Unit;
  baseObjective: number;
}

export interface ProductionEntry {
  productId: string;
  productName: string;
  unit: Unit;
  objective: number;
  produced: number;
  losses: number;
}

export interface StopEntry {
  motif: string;
  durationHours: number;
}

export interface QualityIncident {
  type: string;
  description: string;
}

export interface ProductionReport {
  id: string;
  date: string;
  shift: Shift;
  operator: string;
  status: ReportStatus;
  entries: ProductionEntry[];
  stops: StopEntry[];
  incidents: QualityIncident[];
  createdAt: string;
}
