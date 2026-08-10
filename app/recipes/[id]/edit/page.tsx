import { notFound } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import type { Recipe } from "@/lib/types";
import EditForm from "./form";

// Always load the current values — editing a stale copy would silently
// revert whatever someone else changed.
export const dynamic = "force-dynamic";

export default async function EditRecipePage({ params }: PageProps<"/recipes/[id]/edit">) {
  const { id } = await params;
  const supabase = getSupabase();
  if (!supabase) notFound();

  const { data, error } = await supabase.from("recipes").select("*").eq("id", id).single();
  if (error || !data) notFound();

  return <EditForm recipe={data as Recipe} />;
}
