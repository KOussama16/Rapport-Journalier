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
  { id: "r07", name: "Ketchup En Dosette 10g", unit: "unité", defaultTarget: 12000, allowedLines: ["L5"] },
  { id: "r08", name: "Mayonnaise 850g", unit: "unité", defaultTarget: 3000, allowedLines: ["L2", "L6", "L7"] },
  { id: "r09", name: "Mayonnaise En Dosette 10g", unit: "unité", defaultTarget: 12000, allowedLines: ["L5"] },
  { id: "r10", name: "Mayonnaise En Seau 3.3kg", unit: "unité", defaultTarget: 800, allowedLines: ["L1", "L8"] },
  { id: "r11", name: "Moutarde En Bocal 140g", unit: "unité", defaultTarget: 6000, allowedLines: ["L4"] },
  { id: "r12", name: "Moutarde En Bocal 350g", unit: "unité", defaultTarget: 3500, allowedLines: ["L4"] },
  { id: "r13", name: "Moutarde En Bocal 950g", unit: "unité", defaultTarget: 1500, allowedLines: ["L4"] },
  { id: "r14", name: "Sauce Algerienne 350g", unit: "unité", defaultTarget: 4000, allowedLines: ["L3", "L7"] },
  { id: "r15", name: "Sauce Algerienne 900g", unit: "unité", defaultTarget: 1800, allowedLines: ["L2", "L3", "L7"] },
  { id: "r16", name: "Sauce Barbecue 900g", unit: "unité", defaultTarget: 1800, allowedLines: ["L2", "L3", "L7"] },
  { id: "r17", name: "Sauce Barbecue 400g", unit: "unité", defaultTarget: 3000, allowedLines: ["L3", "L7"] },
  { id: "r18", name: "Sauce Burger 350g", unit: "unité", defaultTarget: 4000, allowedLines: ["L3", "L7"] },
  { id: "r19", name: "Sauce Burger 900g", unit: "unité", defaultTarget: 1800, allowedLines: ["L2", "L3", "L7"] },
  { id: "r20", name: "Sauce Cheddar 900g", unit: "unité", defaultTarget: 1800, allowedLines: ["L2", "L3", "L7"] },
  { id: "r21", name: "Sauce Cheddar 350g", unit: "unité", defaultTarget: 4000, allowedLines: ["L3", "L7"] },
  { id: "r22", name: "Sauce Fromagère 950g", unit: "kg", defaultTarget: 500, allowedLines: ["L3", "L7"] },
  { id: "r23", name: "Sauce Gruyère 350g", unit: "unité", defaultTarget: 4000, allowedLines: ["L3", "L7"] },
  { id: "r24", name: "Sauce Gruyère 900g", unit: "unité", defaultTarget: 1800, allowedLines: ["L2", "L3", "L7"] },
  { id: "r25", name: "Sauce Harissa Dosette 10g", unit: "unité", defaultTarget: 10000, allowedLines: ["L5"] },
  { id: "r26", name: "Sauce Piquante 900g", unit: "unité", defaultTarget: 1800, allowedLines: ["L2", "L3", "L7"] },
  { id: "r27", name: "Sauce Piquante En Dosette 10g", unit: "unité", defaultTarget: 10000, allowedLines: ["L5"] },
  { id: "r28", name: "Sauce Tomate 3.3kg", unit: "kg", defaultTarget: 600, allowedLines: ["L1", "L8"] },
  { id: "r29", name: "Sweet Chili Sauce 500g", unit: "unité", defaultTarget: 3000, allowedLines: ["L2", "L7"] },
  { id: "r30", name: "Topping Cassis 500g", unit: "unité", defaultTarget: 3000, allowedLines: ["L3", "L7"] },
  { id: "r31", name: "Vinaigrette Ciboulette 500g", unit: "unité", defaultTarget: 3000, allowedLines: ["L2"] },
  { id: "r32", name: "Vinaigrette A L'Ancienne 500g", unit: "unité", defaultTarget: 3000, allowedLines: ["L2"] },
  { id: "r33", name: "Vinaigrette Crudité 500g", unit: "unité", defaultTarget: 3000, allowedLines: ["L2"] },
  { id: "r34", name: "Moutarde En Seau 2.2kg", unit: "kg", defaultTarget: 800, allowedLines: ["L1", "L8"] },
  { id: "r35", name: "Ketchup En Seau 3.3kg", unit: "kg", defaultTarget: 600, allowedLines: ["L1", "L8"] },
  { id: "r36", name: "Sauce Mayonnaise À L'Ail 350g", unit: "unité", defaultTarget: 4000, allowedLines: ["L2", "L6", "L7"] },
  { id: "r37", name: "Sauce Blanche 350g", unit: "unité", defaultTarget: 4000, allowedLines: ["L3", "L7"] },
  { id: "r38", name: "Sauce Blanche 900g", unit: "unité", defaultTarget: 1800, allowedLines: ["L2", "L3", "L7"] },
  { id: "r39", name: "Sauce Curry 350g", unit: "unité", defaultTarget: 4000, allowedLines: ["L3", "L7"] },
  { id: "r40", name: "Sauce Curry 900g", unit: "unité", defaultTarget: 1800, allowedLines: ["L2", "L3", "L7"] },
  { id: "r41", name: "Sauce Samourai 350g", unit: "unité", defaultTarget: 4000, allowedLines: ["L3", "L7"] },
  { id: "r42", name: "Sauce Smoke Burger 900g", unit: "unité", defaultTarget: 1800, allowedLines: ["L2", "L3", "L7"] },
  { id: "r43", name: "Sauce Oignon 900g", unit: "unité", defaultTarget: 1800, allowedLines: ["L2", "L3", "L7"] },
  { id: "r44", name: "Sauce Samourai 900g", unit: "unité", defaultTarget: 1800, allowedLines: ["L2", "L3", "L7"] },
  { id: "r45", name: "Topping Cappuccino 500g", unit: "unité", defaultTarget: 3000, allowedLines: ["L3", "L7"] },
  { id: "r46", name: "Topping Fraise 500g", unit: "unité", defaultTarget: 3000, allowedLines: ["L3", "L7"] },
  { id: "r47", name: "Topping Caramel 500g", unit: "unité", defaultTarget: 3000, allowedLines: ["L3", "L7"] },
  { id: "r48", name: "Topping Lait Concentré Sucré 500g", unit: "unité", defaultTarget: 3000, allowedLines: ["L3", "L7"] },
  { id: "r49", name: "Vinaigrette En Dosette 10g", unit: "unité", defaultTarget: 12000, allowedLines: ["L5"] },
  { id: "r50", name: "Topping Chocolat Noisette 500g", unit: "unité", defaultTarget: 3000, allowedLines: ["L3", "L7"] },
  { id: "r51", name: "Topping Chocolat Noir 500g", unit: "unité", defaultTarget: 3000, allowedLines: ["L3", "L7"] },
  { id: "r52", name: "Sauce Harissa 400g", unit: "unité", defaultTarget: 3000, allowedLines: ["L3", "L7"] },
  { id: "r53", name: "Barbecue En Dosette 10g", unit: "unité", defaultTarget: 10000, allowedLines: ["L5"] },
  { id: "r54", name: "Sauce Mayonnaise À L'Ail 3.3kg", unit: "kg", defaultTarget: 600, allowedLines: ["L1", "L8"] },
  { id: "r55", name: "Ketchup Original 300g", unit: "unité", defaultTarget: 5000, allowedLines: ["L3", "L7"] },
  { id: "r56", name: "Mayonnaise Aux Oeufs Frais 270g", unit: "unité", defaultTarget: 6000, allowedLines: ["L2", "L6", "L7"] },
  { id: "r57", name: "Fourrage & Topping Caramel 400g", unit: "unité", defaultTarget: 3000, allowedLines: ["L3", "L7"] },
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
