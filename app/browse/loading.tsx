export default function BrowseLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl animate-pulse px-6 py-16">
      <div className="h-10 w-64 rounded bg-border/60" />
      <div className="mt-4 h-4 w-44 rounded bg-border/60" />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-44 rounded-2xl border border-border bg-card" />
        ))}
      </div>
    </div>
  );
}
