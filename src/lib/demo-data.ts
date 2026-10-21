import type { Product, ProductionReport, Shift, ReportStatus } from "./types";
import { toISODate, addDays } from "./utils";

export const PRODUCTS: Product[] = [
  { id: "p1", name: "Chili Hot Sauce 500g", unit: "unité", baseObjective: 3000 },
  { id: "p2", name: "Croc N'Délice", unit: "kg", baseObjective: 800 },
  { id: "p3", name: "Croc N'Délice Chocolat", unit: "kg", baseObjective: 600 },
  { id: "p4", name: "Ketchup 1Kg", unit: "unité", baseObjective: 2500 },
  { id: "p5", name: "Ketchup 280g", unit: "unité", baseObjective: 6000 },
  { id: "p6", name: "Ketchup 560g", unit: "unité", baseObjective: 3500 },
  { id: "p7", name: "Ketchup En Dosette 10g", unit: "unité", baseObjective: 12000 },
  { id: "p8", name: "Mayonnaise 850g", unit: "unité", baseObjective: 3000 },
  { id: "p9", name: "Mayonnaise En Dosette 10g", unit: "unité", baseObjective: 12000 },
  { id: "p10", name: "Mayonnaise En Seau 3.3kg", unit: "unité", baseObjective: 800 },
  { id: "p11", name: "Moutarde En Bocal 140g", unit: "unité", baseObjective: 6000 },
  { id: "p12", name: "Moutarde En Bocal 350g", unit: "unité", baseObjective: 3500 },
  { id: "p13", name: "Moutarde En Bocal 950g", unit: "unité", baseObjective: 1500 },
  { id: "p14", name: "Sauce Algerienne 350g", unit: "unité", baseObjective: 4000 },
  { id: "p15", name: "Sauce Algerienne 900g", unit: "unité", baseObjective: 1800 },
  { id: "p16", name: "Sauce Barbecue 900g", unit: "unité", baseObjective: 1800 },
  { id: "p17", name: "Sauce Barbecue 400g", unit: "unité", baseObjective: 3000 },
  { id: "p18", name: "Sauce Burger 350g", unit: "unité", baseObjective: 4000 },
  { id: "p19", name: "Sauce Burger 900g", unit: "unité", baseObjective: 1800 },
  { id: "p20", name: "Sauce Cheddar 900g", unit: "unité", baseObjective: 1800 },
  { id: "p21", name: "Sauce Cheddar 350g", unit: "unité", baseObjective: 4000 },
  { id: "p22", name: "Sauce Fromagère 950g", unit: "kg", baseObjective: 500 },
  { id: "p23", name: "Sauce Gruyère 350g", unit: "unité", baseObjective: 4000 },
  { id: "p24", name: "Sauce Gruyère 900g", unit: "unité", baseObjective: 1800 },
  { id: "p25", name: "Sauce Harissa Dosette 10g", unit: "unité", baseObjective: 10000 },
  { id: "p26", name: "Sauce Piquante 900g", unit: "unité", baseObjective: 1800 },
  { id: "p27", name: "Sauce Piquante En Dosette 10g", unit: "unité", baseObjective: 10000 },
  { id: "p28", name: "Sauce Tomate 3.3kg", unit: "kg", baseObjective: 600 },
  { id: "p29", name: "Sweet Chili Sauce 500g", unit: "unité", baseObjective: 3000 },
  { id: "p30", name: "Topping Cassis 500g", unit: "unité", baseObjective: 3000 },
  { id: "p31", name: "Vinaigrette Ciboulette 500g", unit: "unité", baseObjective: 3000 },
  { id: "p32", name: "Vinaigrette A L'Ancienne 500g", unit: "unité", baseObjective: 3000 },
  { id: "p33", name: "Vinaigrette Crudité 500g", unit: "unité", baseObjective: 3000 },
  { id: "p34", name: "Moutarde En Seau 2.2kg", unit: "kg", baseObjective: 800 },
  { id: "p35", name: "Ketchup En Seau 3.3kg", unit: "kg", baseObjective: 600 },
  { id: "p36", name: "Sauce Mayonnaise À L'Ail 350g", unit: "unité", baseObjective: 4000 },
  { id: "p37", name: "Sauce Blanche 350g", unit: "unité", baseObjective: 4000 },
  { id: "p38", name: "Sauce Blanche 900g", unit: "unité", baseObjective: 1800 },
  { id: "p39", name: "Sauce Curry 350g", unit: "unité", baseObjective: 4000 },
  { id: "p40", name: "Sauce Curry 900g", unit: "unité", baseObjective: 1800 },
  { id: "p41", name: "Sauce Samourai 350g", unit: "unité", baseObjective: 4000 },
  { id: "p42", name: "Sauce Smoke Burger 900g", unit: "unité", baseObjective: 1800 },
  { id: "p43", name: "Sauce Oignon 900g", unit: "unité", baseObjective: 1800 },
  { id: "p44", name: "Sauce Samourai 900g", unit: "unité", baseObjective: 1800 },
  { id: "p45", name: "Topping Cappuccino 500g", unit: "unité", baseObjective: 3000 },
  { id: "p46", name: "Topping Fraise 500g", unit: "unité", baseObjective: 3000 },
  { id: "p47", name: "Topping Caramel 500g", unit: "unité", baseObjective: 3000 },
  { id: "p48", name: "Topping Lait Concentré Sucré 500g", unit: "unité", baseObjective: 3000 },
  { id: "p49", name: "Vinaigrette En Dosette 10g", unit: "unité", baseObjective: 12000 },
  { id: "p50", name: "Topping Chocolat Noisette 500g", unit: "unité", baseObjective: 3000 },
  { id: "p51", name: "Topping Chocolat Noir 500g", unit: "unité", baseObjective: 3000 },
  { id: "p52", name: "Sauce Harissa 400g", unit: "unité", baseObjective: 3000 },
  { id: "p53", name: "Barbecue En Dosette 10g", unit: "unité", baseObjective: 10000 },
  { id: "p54", name: "Sauce Mayonnaise À L'Ail 3.3kg", unit: "kg", baseObjective: 600 },
  { id: "p55", name: "Ketchup Original 300g", unit: "unité", baseObjective: 5000 },
  { id: "p56", name: "Mayonnaise Aux Oeufs Frais 270g", unit: "unité", baseObjective: 6000 },
  { id: "p57", name: "Fourrage & Topping Caramel 400g", unit: "unité", baseObjective: 3000 },
];

