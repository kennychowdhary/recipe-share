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

export const COURSES = ["Breakfast", "Lunch", "Dinner", "Dessert", "Snack"] as const;

export const DIETARY_TAGS = [
  "Vegetarian",
  "Vegan",
  "Gluten-free",
  "Dairy-free",
  "Nut-free",
  "Spicy",
  "Quick (< 30 min)",
] as const;
