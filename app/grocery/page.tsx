import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import type { Recipe } from "@/lib/types";
import { buildGroceryList, decodePicks } from "@/lib/grocery";
import Checklist from "./checklist";

export const dynamic = "force-dynamic";

export default async function GroceryPage({
  searchParams,
}: PageProps<"/grocery">) {
  const { r } = await searchParams;
  const picks = decodePicks(typeof r === "string" ? r : undefined);

  if (picks.size === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-24 text-center">
        <h1 className="font-serif text-3xl font-semibold">Nothing picked yet</h1>
        <p className="mx-auto mt-4 max-w-md text-muted">
          Choose recipes from{" "}
          <Link href="/browse" className="text-accent hover:underline">
            browse
          </Link>{" "}
          or{" "}
          <Link href="/plan" className="text-accent hover:underline">
            plan a week
          </Link>{" "}
          and the grocery list builds itself.
        </p>
      </div>
    );
  }

  const supabase = getSupabase();
  if (!supabase) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-24 text-center">
        <h1 className="font-serif text-3xl font-semibold">Almost there</h1>
        <p className="mt-4 text-muted">Supabase isn&apos;t configured yet — see the README.</p>
      </div>
    );
  }

  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .in("id", [...picks.keys()]);

  if (error || !data?.length) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-24 text-center">
        <h1 className="font-serif text-3xl font-semibold">Couldn&apos;t load those recipes</h1>
        <p className="mt-4 text-muted">{error?.message ?? "They may have been deleted."}</p>
      </div>
    );
  }

  const recipes = data as Recipe[];
  const items = buildGroceryList(
    recipes.map((recipe) => ({
      name: recipe.name,
      ingredients: recipe.ingredients,
      multiplier: picks.get(recipe.id) ?? 1,
    })),
  );

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="font-serif text-4xl font-semibold">Grocery list</h1>
      <p className="mt-3 text-muted">
        {items.length} item{items.length === 1 ? "" : "s"} across{" "}
        {recipes.length} recipe{recipes.length === 1 ? "" : "s"}:{" "}
        {recipes
          .map((recipe) => {
            const n = picks.get(recipe.id) ?? 1;
            return n > 1 ? `${recipe.name} ×${n}` : recipe.name;
          })
          .join(", ")}
        .
      </p>

      <Checklist items={items} />
    </div>
  );
}
