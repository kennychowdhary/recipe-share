import Link from "next/link";

// Fixed layout (not random) so the server and browser render identically.
// left/top in %, size in rem, tilt in degrees, drift duration in seconds.
const SCATTER: [number, number, number, number, number, string][] = [
  [4, 8, 3.2, -12, 11, "🍋"],
  [12, 78, 2.6, 8, 13, "🥑"],
  [7, 42, 2.2, -6, 9, "🍅"],
  [16, 16, 2.0, 14, 12, "🧄"],
  [24, 66, 2.4, -10, 10, "🌶️"],
  [21, 34, 1.8, 6, 14, "🍤"],
  [31, 12, 2.8, -4, 12, "🥖"],
  [36, 80, 2.1, 12, 9, "🍇"],
  [42, 30, 1.9, -14, 13, "🧀"],
  [47, 68, 2.5, 6, 11, "🍑"],
  [54, 10, 2.3, -8, 10, "🥕"],
  [58, 44, 1.8, 10, 14, "🌿"],
  [63, 76, 3.0, -6, 12, "🍜"],
  [69, 24, 2.2, 12, 9, "🍓"],
  [74, 58, 2.0, -12, 13, "🥟"],
  [79, 6, 2.6, 8, 11, "🫒"],
  [83, 40, 2.4, -6, 10, "🍊"],
  [88, 72, 3.1, 10, 12, "🥧"],
  [92, 20, 2.2, -10, 14, "🧅"],
  [95, 52, 1.9, 6, 9, "🍒"],
];

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      {/* Warm kitchen glow — the appetite comes from the color temperature. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            "radial-gradient(52rem 30rem at 22% 4%, rgba(233, 116, 81, 0.22), transparent 65%)",
            "radial-gradient(44rem 30rem at 82% 22%, rgba(240, 178, 76, 0.16), transparent 62%)",
            "radial-gradient(50rem 36rem at 50% 108%, rgba(163, 88, 130, 0.20), transparent 68%)",
          ].join(", "),
        }}
      />

      {/* Food drifting in the background. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 select-none">
        {SCATTER.map(([left, top, size, tilt, drift, emoji], i) => (
          <span
            key={i}
            className="absolute opacity-25 saturate-[1.35]"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              fontSize: `${size}rem`,
              animation: `food-float ${drift}s ease-in-out infinite`,
              animationDelay: `${(i % 7) * -1.7}s`,
              ["--tilt" as string]: `${tilt}deg`,
              filter: i % 3 === 0 ? "blur(1.5px)" : undefined,
            }}
          >
            {emoji}
          </span>
        ))}
      </div>

      <div className="relative mx-auto w-full max-w-3xl px-6 py-24 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-pill px-4 py-1.5 text-sm text-pill-fg">
          🍳 Home cooking, shared
        </span>
        <h1 className="mt-8 font-serif text-5xl font-semibold leading-tight [text-shadow:0_2px_24px_rgba(14,13,11,0.9)]">
          Recipes that <span className="text-accent">someone actually cooked.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted [text-shadow:0_1px_12px_rgba(14,13,11,0.9)]">
          Anyone can copy a recipe off the internet. This is for the ones you make
          on a weeknight — with the shortcuts, substitutions, and honest timings.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/submit"
            className="rounded-lg bg-accent px-6 py-3 font-medium text-background hover:bg-accent-strong"
          >
            Share a recipe
          </Link>
          <Link
            href="/browse"
            className="rounded-lg border border-border bg-background/60 px-6 py-3 font-medium backdrop-blur hover:border-muted"
          >
            Browse recipes
          </Link>
          <Link
            href="/plan"
            className="rounded-lg border border-border bg-background/60 px-6 py-3 font-medium backdrop-blur hover:border-muted"
          >
            Plan your week
          </Link>
        </div>

        <div className="mx-auto mt-20 grid max-w-2xl gap-4 text-left sm:grid-cols-3">
          {[
            ["✨", "Paste anything", "A link, a text from mom, scrawled notes — we sort it out."],
            ["📅", "Plan the month", "Leftover nights welcome. History included."],
            ["🛒", "Shop once", "One merged grocery list for the whole week."],
          ].map(([icon, title, blurb]) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-card/80 p-5 backdrop-blur"
            >
              <div className="text-2xl">{icon}</div>
              <div className="mt-2 font-serif text-lg font-semibold">{title}</div>
              <p className="mt-1 text-sm leading-relaxed text-muted">{blurb}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
