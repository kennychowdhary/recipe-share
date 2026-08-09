"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Recipe } from "@/lib/types";
import { encodePicks } from "@/lib/grocery";

export default function RecipeGrid({ recipes }: { recipes: Recipe[] }) {
  const router = useRouter();
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function goToList() {
    router.push(`/grocery?r=${encodeURIComponent(encodePicks([...selected]))}`);
  }

  return (
    <>
      <div className="mt-8 flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setSelecting((s) => !s);
            setSelected(new Set());
          }}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            selecting
              ? "bg-foreground text-background"
              : "border border-border text-muted hover:border-muted hover:text-foreground"
          }`}
        >
          {selecting ? "Cancel" : "🛒 Make a grocery list"}
        </button>
        {selecting && (
          <button
            type="button"
            onClick={goToList}
            disabled={selected.size === 0}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-40"
          >
            Grocery list for {selected.size || "…"} recipe
            {selected.size === 1 ? "" : "s"} →
          </button>
        )}
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {recipes.map((r) => {
          const card = (
            <>
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm text-muted">
                  {r.cuisine} · {r.course}
                </div>
                {selecting && (
                  <span
                    aria-hidden
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded border text-xs ${
                      selected.has(r.id)
                        ? "border-accent bg-accent text-background"
                        : "border-border"
                    }`}
                  >
                    {selected.has(r.id) ? "✓" : ""}
                  </span>
                )}
              </div>
              <h2 className="mt-2 font-serif text-xl font-semibold">{r.name}</h2>
              <div className="mt-3 text-sm text-muted">
                {(r.prep_minutes ?? 0) + (r.cook_minutes ?? 0)} min · serves{" "}
                {r.servings}
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
            </>
          );

          const cardClass = `block rounded-2xl border bg-card p-6 transition ${
            selecting && selected.has(r.id)
              ? "border-accent"
              : "border-border hover:border-muted"
          }`;

          return selecting ? (
            <button
              key={r.id}
              type="button"
              onClick={() => toggle(r.id)}
              className={`${cardClass} cursor-pointer text-left`}
            >
              {card}
            </button>
          ) : (
            <Link key={r.id} href={`/recipes/${r.id}`} className={cardClass}>
              {card}
            </Link>
          );
        })}
      </div>
    </>
  );
}
