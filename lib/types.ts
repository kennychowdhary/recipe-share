export type Ingredient = {
  quantity: string;
  unit: string;
  name: string;
};

export type Recipe = {
  id: string;
  created_at: string;
  name: string;
  cuisine: string;
  course: string;
  servings: number;
  prep_minutes: number;
  cook_minutes: number;
  ingredients: Ingredient[];
  steps: string[];
  tags: string[];
  notes: string;
  author: string;
};

export const COURSES = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Dessert",
  "Snack",
  "Drinks",
] as const;

export const COURSE_ICONS: Record<string, string> = {
  Breakfast: "🍳",
  Lunch: "🥪",
  Dinner: "🍽️",
  Dessert: "🍰",
  Snack: "🍿",
  Drinks: "🍹",
};

/** "Dinner" → "🍽️ Dinner"; unknown courses pass through untouched. */
export function courseLabel(course: string): string {
  const icon = COURSE_ICONS[course];
  return icon ? `${icon} ${course}` : course;
}

export const DIETARY_TAGS = [
  "Vegetarian",
  "Vegan",
  "Gluten-free",
  "Dairy-free",
  "Nut-free",
  "Spicy",
  "Quick (< 30 min)",
] as const;
