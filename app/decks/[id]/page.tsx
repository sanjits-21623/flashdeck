import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CardListSkeleton } from "@/components/skeletons";
import { getCards, getDeck } from "@/lib/data";

type DeckPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: DeckPageProps): Promise<Metadata> {
  const { id } = await params;
  const deck = await getDeck(id);

  return { title: deck?.title ?? "Deck not found" };
}

export default async function DeckPage({ params }: DeckPageProps) {
  const { id } = await params;
  const deck = await getDeck(id);

  if (!deck) notFound();

  return (
    <>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{deck.title}</h1>
        {deck.sourceNotes && (
          <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            {deck.sourceNotes}
          </p>
        )}
      </header>
      <div className="mt-8">
        <Suspense fallback={<CardListSkeleton />}>
          <CardSection deckId={id} />
        </Suspense>
      </div>
    </>
  );
}

async function CardSection({ deckId }: { deckId: string }) {
  const cards = await getCards(deckId);

  if (cards.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
        This deck has no cards yet.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {cards.map((card) => (
        <li
          key={card.id}
          className="rounded-lg border border-slate-200 p-4 dark:border-slate-800"
        >
          <p className="font-medium">{card.front}</p>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            {card.back}
          </p>
        </li>
      ))}
    </ul>
  );
}
