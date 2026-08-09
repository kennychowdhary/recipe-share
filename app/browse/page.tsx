import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import type { Recipe } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BrowsePage() {
  const supabase = getSupabase();

  if (!supabase) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-24 text-center">
        <h1 className="font-serif text-3xl font-semibold">Almost there</h1>
        <p className="mx-auto mt-4 max-w-md text-muted">
          Supabase isn&apos;t configured yet. Copy <code>.env.example</code> to{" "}
          <code>.env.local</code> and fill in your project URL and anon key,
          then restart the dev server.
        </p>
      </div>
    );
  }

  const { data: recipes, error } = await supabase
    .from("recipes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-24 text-center">
        <h1 className="font-serif text-3xl font-semibold">Couldn&apos;t load recipes</h1>
        <p className="mt-4 text-muted">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-16">
      <h1 className="font-serif text-4xl font-semibold">Browse recipes</h1>
      <p className="mt-3 text-muted">
        {recipes.length === 0
          ? "Nothing here yet — be the first to share one."
          : `${recipes.length} recipe${recipes.length === 1 ? "" : "s"} and counting.`}
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(recipes as Recipe[]).map((r) => (
          <Link
            key={r.id}
            href={`/recipes/${r.id}`}
            className="rounded-2xl border border-border bg-card p-6 transition hover:border-muted"
          >
            <div className="text-sm text-muted">
              {r.cuisine} · {r.course}
            </div>
            <h2 className="mt-2 font-serif text-xl font-semibold">{r.name}</h2>
            <div className="mt-3 text-sm text-muted">
              {r.prep_minutes + r.cook_minutes} min · serves {r.servings}
              {r.author ? ` · by ${r.author}` : ""}
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
          </Link>
        ))}
      </div>
    </div>
  );
}
