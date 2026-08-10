import { getSupabase } from "@/lib/supabase";
import type { Recipe } from "@/lib/types";
import Planner from "./planner";

export const revalidate = 30;

export default async function PlanPage() {
  const supabase = getSupabase();

  if (!supabase) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-24 text-center">
        <h1 className="font-serif text-3xl font-semibold">Almost there</h1>
        <p className="mx-auto mt-4 max-w-md text-muted">
          Supabase isn&apos;t configured yet — see the README.
        </p>
      </div>
    );
  }

  const { data, error } = await supabase
    .from("recipes")
    .select("id, name, course, cuisine, prep_minutes, cook_minutes, servings")
    .order("name");

  if (error) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-24 text-center">
        <h1 className="font-serif text-3xl font-semibold">Couldn&apos;t load recipes</h1>
        <p className="mt-4 text-muted">{error.message}</p>
      </div>
    );
  }

  return <Planner recipes={(data ?? []) as Recipe[]} />;
}
