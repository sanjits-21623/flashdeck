import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { DeckGridSkeleton } from "@/components/skeletons";
import { getDecks } from "@/lib/data";

export default function Home() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Your decks</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Paste your notes, split them into flashcards, study them.
      </p>
      <div className="mt-6">
        <Suspense fallback={<DeckGridSkeleton />}>
          <DeckGrid />
        </Suspense>
      </div>
    </>
  );
}

async function DeckGrid() {
  // Defers the query to request time so `next build` never reaches the
  // database — a deploy must not depend on Neon being up. The read is still
  // cached; only the build-time prerender is given up.
  await connection();

  const decks = await getDecks();

  if (decks.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
        No decks yet.{" "}
        <Link href="/decks/new" className="underline underline-offset-4">
          Create your first one
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {decks.map((deck) => (
        <Link
          key={deck.id}
          href={`/decks/${deck.id}`}
          className="rounded-xl border border-slate-200 p-5 transition-colors hover:border-slate-400 dark:border-slate-800 dark:hover:border-slate-600"
        >
          <h2 className="font-medium tracking-tight">{deck.title}</h2>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {deck.cardCount} {deck.cardCount === 1 ? "card" : "cards"}
          </p>
        </Link>
      ))}
    </div>
  );
}
