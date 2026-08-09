import type { Ingredient, Recipe } from "./types";

export type GroceryItem = {
  /** Display quantity, e.g. "2 1/2". Empty when nothing was measurable. */
  quantity: string;
  unit: string;
  name: string;
  /** Prep notes gathered from the merged lines, e.g. ["diced", "sliced"]. */
  notes: string[];
  /** Recipe names this item is needed for. */
  recipes: string[];
};

const VULGAR: Record<string, number> = {
  "½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3,
  "⅛": 0.125, "⅜": 0.375, "⅝": 0.625, "⅞": 0.875,
};

/**
 * Parse the quantity strings people actually write: "2", "1/2", "1 1/2",
 * "0.75", "½", "2-3" (takes the low end). Returns null when there's no number
 * to work with, which is the signal to keep the line unmerged.
 */
export function parseQuantity(raw: string): number | null {
  const s = raw.trim().toLowerCase();
  if (!s) return null;

  for (const [glyph, value] of Object.entries(VULGAR)) {
    if (s === glyph) return value;
    if (s.endsWith(glyph)) {
      const whole = Number(s.slice(0, -glyph.length).trim());
      if (Number.isFinite(whole)) return whole + value;
    }
  }

  // Ranges and "or" alternatives: shop for the smaller amount.
  const firstOfRange = s.split(/\s*(?:-|–|to|or)\s*/)[0];

  const mixed = firstOfRange.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);

  const fraction = firstOfRange.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fraction) return Number(fraction[1]) / Number(fraction[2]);

  const plain = Number(firstOfRange);
  return Number.isFinite(plain) ? plain : null;
}

const NICE_FRACTIONS: [number, string][] = [
  [0.125, "1/8"], [0.25, "1/4"], [1 / 3, "1/3"], [0.375, "3/8"], [0.5, "1/2"],
  [0.625, "5/8"], [2 / 3, "2/3"], [0.75, "3/4"], [0.875, "7/8"],
];

/** Render a number the way a shopping list should read: "3", "1 1/2", "0.4". */
export function formatQuantity(n: number): string {
  const whole = Math.floor(n);
  const rest = n - whole;
  if (rest < 0.01) return String(whole);

  for (const [value, label] of NICE_FRACTIONS) {
    if (Math.abs(rest - value) < 0.02) {
      return whole ? `${whole} ${label}` : label;
    }
  }
  return String(Math.round(n * 100) / 100);
}

const UNIT_ALIASES: Record<string, string> = {
  tablespoon: "tbsp", tablespoons: "tbsp", tbs: "tbsp", tbsp: "tbsp",
  teaspoon: "tsp", teaspoons: "tsp", tsp: "tsp",
  cup: "cup", cups: "cup",
  gram: "g", grams: "g", g: "g",
  kilogram: "kg", kilograms: "kg", kg: "kg",
  ounce: "oz", ounces: "oz", oz: "oz",
  pound: "lb", pounds: "lb", lb: "lb", lbs: "lb",
  milliliter: "ml", milliliters: "ml", ml: "ml",
  liter: "l", liters: "l", litre: "l", l: "l",
  clove: "clove", cloves: "clove",
  head: "head", heads: "head",
  bunch: "bunch", bunches: "bunch",
  can: "can", cans: "can",
  slice: "slice", slices: "slice",
  sprig: "sprig", sprigs: "sprig",
  pinch: "pinch", pinches: "pinch",
};

function normalizeUnit(unit: string): string {
  const key = unit.trim().toLowerCase().replace(/\.$/, "");
  return UNIT_ALIASES[key] ?? key;
}

/**
 * "red lentils, rinsed" → { base: "red lentils", note: "rinsed" }.
 * Splitting here is what lets two recipes' onions add up even when one dices
 * and the other slices.
 */
function splitName(name: string): { base: string; note: string } {
  const [head, ...tail] = name.split(",");
  return { base: head.trim(), note: tail.join(",").trim() };
}

/**
 * Combine ingredients across recipes into one shopping list.
 *
 * Lines merge when the ingredient and unit match; amounts add up. Anything
 * unmeasured ("a splash of olive oil") is kept as its own line rather than
 * silently dropped or guessed at.
 */
export function buildGroceryList(
  recipes: { name: string; ingredients: Ingredient[]; multiplier?: number }[],
): GroceryItem[] {
  const merged = new Map<string, GroceryItem & { total: number | null }>();

  for (const recipe of recipes) {
    const multiplier = recipe.multiplier ?? 1;

    for (const ingredient of recipe.ingredients ?? []) {
      if (!ingredient.name?.trim()) continue;

      const { base, note } = splitName(ingredient.name);
      const unit = normalizeUnit(ingredient.unit ?? "");
      const amount = parseQuantity(ingredient.quantity ?? "");
      // Unmeasured lines get a unique key so they never absorb each other.
      const key =
        amount === null
          ? `${base.toLowerCase()}|${unit}|${ingredient.quantity}|${recipe.name}`
          : `${base.toLowerCase()}|${unit}`;

      const existing = merged.get(key);
      if (existing) {
        if (existing.total !== null && amount !== null) {
          existing.total += amount * multiplier;
        }
        if (note && !existing.notes.includes(note)) existing.notes.push(note);
        if (!existing.recipes.includes(recipe.name)) existing.recipes.push(recipe.name);
      } else {
        merged.set(key, {
          total: amount === null ? null : amount * multiplier,
          quantity: ingredient.quantity ?? "",
          unit: ingredient.unit ?? "",
          name: base,
          notes: note ? [note] : [],
          recipes: [recipe.name],
        });
      }
    }
  }

  return [...merged.values()]
    .map(({ total, ...item }) => ({
      ...item,
      quantity: total === null ? item.quantity : formatQuantity(total),
      unit: total === null ? item.unit : normalizeUnit(item.unit),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Encode picks for the URL, collapsing repeats into "id:count" so a recipe
 * cooked twice in a week buys twice the ingredients.
 */
export function encodePicks(ids: string[]): string {
  const counts = new Map<string, number>();
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts.entries()].map(([id, n]) => (n > 1 ? `${id}:${n}` : id)).join(",");
}

export function decodePicks(param: string | undefined): Map<string, number> {
  const counts = new Map<string, number>();
  if (!param) return counts;
  for (const chunk of param.split(",")) {
    const [id, n] = chunk.split(":");
    if (!id?.trim()) continue;
    counts.set(id.trim(), Math.max(1, Math.min(20, Number(n) || 1)));
  }
  return counts;
}

export function totalTime(r: Pick<Recipe, "prep_minutes" | "cook_minutes">): number {
  return (r.prep_minutes ?? 0) + (r.cook_minutes ?? 0);
}
