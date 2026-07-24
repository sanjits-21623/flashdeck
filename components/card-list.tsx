"use client";

import { useOptimistic } from "react";
import { deleteCard } from "@/lib/actions";
import type { Card } from "@/lib/schema";

export function CardList({ cards, deckId }: { cards: Card[]; deckId: string }) {
  const [optimisticCards, removeOptimistic] = useOptimistic(
    cards,
    (current: Card[], removedId: string) =>
      current.filter((card) => card.id !== removedId),
  );

  async function onDelete(formData: FormData) {
    removeOptimistic(String(formData.get("cardId")));
    await deleteCard(formData);
  }

  if (optimisticCards.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
        This deck has no cards yet.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {optimisticCards.map((card) => (
        <li
          key={card.id}
          className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 p-4 dark:border-slate-800"
        >
          <div className="min-w-0">
            <p className="font-medium">{card.front}</p>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              {card.back}
            </p>
          </div>
          <form action={onDelete}>
            <input type="hidden" name="cardId" value={card.id} />
            <input type="hidden" name="deckId" value={deckId} />
            <button
              type="submit"
              aria-label={`Delete card: ${card.front}`}
              className="shrink-0 rounded-md px-2 py-1 text-xs text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
            >
              Delete
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
