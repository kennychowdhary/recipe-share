"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { COURSE_ICONS, type Recipe } from "@/lib/types";
import { encodePicks, totalTime } from "@/lib/grocery";

// Special (non-recipe) entries a day can hold — they add nothing to groceries.
const LEFTOVERS = "__leftovers__";
const OUT = "__out__";

const STORAGE_KEY = "recipe-share-plan";

type Plan = Record<string, string[]>; // "2026-08-12" -> [recipeId, LEFTOVERS, ...]

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/** Weeks (Sun–Sat) covering the given month; days outside it are included
 * so the grid stays rectangular, and flagged via `inMonth`. */
function monthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay()); // back to Sunday

  const weeks: { date: Date; inMonth: boolean }[][] = [];
  const cursor = new Date(start);
  do {
    const week = Array.from({ length: 7 }, () => {
      const date = new Date(cursor);
      cursor.setDate(cursor.getDate() + 1);
      return { date, inMonth: date.getMonth() === month };
    });
    weeks.push(week);
  } while (cursor.getMonth() === month);
  return weeks;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June", "July",
  "August", "September", "October", "November", "December",
];

export default function Planner({ recipes }: { recipes: Recipe[] }) {
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [plan, setPlan] = useState<Plan>({});
  const [loaded, setLoaded] = useState(false);
  const [pickingFor, setPickingFor] = useState<string | null>(null);

  // The plan lives in this browser — no accounts to sign into.
  useEffect(() => {
    try {
      setPlan(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"));
    } catch {
      // Corrupt state: start fresh rather than crash.
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  }, [plan, loaded]);

  const weeks = useMemo(() => monthGrid(year, month), [year, month]);
  const byId = useMemo(() => new Map(recipes.map((r) => [r.id, r])), [recipes]);

  function shiftMonth(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  function addMeal(day: string, value: string) {
    setPlan((prev) => ({ ...prev, [day]: [...(prev[day] ?? []), value] }));
    setPickingFor(null);
  }

  function removeMeal(day: string, index: number) {
    setPlan((prev) => {
      const meals = (prev[day] ?? []).filter((_, i) => i !== index);
      const next = { ...prev };
      if (meals.length) next[day] = meals;
      else delete next[day];
      return next;
    });
  }

  function chipFor(value: string) {
    if (value === LEFTOVERS) return { icon: "🍲", label: "Leftovers" };
    if (value === OUT) return { icon: "🎉", label: "Out" };
    const recipe = byId.get(value);
    return {
      icon: COURSE_ICONS[recipe?.course ?? ""] ?? "🍴",
      label: recipe?.name ?? "(deleted recipe)",
    };
  }

  function weekGroceryHref(week: { date: Date }[]): string | null {
    const ids = week
      .flatMap(({ date }) => plan[isoDate(date)] ?? [])
      .filter((v) => v !== LEFTOVERS && v !== OUT && byId.has(v));
    return ids.length ? `/grocery?r=${encodeURIComponent(encodePicks(ids))}` : null;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-semibold">Meal calendar</h1>
          <p className="mt-3 text-muted">
            Tap a day to add meals — as many as the day deserves. 🍲 leftovers
            and 🎉 nights out add nothing to the shopping.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
            className="rounded-lg border border-border px-3 py-2 hover:border-muted"
          >
            ‹
          </button>
          <span className="w-44 text-center font-serif text-xl font-semibold">
            {MONTHS[month]} {year}
          </span>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            aria-label="Next month"
            className="rounded-lg border border-border px-3 py-2 hover:border-muted"
          >
            ›
          </button>
        </div>
      </div>

      <div className="mt-8 hidden grid-cols-[repeat(7,1fr)_auto] gap-2 text-xs font-medium text-muted sm:grid">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="px-2">
            {d}
          </div>
        ))}
        <div className="w-10" />
      </div>

      <div className="mt-2 space-y-2">
        {weeks.map((week, wi) => {
          const groceryHref = weekGroceryHref(week);
          return (
            <div key={wi} className="grid grid-cols-2 gap-2 sm:grid-cols-[repeat(7,1fr)_auto]">
              {week.map(({ date, inMonth }) => {
                const day = isoDate(date);
                const meals = plan[day] ?? [];
                const isToday = isoDate(today) === day;
                return (
                  <div
                    key={day}
                    className={`min-h-28 rounded-xl border p-2 ${
                      isToday
                        ? "border-accent bg-card"
                        : inMonth
                          ? "border-border bg-card"
                          : "border-transparent bg-card/40 opacity-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${isToday ? "font-bold text-accent" : "text-muted"}`}>
                        {date.getDate()}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPickingFor(day)}
                        aria-label={`Add a meal on ${day}`}
                        className="rounded px-1.5 text-sm text-muted hover:bg-background hover:text-foreground"
                      >
                        +
                      </button>
                    </div>
                    <div className="mt-1 space-y-1">
                      {meals.map((value, i) => {
                        const chip = chipFor(value);
                        return (
                          <div
                            key={`${value}-${i}`}
                            className="group flex items-center gap-1.5 rounded-lg bg-background px-2 py-1 text-xs"
                            title={chip.label}
                          >
                            <span aria-hidden>{chip.icon}</span>
                            <span className="truncate">{chip.label}</span>
                            <button
                              type="button"
                              onClick={() => removeMeal(day, i)}
                              aria-label={`Remove ${chip.label}`}
                              className="ml-auto hidden shrink-0 text-muted hover:text-foreground group-hover:block"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <div className="col-span-2 flex items-center sm:col-span-1 sm:w-10 sm:justify-center">
                {groceryHref ? (
                  <Link
                    href={groceryHref}
                    title="Grocery list for this week"
                    className="rounded-lg border border-border px-2.5 py-2 text-sm hover:border-accent"
                  >
                    🛒
                  </Link>
                ) : (
                  <span className="px-2.5 py-2 text-sm opacity-20" aria-hidden>
                    🛒
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-muted">
        Your plan is saved in this browser. The 🛒 next to each week builds
        that week&apos;s grocery list — cook something twice, buy it twice.
      </p>

      {pickingFor && (
        <div
          className="fixed inset-0 z-10 grid place-items-center bg-background/80 p-6"
          onClick={() => setPickingFor(null)}
        >
          <div
            className="max-h-[70vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-serif text-xl font-semibold">
              What&apos;s cooking on {pickingFor}?
            </h2>
            <div className="mt-4 space-y-1.5">
              <button
                type="button"
                onClick={() => addMeal(pickingFor, LEFTOVERS)}
                className="flex w-full items-center gap-3 rounded-lg border border-border px-4 py-2.5 text-left text-sm hover:border-muted"
              >
                🍲 Leftovers
              </button>
              <button
                type="button"
                onClick={() => addMeal(pickingFor, OUT)}
                className="flex w-full items-center gap-3 rounded-lg border border-border px-4 py-2.5 text-left text-sm hover:border-muted"
              >
                🎉 Eating out / skip
              </button>
              {recipes.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => addMeal(pickingFor, r.id)}
                  className="flex w-full items-center gap-3 rounded-lg border border-border px-4 py-2.5 text-left text-sm hover:border-muted"
                >
                  <span aria-hidden>{COURSE_ICONS[r.course] ?? "🍴"}</span>
                  <span className="min-w-0 flex-1 truncate">{r.name}</span>
                  {totalTime(r) > 0 && (
                    <span className="shrink-0 text-xs text-muted">{totalTime(r)} min</span>
                  )}
                </button>
              ))}
              {recipes.length === 0 && (
                <p className="text-sm text-muted">
                  No recipes yet —{" "}
                  <Link href="/submit" className="text-accent hover:underline">
                    share one
                  </Link>{" "}
                  first.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
