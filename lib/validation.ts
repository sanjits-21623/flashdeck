import { z } from "zod";

export type ActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const createDeckSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Give the deck a title.")
    .max(120, "Keep the title under 120 characters."),
  sourceNotes: z
    .string()
    .trim()
    .max(20_000, "That's more than 20,000 characters of notes."),
});

export const deleteCardSchema = z.object({
  cardId: z.uuid(),
  deckId: z.uuid(),
});
