import { getSupabase } from "@/lib/supabase";
import type { Recipe } from "@/lib/types";
import RecipeGrid from "./grid";

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
      {recipes.length > 0 && <RecipeGrid recipes={recipes as Recipe[]} />}
    </div>
  );
}
