"use client";

import { useState } from "react";
import type { GroceryItem } from "@/lib/grocery";

function lineFor(item: GroceryItem): string {
  const amount = [item.quantity, item.unit].filter(Boolean).join(" ");
  return amount ? `${amount} ${item.name}` : item.name;
}

export default function Checklist({ items }: { items: GroceryItem[] }) {
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);

  function toggle(i: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  async function copyList() {
    const text = items
      .filter((_, i) => !checked.has(i))
      .map((item) => `- ${lineFor(item)}`)
      .join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <ul className="mt-10 divide-y divide-border rounded-2xl border border-border bg-card">
        {items.map((item, i) => (
          <li key={i}>
            <label className="flex cursor-pointer items-baseline gap-4 px-6 py-3.5 hover:bg-background/40">
              <input
                type="checkbox"
                checked={checked.has(i)}
                onChange={() => toggle(i)}
                className="translate-y-0.5 accent-[var(--accent)]"
              />
              <span className={checked.has(i) ? "text-muted line-through" : ""}>
                <span className="font-medium">{lineFor(item)}</span>
                {item.notes.length > 0 && (
                  <span className="text-muted"> · {item.notes.join("; ")}</span>
                )}
              </span>
              <span className="ml-auto shrink-0 text-xs text-muted">
                {item.recipes.length > 1
                  ? `${item.recipes.length} recipes`
                  : item.recipes[0]}
              </span>
            </label>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between text-sm">
        <span className="text-muted">
          {checked.size > 0
            ? `${checked.size} of ${items.length} in the cart`
            : "Tick things off as you shop — copy skips them."}
        </span>
        <button
          type="button"
          onClick={copyList}
          className="rounded-lg border border-border px-4 py-2 font-medium hover:border-muted"
        >
          {copied ? "Copied ✓" : "Copy remaining items"}
        </button>
      </div>
    </>
  );
}
