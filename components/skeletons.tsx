const shimmer = "animate-pulse rounded bg-slate-200 dark:bg-slate-800";

export function DeckGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }, (_, i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-200 p-5 dark:border-slate-800"
        >
          <div className={`h-5 w-2/3 ${shimmer}`} />
          <div className={`mt-3 h-3 w-16 ${shimmer}`} />
        </div>
      ))}
    </div>
  );
}

export function DeckHeaderSkeleton() {
  return (
    <div>
      <div className={`h-8 w-64 ${shimmer}`} />
      <div className={`mt-3 h-4 w-full max-w-2xl ${shimmer}`} />
    </div>
  );
}

export function CardListSkeleton() {
  return (
    <ul className="space-y-3">
      {Array.from({ length: 6 }, (_, i) => (
        <li
          key={i}
          className="rounded-lg border border-slate-200 p-4 dark:border-slate-800"
        >
          <div className={`h-4 w-3/4 ${shimmer}`} />
          <div className={`mt-2.5 h-3 w-1/2 ${shimmer}`} />
        </li>
      ))}
    </ul>
  );
}
