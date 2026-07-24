import { DeckGridSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <>
      <div className="h-8 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      <div className="mt-3 h-4 w-80 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      <div className="mt-6">
        <DeckGridSkeleton />
      </div>
    </>
  );
}
