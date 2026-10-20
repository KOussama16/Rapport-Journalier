import type { Unit } from "./types";

export const PRODUCTION_LINES = ["L1", "L2", "L3", "L4", "L5", "L6", "L7", "L8", "L9"] as const;
export type ProductionLine = (typeof PRODUCTION_LINES)[number];

export interface ProductLineRef {
  id: string;
  name: string;
  unit: Unit;
  defaultTarget: number;
  allowedLines: ProductionLine[];
}

// Centralized referential: product -> compatible production lines + tracking unit.
export const PRODUCT_REFERENTIAL: ProductLineRef[] = [
  { id: "r01", name: "Chili Hot Sauce 500g", unit: "unité", defaultTarget: 3000, allowedLines: ["L2", "L7"] },
  { id: "r02", name: "Croc N'Délice", unit: "kg", defaultTarget: 800, allowedLines: ["L9"] },
  { id: "r03", name: "Croc N'Délice Chocolat", unit: "kg", defaultTarget: 600, allowedLines: ["L9"] },
  { id: "r04", name: "Ketchup 1Kg", unit: "unité", defaultTarget: 2500, allowedLines: ["L3", "L7"] },
  { id: "r05", name: "Ketchup 280g", unit: "unité", defaultTarget: 6000, allowedLines: ["L3", "L7"] },
  { id: "r06", name: "Ketchup 560g", unit: "unité", defaultTarget: 3500, allowedLines: ["L3", "L7"] },
  { id: "r07", name: "Ketchup en Dosette 10g", unit: "unité", defaultTarget: 12000, allowedLines: ["L5"] },
  { id: "r08", name: "Mayonnaise 850g", unit: "unité", defaultTarget: 3000, allowedLines: ["L2", "L6", "L7"] },
  { id: "r09", name: "Mayonnaise en Dosette 10g", unit: "unité", defaultTarget: 12000, allowedLines: ["L5"] },
  { id: "r10", name: "Mayonnaise en Seau 3,3kg", unit: "unité", defaultTarget: 800, allowedLines: ["L1", "L8"] },
  { id: "r11", name: "Moutarde en Bocal 140g", unit: "unité", defaultTarget: 6000, allowedLines: ["L4"] },
  { id: "r12", name: "Moutarde en Bocal 350g", unit: "unité", defaultTarget: 3500, allowedLines: ["L4"] },
  { id: "r13", name: "Moutarde en Bocal 950g", unit: "unité", defaultTarget: 1500, allowedLines: ["L4"] },
  { id: "r14", name: "Sauce Algérienne 350g", unit: "unité", defaultTarget: 4000, allowedLines: ["L3"] },
  { id: "r15", name: "Sauce Algérienne 900g", unit: "unité", defaultTarget: 1800, allowedLines: ["L2", "L3"] },
  { id: "r16", name: "Sauce Barbecue 900g", unit: "unité", defaultTarget: 1800, allowedLines: ["L2", "L3"] },
  { id: "r17", name: "Sauce Burger 350g", unit: "unité", defaultTarget: 4000, allowedLines: ["L3", "L7"] },
  { id: "r18", name: "Sauce Burger 900g", unit: "unité", defaultTarget: 1800, allowedLines: ["L2", "L3", "L7"] },
  { id: "r19", name: "Sauce Cheddar 900g", unit: "unité", defaultTarget: 1800, allowedLines: ["L2", "L3", "L7"] },
  { id: "r20", name: "Sauce Fromagère 950g", unit: "kg", defaultTarget: 500, allowedLines: ["L3", "L7"] },
  { id: "r21", name: "Sauce Gruyère 350g", unit: "unité", defaultTarget: 4000, allowedLines: ["L3", "L7"] },
  { id: "r22", name: "Sauce Gruyère 900g", unit: "unité", defaultTarget: 1800, allowedLines: ["L2", "L3", "L7"] },
  { id: "r23", name: "Sauce Harissa Dosette 10g", unit: "unité", defaultTarget: 10000, allowedLines: ["L5"] },
  { id: "r24", name: "Sauce Piquante 900g", unit: "unité", defaultTarget: 1800, allowedLines: ["L2", "L3", "L7"] },
  { id: "r25", name: "Sauce Piquante en Dosette 10g", unit: "unité", defaultTarget: 10000, allowedLines: ["L5"] },
  { id: "r26", name: "Sauce Tomate 3,3kg", unit: "kg", defaultTarget: 600, allowedLines: ["L1", "L8"] },
  { id: "r27", name: "Sweet Chili Sauce 500g", unit: "unité", defaultTarget: 3000, allowedLines: ["L2", "L7"] },
  { id: "r28", name: "Topping Cassis 500g", unit: "unité", defaultTarget: 3000, allowedLines: ["L3", "L7"] },
  { id: "r29", name: "Vinaigrette Ciboulette 500g", unit: "unité", defaultTarget: 3000, allowedLines: ["L2"] },
];

export function getProductById(id: string): ProductLineRef | undefined {
  return PRODUCT_REFERENTIAL.find((p) => p.id === id);
}

export function productsForLine(line: ProductionLine): ProductLineRef[] {
  return PRODUCT_REFERENTIAL.filter((p) => p.allowedLines.includes(line));
}

export function isCompatible(productId: string, line: ProductionLine): boolean {
  const product = getProductById(productId);
  if (!product) return false;
  return product.allowedLines.includes(line);
}
