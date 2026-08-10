"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { COURSES, DIETARY_TAGS, courseLabel, type Ingredient, type Recipe } from "@/lib/types";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-4 py-3 placeholder:text-muted/60 focus:border-accent focus:outline-none";

export default function EditForm({ recipe }: { recipe: Recipe }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(recipe.name);
  const [cuisine, setCuisine] = useState(recipe.cuisine);
  const [course, setCourse] = useState(recipe.course);
  const [servings, setServings] = useState(String(recipe.servings));
  const [prepMinutes, setPrepMinutes] = useState(String(recipe.prep_minutes));
  const [cookMinutes, setCookMinutes] = useState(String(recipe.cook_minutes));
  const [ingredients, setIngredients] = useState<Ingredient[]>(recipe.ingredients);
  const [steps, setSteps] = useState<string[]>(recipe.steps);
  const [tags, setTags] = useState<string[]>(recipe.tags ?? []);
  const [notes, setNotes] = useState(recipe.notes);
  const [author, setAuthor] = useState(recipe.author);

  function updateIngredient(i: number, field: keyof Ingredient, value: string) {
    setIngredients((prev) => prev.map((ing, idx) => (idx === i ? { ...ing, [field]: value } : ing)));
  }

  async function save() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/recipes/${recipe.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        cuisine,
        course,
        servings: Number(servings),
        prep_minutes: Number(prepMinutes),
        cook_minutes: Number(cookMinutes),
        ingredients: ingredients.filter((i) => i.name.trim()),
        steps: steps.map((s) => s.trim()).filter(Boolean),
        tags,
        notes,
        author,
      }),
    });
    if (res.ok) {
      router.push(`/recipes/${recipe.id}`);
      router.refresh();
    } else {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? `Couldn't save (HTTP ${res.status}).`);
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm(`Delete "${recipe.name}"? This can't be undone.`)) return;
    setDeleting(true);
    setError(null);
    const res = await fetch(`/api/recipes/${recipe.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/browse");
      router.refresh();
    } else {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? `Couldn't delete (HTTP ${res.status}).`);
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <Link href={`/recipes/${recipe.id}`} className="text-sm text-muted hover:text-foreground">
        ← Back to the recipe
      </Link>

      <h1 className="mt-6 font-serif text-3xl font-semibold">Edit this recipe</h1>
      <p className="mt-2 text-muted">
        Everyone can edit — fix a typo, adjust an amount, add what you learned
        the second time you made it.
      </p>

      <div className="mt-8 space-y-6 rounded-2xl border border-border bg-card p-8">
        <div>
          <label className="mb-2 block text-sm font-medium">Recipe name</label>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">Cuisine</label>
            <input
              className={inputClass}
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Serves</label>
            <input
              className={inputClass}
              type="number"
              min={1}
              value={servings}
              onChange={(e) => setServings(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Course</label>
          <div className="flex flex-wrap gap-2">
            {COURSES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCourse(c)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  course === c
                    ? "bg-foreground text-background"
                    : "border border-border text-muted hover:border-muted"
                }`}
              >
                {courseLabel(c)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">Prep time (minutes)</label>
            <input
              className={inputClass}
              type="number"
              min={0}
              value={prepMinutes}
              onChange={(e) => setPrepMinutes(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Cook time (minutes)</label>
            <input
              className={inputClass}
              type="number"
              min={0}
              value={cookMinutes}
              onChange={(e) => setCookMinutes(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Ingredients</label>
          <div className="space-y-3">
            {ingredients.map((ing, i) => (
              <div key={i} className="flex gap-3">
                <input
                  className={`${inputClass} w-20`}
                  placeholder="2"
                  value={ing.quantity}
                  onChange={(e) => updateIngredient(i, "quantity", e.target.value)}
                />
                <input
                  className={`${inputClass} w-28`}
                  placeholder="cups"
                  value={ing.unit}
                  onChange={(e) => updateIngredient(i, "unit", e.target.value)}
                />
                <input
                  className={inputClass}
                  value={ing.name}
                  onChange={(e) => updateIngredient(i, "name", e.target.value)}
                />
                <button
                  type="button"
                  aria-label="Remove ingredient"
                  onClick={() => setIngredients((prev) => prev.filter((_, idx) => idx !== i))}
                  className="shrink-0 px-2 text-muted hover:text-foreground"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setIngredients((prev) => [...prev, { quantity: "", unit: "", name: "" }])}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:border-muted hover:text-foreground"
            >
              + Add ingredient
            </button>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Steps</label>
          <div className="space-y-3">
            {steps.map((s, i) => (
              <div key={i} className="flex gap-4">
                <span className="mt-3 font-serif text-xl font-semibold text-accent">{i + 1}</span>
                <textarea
                  className={`${inputClass} min-h-20`}
                  value={s}
                  onChange={(e) =>
                    setSteps((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))
                  }
                />
                <button
                  type="button"
                  aria-label="Remove step"
                  onClick={() => setSteps((prev) => prev.filter((_, idx) => idx !== i))}
                  className="shrink-0 px-2 text-muted hover:text-foreground"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setSteps((prev) => [...prev, ""])}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:border-muted hover:text-foreground"
            >
              + Add step
            </button>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Dietary tags</label>
          <div className="flex flex-wrap gap-2">
            {DIETARY_TAGS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() =>
                  setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
                }
                className={`rounded-full px-4 py-1.5 text-sm transition ${
                  tags.includes(t)
                    ? "bg-pill text-pill-fg"
                    : "border border-border text-muted hover:border-muted"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Notes &amp; substitutions</label>
          <textarea
            className={`${inputClass} min-h-28`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Name <span className="text-muted">(optional)</span>
          </label>
          <input
            className={inputClass}
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
        </div>

        {error && (
          <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between border-t border-border pt-6">
          <button
            type="button"
            onClick={remove}
            disabled={deleting || saving}
            className="rounded-lg border border-red-300 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete recipe"}
          </button>
          <div className="flex items-center gap-3">
            <Link
              href={`/recipes/${recipe.id}`}
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-muted hover:border-muted hover:text-foreground"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={save}
              disabled={saving || deleting || !name.trim()}
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-background hover:bg-accent-strong disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
