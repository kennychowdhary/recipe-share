"use client";

import { useState } from "react";
import Link from "next/link";
import type { Recipe } from "@/lib/types";
import { encodePicks, totalTime } from "@/lib/grocery";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

// A night is either a recipe id, or one of these — neither adds groceries.
const LEFTOVERS = "__leftovers__";
const OUT = "__out__";

export default function Planner({ recipes }: { recipes: Recipe[] }) {
  const [plan, setPlan] = useState<string[]>(Array(DAYS.length).fill(""));

  const cookedIds = plan.filter((v) => v && v !== LEFTOVERS && v !== OUT);
  const cookNights = cookedIds.length;
  const leftoverNights = plan.filter((v) => v === LEFTOVERS).length;
  const groceryHref = cookedIds.length
    ? `/grocery?r=${encodeURIComponent(encodePicks(cookedIds))}`
    : null;

  function setNight(i: number, value: string) {
    setPlan((prev) => prev.map((v, idx) => (idx === i ? value : v)));
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="font-serif text-4xl font-semibold">Plan your week</h1>
      <p className="mt-3 text-muted">
        Pick a recipe for the nights you&apos;re cooking. Leftover and
        eating-out nights don&apos;t add anything to the list.
      </p>

      {recipes.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-border bg-card p-8 text-muted">
          No recipes yet —{" "}
          <Link href="/submit" className="text-accent hover:underline">
            share one first
          </Link>{" "}
          and it&apos;ll show up here.
        </p>
      ) : (
        <>
          <div className="mt-10 space-y-3">
            {DAYS.map((day, i) => {
              const picked = recipes.find((r) => r.id === plan[i]);
              return (
                <div
                  key={day}
                  className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card px-6 py-4"
                >
                  <span className="w-28 font-medium">{day}</span>
                  <select
                    value={plan[i]}
                    onChange={(e) => setNight(i, e.target.value)}
                    className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
                  >
                    <option value="">— nothing planned —</option>
                    <option value={LEFTOVERS}>🍲 Leftovers</option>
                    <option value={OUT}>🍽️ Eating out / skip</option>
                    {recipes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                        {totalTime(r) ? ` · ${totalTime(r)} min` : ""}
                      </option>
                    ))}
                  </select>
                  {picked && (
                    <span className="text-sm text-muted">
                      serves {picked.servings}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card px-6 py-5">
            <p className="text-sm text-muted">
              {cookNights === 0
                ? "Nothing to cook yet."
                : `Cooking ${cookNights} night${cookNights === 1 ? "" : "s"}` +
                  (leftoverNights
                    ? `, leftovers ${leftoverNights} night${leftoverNights === 1 ? "" : "s"}`
                    : "") +
                  "."}
            </p>
            {groceryHref ? (
              <Link
                href={groceryHref}
                className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-background hover:bg-accent-strong"
              >
                Grocery list for the week →
              </Link>
            ) : (
              <span className="cursor-not-allowed rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-background opacity-40">
                Grocery list for the week →
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
