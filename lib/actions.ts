"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { cards, decks } from "@/lib/schema";
import {
  createDeckSchema,
  deleteCardSchema,
  type ActionState,
} from "@/lib/validation";

export async function createDeck(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = createDeckSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    sourceNotes: String(formData.get("sourceNotes") ?? ""),
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const [deck] = await db
    .insert(decks)
    .values({
      title: parsed.data.title,
      sourceNotes: parsed.data.sourceNotes || null,
    })
    .returning({ id: decks.id });

  updateTag("decks");
  redirect(`/decks/${deck.id}`);
}

export async function deleteCard(formData: FormData): Promise<ActionState> {
  const parsed = deleteCardSchema.safeParse({
    cardId: String(formData.get("cardId") ?? ""),
    deckId: String(formData.get("deckId") ?? ""),
  });

  if (!parsed.success) {
    return { ok: false, message: "That card could not be identified." };
  }

  await db.delete(cards).where(eq(cards.id, parsed.data.cardId));

  updateTag(`deck-${parsed.data.deckId}`);
  updateTag("decks");

  return { ok: true };
}
