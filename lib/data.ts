import { asc, desc, eq, sql } from "drizzle-orm";
import { cacheTag } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { cards, decks, type Card, type Deck } from "@/lib/schema";

const uuid = z.uuid();

export type DeckSummary = {
  id: string;
  title: string;
  createdAt: Date;
  cardCount: number;
};

export async function getDecks(): Promise<DeckSummary[]> {
  "use cache";
  cacheTag("decks");

  return db
    .select({
      id: decks.id,
      title: decks.title,
      createdAt: decks.createdAt,
      cardCount: sql<number>`count(${cards.id})`.mapWith(Number),
    })
    .from(decks)
    .leftJoin(cards, eq(cards.deckId, decks.id))
    .groupBy(decks.id)
    .orderBy(desc(decks.createdAt));
}

export async function getDeck(id: string): Promise<Deck | null> {
  "use cache";
  cacheTag(`deck-${id}`);

  // Postgres raises on a malformed uuid cast, so an unparseable id has to be
  // rejected before it reaches the query — otherwise /decks/garbage throws a
  // 500 through error.tsx instead of rendering not-found.
  if (!uuid.safeParse(id).success) return null;

  const [deck] = await db.select().from(decks).where(eq(decks.id, id));
  return deck ?? null;
}

export async function getCards(deckId: string): Promise<Card[]> {
  "use cache";
  cacheTag(`deck-${deckId}`);

  if (!uuid.safeParse(deckId).success) return [];

  return db
    .select()
    .from(cards)
    .where(eq(cards.deckId, deckId))
    .orderBy(asc(cards.position));
}
