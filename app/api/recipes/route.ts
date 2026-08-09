import { getSupabase } from "@/lib/supabase";
import type { Ingredient } from "@/lib/types";

type SubmitBody = {
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

export async function POST(request: Request) {
  const supabase = getSupabase();
  if (!supabase) {
    return Response.json(
      { error: "Supabase is not configured. See README for setup." },
      { status: 503 },
    );
  }

  let body: SubmitBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.name?.trim()) {
    return Response.json({ error: "Recipe name is required." }, { status: 400 });
  }
  const ingredients = (body.ingredients ?? []).filter((i) => i.name?.trim());
  const steps = (body.steps ?? []).map((s) => s.trim()).filter(Boolean);
  if (ingredients.length === 0) {
    return Response.json(
      { error: "At least one ingredient is required." },
      { status: 400 },
    );
  }
  if (steps.length === 0) {
    return Response.json({ error: "At least one step is required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("recipes")
    .insert({
      name: body.name.trim().slice(0, 200),
      cuisine: (body.cuisine ?? "").trim().slice(0, 100),
      course: (body.course ?? "").trim().slice(0, 50),
      servings: Math.max(1, Math.min(100, Number(body.servings) || 1)),
      prep_minutes: Math.max(0, Math.min(6000, Number(body.prep_minutes) || 0)),
      cook_minutes: Math.max(0, Math.min(6000, Number(body.cook_minutes) || 0)),
      ingredients,
      steps,
      tags: (body.tags ?? []).slice(0, 20),
      notes: (body.notes ?? "").trim().slice(0, 5000),
      author: (body.author ?? "").trim().slice(0, 100),
    })
    .select("id")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ id: data.id }, { status: 201 });
}
