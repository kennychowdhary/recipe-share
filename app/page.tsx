import Link from "next/link";

// The farm scene lives in the root layout now, behind every page.
export default function Home() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-24 text-center">
      <span className="inline-flex items-center gap-2 rounded-full bg-pill px-4 py-1.5 text-sm text-pill-fg">
        🍳 Home cooking, shared
      </span>
      <h1 className="mt-8 font-serif text-5xl font-semibold leading-tight">
        Recipes that <span className="text-accent">someone actually cooked.</span>
      </h1>
      <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted">
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
          className="rounded-lg border border-border bg-background/70 px-6 py-3 font-medium backdrop-blur hover:border-muted"
        >
          Browse recipes
        </Link>
        <Link
          href="/plan"
          className="rounded-lg border border-border bg-background/70 px-6 py-3 font-medium backdrop-blur hover:border-muted"
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
            className="rounded-2xl border border-border bg-card/90 p-5 backdrop-blur"
          >
            <div className="text-2xl">{icon}</div>
            <div className="mt-2 font-serif text-lg font-semibold">{title}</div>
            <p className="mt-1 text-sm leading-relaxed text-muted">{blurb}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
