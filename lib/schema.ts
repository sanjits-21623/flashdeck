import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const decks = pgTable("decks", {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    sourceNotes: text("source_notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
});

export const cards = pgTable("cards", {
    id: uuid("id").primaryKey().defaultRandom(),
    deckId: uuid("deck_id")
      .notNull()
      .references(() => decks.id, { onDelete: "cascade" }),
    front: text("front").notNull(),
    back: text("back").notNull(),
    position: integer("position").notNull(),
});

export type Deck = typeof decks.$inferSelect;
export type Card = typeof cards.$inferSelect;