import { revalidatePath } from "next/cache";
import { getSupabase } from "@/lib/supabase";
import type { Ingredient } from "@/lib/types";

type UpdateBody = {
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

/** Pages are cached (ISR), so a mutation has to clear the ones that show
 * this recipe or the edit appears not to have worked. */
function refreshPages(id: string) {
  revalidatePath(`/recipes/${id}`);
  revalidatePath("/browse");
  revalidatePath("/plan");
}

export async function PATCH(request: Request, { params }: RouteContext<"/api/recipes/[id]">) {
  const supabase = getSupabase();
  if (!supabase) {
    return Response.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const { id } = await params;

  let body: UpdateBody;
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
    return Response.json({ error: "At least one ingredient is required." }, { status: 400 });
  }
  if (steps.length === 0) {
    return Response.json({ error: "At least one step is required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("recipes")
    .update({
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
    .eq("id", id)
    .select("id")
    .single();

  if (error) {
    // With no update policy on the table, PostgREST reports zero rows rather
    // than a permission error — point at the fix instead of a bare 500.
    const missingPolicy = error.code === "PGRST116";
    return Response.json(
      {
        error: missingPolicy
          ? "The database won't accept edits yet — run the update policy from supabase/schema.sql."
          : error.message,
      },
      { status: missingPolicy ? 403 : 500 },
    );
  }

  refreshPages(id);
  return Response.json({ id: data.id });
}

export async function DELETE(_request: Request, { params }: RouteContext<"/api/recipes/[id]">) {
  const supabase = getSupabase();
  if (!supabase) {
    return Response.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const { id } = await params;
  const { data, error } = await supabase.from("recipes").delete().eq("id", id).select("id");

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  if (!data || data.length === 0) {
    return Response.json(
      { error: "Nothing was deleted — run the delete policy from supabase/schema.sql." },
      { status: 403 },
    );
  }

  refreshPages(id);
  return Response.json({ ok: true });
}
