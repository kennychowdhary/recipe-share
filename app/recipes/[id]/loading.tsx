export default function RecipeLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl animate-pulse px-6 py-16">
      <div className="h-4 w-24 rounded bg-border/60" />
      <div className="mt-8 h-3 w-40 rounded bg-border/60" />
      <div className="mt-3 h-10 w-3/4 rounded bg-border/60" />
      <div className="mt-6 flex gap-4">
        <div className="h-4 w-20 rounded bg-border/60" />
        <div className="h-4 w-20 rounded bg-border/60" />
        <div className="h-4 w-20 rounded bg-border/60" />
      </div>
      <div className="mt-10 h-56 rounded-2xl border border-border bg-card" />
      <div className="mt-6 h-72 rounded-2xl border border-border bg-card" />
    </div>
  );
}
