"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { COURSES, DIETARY_TAGS, courseLabel, type Ingredient } from "@/lib/types";

const STEP_LABELS = ["The dish", "Ingredients", "Steps", "Extras", "Review"];

const inputClass =
  "w-full rounded-lg border border-border bg-background px-4 py-3 placeholder:text-muted/60 focus:border-accent focus:outline-none";

type ParsedRecipe = {
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
};

export default function SubmitPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showPaste, setShowPaste] = useState(true);
  const [pastedText, setPastedText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [course, setCourse] = useState<string>("Dinner");
  const [servings, setServings] = useState("4");
  const [prepMinutes, setPrepMinutes] = useState("");
  const [cookMinutes, setCookMinutes] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { quantity: "", unit: "", name: "" },
    { quantity: "", unit: "", name: "" },
    { quantity: "", unit: "", name: "" },
  ]);
  const [steps, setSteps] = useState<string[]>(["", ""]);
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [author, setAuthor] = useState("");

  const filledIngredients = ingredients.filter((i) => i.name.trim());
  const filledSteps = steps.map((s) => s.trim()).filter(Boolean);

  const canAdvance = [
    name.trim().length > 0,
    filledIngredients.length > 0,
    filledSteps.length > 0,
    true,
    true,
  ][step];

  async function parsePasted() {
    setParsing(true);
    setParseError(null);
    const res = await fetch("/api/parse-recipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: pastedText }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setParseError(body?.error ?? `Couldn't read that (HTTP ${res.status}).`);
      setParsing(false);
      return;
    }

    const r: ParsedRecipe = await res.json();
    setName(r.name ?? "");
    setCuisine(r.cuisine ?? "");
    if (COURSES.includes(r.course as (typeof COURSES)[number])) setCourse(r.course);
    setServings(String(r.servings || 4));
    setPrepMinutes(String(r.prep_minutes ?? ""));
    setCookMinutes(String(r.cook_minutes ?? ""));
    if (r.ingredients?.length) setIngredients(r.ingredients);
    if (r.steps?.length) setSteps(r.steps);
    setTags(
      (r.tags ?? []).filter((t) => DIETARY_TAGS.includes(t as (typeof DIETARY_TAGS)[number])),
    );
    setNotes(r.notes ?? "");

    setParsing(false);
    setShowPaste(false);
  }

  function updateIngredient(i: number, field: keyof Ingredient, value: string) {
    setIngredients((prev) =>
      prev.map((ing, idx) => (idx === i ? { ...ing, [field]: value } : ing)),
    );
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        cuisine,
        course,
        servings: Number(servings),
        prep_minutes: Number(prepMinutes),
        cook_minutes: Number(cookMinutes),
        ingredients: filledIngredients,
        steps: filledSteps,
        tags,
        notes,
        author,
      }),
    });
    if (res.ok) {
      const { id } = await res.json();
      router.push(`/recipes/${id}`);
    } else {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? `Something went wrong (HTTP ${res.status}).`);
      setSubmitting(false);
    }
  }

  if (showPaste) {
    return (
      <div className="mx-auto w-full max-w-2xl px-6 py-12">
        <div className="rounded-2xl border border-border bg-card p-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-pill px-3 py-1 text-xs text-pill-fg">
            ✨ Skip the typing
          </span>
          <h1 className="mt-4 font-serif text-3xl font-semibold">
            Paste your recipe — or a link to one
          </h1>
          <p className="mt-2 text-muted">
            However it&apos;s written — a text from a friend, scrawled notes,
            or a URL from your favorite recipe site. We&apos;ll fetch it, sort
            it into ingredients and steps, and you can fix anything we get
            wrong.
          </p>

          <textarea
            className={`${inputClass} mt-6 min-h-56`}
            placeholder={
              "e.g. https://www.seriouseats.com/olive-oil-cake-recipe\n\nor: Grandma's roast chicken. Serves 6.\n4 lb chicken, a head of garlic, 2 lemons, 3 tbsp butter…\nHeat oven to 425. Pat the chicken dry — that's the secret to crispy skin…"
            }
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
          />

          {parseError && (
            <p className="mt-4 rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">
              {parseError}
            </p>
          )}

          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowPaste(false)}
              className="text-sm text-muted hover:text-foreground"
            >
              I&apos;d rather type it in myself
            </button>
            <button
              type="button"
              onClick={parsePasted}
              disabled={parsing || !pastedText.trim()}
              className="inline-flex items-center gap-2.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-background hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70"
            >
              {parsing && (
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-90"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
              )}
              {parsing ? "Reading your recipe…" : "Sort it out for me →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <p className="flex items-start gap-2 text-sm text-muted">
        <span aria-hidden>🤝</span>
        Recipes are shared as written — no accounts, no tracking. Your name is
        optional.
      </p>

      <div className="mt-8">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-medium">
            Step {step + 1} of {STEP_LABELS.length}
          </span>
          <span className="text-muted">{STEP_LABELS[step]}</span>
        </div>
        <div className="mt-3 h-1 w-full rounded bg-border">
          <div
            className="h-1 rounded bg-accent transition-all"
            style={{ width: `${((step + 1) / STEP_LABELS.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-8">
        {step === 0 && (
          <>
            <h1 className="font-serif text-3xl font-semibold">
              Tell us about the dish
            </h1>
            <p className="mt-2 text-muted">
              The basics — what it is and how long it really takes.
            </p>
            <div className="mt-8 space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Recipe name
                </label>
                <input
                  className={inputClass}
                  placeholder="e.g. Weeknight dal"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Cuisine
                  </label>
                  <input
                    className={inputClass}
                    placeholder="e.g. Indian"
                    value={cuisine}
                    onChange={(e) => setCuisine(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Serves
                  </label>
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
                  <label className="mb-2 block text-sm font-medium">
                    Prep time (minutes)
                  </label>
                  <input
                    className={inputClass}
                    type="number"
                    min={0}
                    placeholder="e.g. 15"
                    value={prepMinutes}
                    onChange={(e) => setPrepMinutes(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Cook time (minutes)
                  </label>
                  <input
                    className={inputClass}
                    type="number"
                    min={0}
                    placeholder="e.g. 30"
                    value={cookMinutes}
                    onChange={(e) => setCookMinutes(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="font-serif text-3xl font-semibold">Ingredients</h1>
            <p className="mt-2 text-muted">
              Quantity, unit, ingredient. Leave rows blank if you don&apos;t
              need them.
            </p>
            <div className="mt-8 space-y-3">
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
                    placeholder="e.g. red lentils, rinsed"
                    value={ing.name}
                    onChange={(e) => updateIngredient(i, "name", e.target.value)}
                  />
                  <button
                    type="button"
                    aria-label="Remove ingredient"
                    onClick={() =>
                      setIngredients((prev) => prev.filter((_, idx) => idx !== i))
                    }
                    className="shrink-0 px-2 text-muted hover:text-foreground"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setIngredients((prev) => [
                    ...prev,
                    { quantity: "", unit: "", name: "" },
                  ])
                }
                className="rounded-lg border border-border px-4 py-2 text-sm text-muted hover:border-muted hover:text-foreground"
              >
                + Add ingredient
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="font-serif text-3xl font-semibold">Steps</h1>
            <p className="mt-2 text-muted">
              One action per step. Write it the way you&apos;d tell a friend.
            </p>
            <div className="mt-8 space-y-4">
              {steps.map((s, i) => (
                <div key={i} className="flex gap-4">
                  <span className="mt-3 font-serif text-xl font-semibold text-accent">
                    {i + 1}
                  </span>
                  <textarea
                    className={`${inputClass} min-h-20`}
                    placeholder={
                      i === 0
                        ? "e.g. Rinse the lentils until the water runs clear."
                        : "Next step…"
                    }
                    value={s}
                    onChange={(e) =>
                      setSteps((prev) =>
                        prev.map((v, idx) => (idx === i ? e.target.value : v)),
                      )
                    }
                  />
                  <button
                    type="button"
                    aria-label="Remove step"
                    onClick={() =>
                      setSteps((prev) => prev.filter((_, idx) => idx !== i))
                    }
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
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="font-serif text-3xl font-semibold">Extras</h1>
            <p className="mt-2 text-muted">
              All optional — tags, notes, and who to thank.
            </p>
            <div className="mt-8 space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Dietary tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_TAGS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() =>
                        setTags((prev) =>
                          prev.includes(t)
                            ? prev.filter((x) => x !== t)
                            : [...prev, t],
                        )
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
                <label className="mb-2 block text-sm font-medium">
                  Notes & substitutions
                </label>
                <textarea
                  className={`${inputClass} min-h-28`}
                  placeholder="e.g. Coconut milk works instead of cream. Freezes well."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Your name <span className="text-muted">(optional)</span>
                </label>
                <input
                  className={inputClass}
                  placeholder="e.g. Kavya"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                />
              </div>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h1 className="font-serif text-3xl font-semibold">
              Ready to share?
            </h1>
            <p className="mt-2 text-muted">One last look before it goes up.</p>
            <div className="mt-8 space-y-4 text-sm">
              <div className="rounded-lg border border-border p-4">
                <div className="text-muted">
                  {cuisine || "—"} · {courseLabel(course)}
                  {author ? ` · by ${author}` : ""}
                </div>
                <div className="mt-1 font-serif text-xl font-semibold">
                  {name}
                </div>
                <div className="mt-2 text-muted">
                  Prep {prepMinutes || 0} min · Cook {cookMinutes || 0} min ·
                  Serves {servings}
                </div>
              </div>
              <div className="rounded-lg border border-border p-4">
                <div className="font-medium">
                  {filledIngredients.length} ingredient
                  {filledIngredients.length === 1 ? "" : "s"}
                </div>
                <ul className="mt-2 space-y-1 text-muted">
                  {filledIngredients.map((ing, i) => (
                    <li key={i}>
                      {[ing.quantity, ing.unit, ing.name]
                        .filter(Boolean)
                        .join(" ")}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-border p-4">
                <div className="font-medium">
                  {filledSteps.length} step{filledSteps.length === 1 ? "" : "s"}
                </div>
                <ol className="mt-2 list-inside list-decimal space-y-1 text-muted">
                  {filledSteps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>
              </div>
            </div>
            {error && (
              <p className="mt-4 rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">
                {error}
              </p>
            )}
          </>
        )}

        <div className="mt-10 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-muted hover:border-muted hover:text-foreground disabled:invisible"
          >
            ← Back
          </button>
          {step < STEP_LABELS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canAdvance}
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-background hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continue →
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-background hover:bg-accent-strong disabled:opacity-60"
            >
              {submitting ? "Publishing…" : "Publish recipe"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
