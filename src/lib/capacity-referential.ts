import type { ProductionLine } from "./production-referential";

export interface CapacitySpec {
  cadence: number; // unités/heure
  changeoverMinutes: number; // temps de changement de format (minutes)
}

// Référentiel des capacités machines : (produit, ligne) -> cadence + changement de format.
// Key format: `${productId}|${line}`
const CAPACITY_MAP: Record<string, CapacitySpec> = {
  // Chili Hot Sauce 500g — r01
  "r01|L2": { cadence: 900, changeoverMinutes: 15 },
  "r01|L7": { cadence: 1050, changeoverMinutes: 30 },
  // Croc N'Délice 110g — r02
  "r02|L9": { cadence: 650, changeoverMinutes: 0 },
  // Croc N'Délice Chocolat 110g — r03
  "r03|L9": { cadence: 650, changeoverMinutes: 0 },
  // Ketchup 1Kg — r04
  "r04|L7": { cadence: 900, changeoverMinutes: 30 },
  "r04|L3": { cadence: 650, changeoverMinutes: 15 },
  // Ketchup 280g — r05
  "r05|L7": { cadence: 1200, changeoverMinutes: 30 },
  "r05|L3": { cadence: 750, changeoverMinutes: 15 },
  // Ketchup 560g — r06
  "r06|L7": { cadence: 900, changeoverMinutes: 30 },
  "r06|L3": { cadence: 650, changeoverMinutes: 15 },
  // Ketchup en Dosette 10g — r07
  "r07|L5": { cadence: 70, changeoverMinutes: 0 },
  // Mayonnaise 850g — r08
  "r08|L6": { cadence: 1050, changeoverMinutes: 0 },
  "r08|L2": { cadence: 650, changeoverMinutes: 15 },
  "r08|L7": { cadence: 1050, changeoverMinutes: 30 },
  // Mayonnaise en Dosette 10g — r09
  "r09|L5": { cadence: 70, changeoverMinutes: 0 },
  // Mayonnaise en Seau 3,3kg — r10
  "r10|L1": { cadence: 300, changeoverMinutes: 0 },
  "r10|L8": { cadence: 320, changeoverMinutes: 0 },
  // Moutarde en Bocal 140g — r11
  "r11|L4": { cadence: 800, changeoverMinutes: 15 },
  // Moutarde en Bocal 350g — r12
  "r12|L4": { cadence: 650, changeoverMinutes: 15 },
  // Moutarde en Bocal 950g — r13
  "r13|L4": { cadence: 200, changeoverMinutes: 15 },
  // Sauce Algérienne 350g — r14
  "r14|L3": { cadence: 800, changeoverMinutes: 15 },
  // Sauce Algérienne 900g — r15
  "r15|L2": { cadence: 650, changeoverMinutes: 15 },
  "r15|L3": { cadence: 800, changeoverMinutes: 15 },
  // Sauce Barbecue 900g — r16
  "r16|L2": { cadence: 650, changeoverMinutes: 15 },
  "r16|L3": { cadence: 800, changeoverMinutes: 15 },
  // Sauce Burger 350g — r18
  "r18|L3": { cadence: 800, changeoverMinutes: 15 },
  "r18|L7": { cadence: 800, changeoverMinutes: 30 },
  // Sauce Burger 900g — r19
  "r19|L3": { cadence: 800, changeoverMinutes: 15 },
  "r19|L2": { cadence: 650, changeoverMinutes: 15 },
  // Sauce Cheddar 900g — r20
  "r20|L3": { cadence: 800, changeoverMinutes: 15 },
  "r20|L2": { cadence: 650, changeoverMinutes: 0 },
  // Sauce Fromagère 950g — r22
  "r22|L7": { cadence: 240, changeoverMinutes: 30 },
  "r22|L3": { cadence: 200, changeoverMinutes: 15 },
  // Sauce Gruyère 350g — r23
  "r23|L3": { cadence: 800, changeoverMinutes: 15 },
  "r23|L7": { cadence: 800, changeoverMinutes: 30 },
  // Sauce Gruyère 900g — r24
  "r24|L2": { cadence: 650, changeoverMinutes: 15 },
  "r24|L3": { cadence: 800, changeoverMinutes: 15 },
  // Sauce Harissa Dosette 10g — r25
  "r25|L5": { cadence: 70, changeoverMinutes: 0 },
  // Sauce Piquante 900g — r26
  "r26|L3": { cadence: 800, changeoverMinutes: 15 },
  "r26|L2": { cadence: 650, changeoverMinutes: 15 },
  // Sauce Piquante en Dosette 10g — r27
  "r27|L5": { cadence: 70, changeoverMinutes: 0 },
  // Sauce Tomate 3,3kg — r28
  "r28|L1": { cadence: 224, changeoverMinutes: 0 },
  "r28|L8": { cadence: 290, changeoverMinutes: 0 },
  // Sweet Chili Sauce 500g — r29
  "r29|L2": { cadence: 900, changeoverMinutes: 15 },
  "r29|L7": { cadence: 1050, changeoverMinutes: 30 },
  // Topping Cassis 500g — r30
  "r30|L7": { cadence: 250, changeoverMinutes: 30 },
  "r30|L3": { cadence: 250, changeoverMinutes: 15 },
  // Vinaigrette Ciboulette 500g — r31
  "r31|L2": { cadence: 800, changeoverMinutes: 15 },
  // Ketchup En Seau 3.3kg (Ketchup 3,3) — r35
  "r35|L1": { cadence: 224, changeoverMinutes: 0 },
  "r35|L8": { cadence: 290, changeoverMinutes: 0 },
};

export const DEFAULT_SHIFT_DURATION_HOURS = 7;

export function getCapacitySpec(productId: string, line: ProductionLine): CapacitySpec | undefined {
  return CAPACITY_MAP[`${productId}|${line}`];
}

/**
 * Capacité = cadence × durée productive en heures.
 * Le temps de changement de format est déduit de la durée productive
 * uniquement s'il est > 0 (non inclus par défaut).
 */
export function computeCapacity(
  productId: string,
  line: ProductionLine | "",
  shiftDurationHours: number
): number | null {
  if (!productId || !line) return null;
  const spec = getCapacitySpec(productId, line);
  if (!spec) return null;
  const changeoverHours = spec.changeoverMinutes / 60;
  const productiveHours = Math.max(0, shiftDurationHours - changeoverHours);
  return Math.round(spec.cadence * productiveHours);
}

/**
 * Taux d'utilisation = Réalisé / Capacité × 100.
 * Retourne null si la capacité est nulle ou non définie.
 */
export function utilizationRate(produced: number, capacity: number | null): number | null {
  if (capacity === null || capacity <= 0) return null;
  return (produced / capacity) * 100;
}
