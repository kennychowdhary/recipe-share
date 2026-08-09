import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import type { Recipe } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RecipePage({
  params,
}: PageProps<"/recipes/[id]">) {
  const { id } = await params;
  const supabase = getSupabase();
  if (!supabase) notFound();

  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) notFound();
  const r = data as Recipe;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16">
      <Link href="/browse" className="text-sm text-muted hover:text-foreground">
        ← All recipes
      </Link>

      <div className="mt-6 text-sm text-muted">
        {r.cuisine} · {r.course}
        {r.author ? ` · by ${r.author}` : ""}
      </div>
      <h1 className="mt-2 font-serif text-4xl font-semibold">{r.name}</h1>

      <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted">
        <span>Prep {r.prep_minutes} min</span>
        <span>Cook {r.cook_minutes} min</span>
        <span>Serves {r.servings}</span>
      </div>

      {r.tags?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {r.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-pill px-3 py-1 text-xs text-pill-fg"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      <section className="mt-10 rounded-2xl border border-border bg-card p-8">
        <h2 className="font-serif text-2xl font-semibold">Ingredients</h2>
        <ul className="mt-4 space-y-2">
          {r.ingredients.map((ing, i) => (
            <li key={i} className="flex gap-3">
              <span className="w-24 shrink-0 text-muted">
                {ing.quantity} {ing.unit}
              </span>
              <span>{ing.name}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-8">
        <h2 className="font-serif text-2xl font-semibold">Steps</h2>
        <ol className="mt-4 space-y-4">
          {r.steps.map((step, i) => (
            <li key={i} className="flex gap-4">
              <span className="font-serif text-xl font-semibold text-accent">
                {i + 1}
              </span>
              <p className="leading-relaxed">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      {r.notes && (
        <section className="mt-6 rounded-2xl border border-border bg-card p-8">
          <h2 className="font-serif text-2xl font-semibold">Notes</h2>
          <p className="mt-4 leading-relaxed text-muted">{r.notes}</p>
        </section>
      )}
    </div>
  );
}