const SHIFTS: Shift[] = ["Matin", "Après-midi", "Nuit"];
const STATUSES: ReportStatus[] = ["validé", "validé", "validé", "validé", "en attente", "rejeté"];
const OPERATORS = [
  "Karim Benali",
  "Sophie Marchand",
  "Pierre Dubois",
  "Laura Petit",
  "Ahmed Cherif",
  "Julie Roux",
  "Marc Olivier",
  "Nadia Belkacem",
];

const LOSS_CAUSES = [
  "Rebut qualité",
  "Changement de format",
  "Démarrage ligne",
  "Erreur opérateur",
  "Matière non conforme",
  "Conditionnement défectueux",
];

const STOP_MOTIFS = [
  "Maintenance préventive",
  "Maintenance corrective",
  "Changement de format",
  "Nettoyage / sanitaire",
  "Manque de matière première",
  "Pause équipe",
  "Réunion de service",
  "Panne électrique",
];

const INCIDENT_TYPES = [
  "Écart de poids",
  "Non-conformité pH",
  "Défaut d'étiquetage",
  "Fuite de joint",
  "Température hors tolérance",
  "Corps étranger détecté",
];

// Deterministic pseudo-random for stable demo data
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function generateDemoReports(): ProductionReport[] {
  const reports: ProductionReport[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const rng = seededRandom(42);

  // 14 days of reports, up to 2-3 shifts per day (but not all filled)
  for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
    const date = addDays(today, -dayOffset);
    const dateStr = toISODate(date);

    // Not every shift has a report every day
    const numShifts = randInt(rng, 2, 3);
    for (let s = 0; s < numShifts; s++) {
      const shift = SHIFTS[s % 3];
      const status = pick(rng, STATUSES);
      const operator = pick(rng, OPERATORS);

      // Each shift produces 2-4 products
      const numProducts = randInt(rng, 2, 4);
      const productIndices = new Set<number>();
      while (productIndices.size < numProducts) {
        productIndices.add(randInt(rng, 0, PRODUCTS.length - 1));
      }

      const entries = Array.from(productIndices).map((idx) => {
        const product = PRODUCTS[idx];
        const objective = product.baseObjective / 3; // per-shift objective
        const variance = 0.82 + rng() * 0.28; // 82% to 110%
        const produced = Math.round(objective * variance * 10) / 10;
        const lossRate = 0.005 + rng() * 0.03; // 0.5% to 3.5%
        const losses = Math.round(produced * lossRate * 10) / 10;
        return {
          productId: product.id,
          productName: product.name,
          unit: product.unit,
          objective: Math.round(objective * 10) / 10,
          produced,
          losses,
        };
      });

      // 1-3 stops per shift
      const numStops = randInt(rng, 1, 3);
      const stops = [];
      const usedMotifs = new Set<string>();
      for (let i = 0; i < numStops; i++) {
        let motif = pick(rng, STOP_MOTIFS);
        let guard = 0;
        while (usedMotifs.has(motif) && guard < 5) {
          motif = pick(rng, STOP_MOTIFS);
          guard++;
        }
        usedMotifs.add(motif);
        stops.push({
          motif,
          durationHours: Math.round((0.25 + rng() * 2.5) * 100) / 100,
        });
      }

      // 0-2 incidents
      const numIncidents = randInt(rng, 0, 2);
      const incidents = [];
      for (let i = 0; i < numIncidents; i++) {
        incidents.push({
          type: pick(rng, INCIDENT_TYPES),
          description: `Détecté en fin de ligne, ${pick(rng, ["conforme après contrôle", "lot mis en quarantaine", "action corrective appliquée"])}.`,
        });
      }

      reports.push({
        id: `RPT-${dateStr}-${shift}`,
        date: dateStr,
        shift,
        operator,
        status,
        entries,
        stops,
        incidents,
        createdAt: dateStr,
      });
    }
  }

  return reports;
}

export const LOSS_CAUSES_LIST = LOSS_CAUSES;
export const STOP_MOTIFS_LIST = STOP_MOTIFS;
export const INCIDENT_TYPES_LIST = INCIDENT_TYPES;
export const SHIFTS_LIST = SHIFTS;
