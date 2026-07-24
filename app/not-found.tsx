import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
      <h1 className="text-lg font-semibold tracking-tight">Deck not found</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        That deck doesn&apos;t exist, or it was deleted.
      </p>
      <Link
        href="/"
        className="mt-5 inline-block text-sm underline underline-offset-4"
      >
        Back to your decks
      </Link>
    </div>
  );
}
