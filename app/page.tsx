import Link from "next/link";

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
      <div className="mt-10 flex items-center justify-center gap-4">
        <Link
          href="/submit"
          className="rounded-lg bg-accent px-6 py-3 font-medium text-background hover:bg-accent-strong"
        >
          Share a recipe
        </Link>
        <Link
          href="/browse"
          className="rounded-lg border border-border px-6 py-3 font-medium hover:border-muted"
        >
          Browse recipes
        </Link>
      </div>
    </div>
  );
}
