import { db } from "@/lib/db";
import { cards, decks } from "@/lib/schema";

type SeedDeck = {
    title: string,
    sourceNotes: string,
    cards: [front: string, back: string][];
};

const SEED: SeedDeck[] = [
  {
    title: "Big-O Complexity",
    sourceNotes:
      "Binary search halves the search space each step. Hash lookups are constant time on average but linear in the worst case. Comparison sorts cannot beat n log n.",
    cards: [
      ["Binary search", "O(log n) — the search space halves every step"],
      ["Hash table lookup, average case", "O(1)"],
      ["Hash table lookup, worst case", "O(n) — every key collides into one bucket"],
      ["Lower bound for comparison sorts", "O(n log n)"],
      ["Merge sort space complexity", "O(n) — it needs a scratch array to merge into"],
      ["Quicksort worst case, and when", "O(n²) — already-sorted input with a naive pivot"],
      ["Why O(2n) is written O(n)", "Big-O drops constant factors; only growth rate matters"],
    ],
  },
  {
    title: "Cellular Respiration",
    sourceNotes:
      "Glycolysis happens in the cytoplasm and does not require oxygen. The Krebs cycle and electron transport chain both occur in the mitochondria.",
    cards: [
      ["Where does glycolysis occur?", "The cytoplasm"],
      ["Net ATP from glycolysis alone", "2 ATP"],
      ["Total ATP per glucose, aerobic", "About 36–38 ATP"],
      ["Final electron acceptor in the ETC", "Oxygen — it becomes water"],
      ["Where does the Krebs cycle run?", "The mitochondrial matrix"],
      ["What happens without oxygen?", "Fermentation — regenerates NAD+ so glycolysis can continue"],
    ],
  },
  {
    title: "Spanish Travel Phrases",
    sourceNotes:
      "Core phrases for asking directions, ordering food, and handling money while traveling.",
    cards: [
      ["Where is the train station?", "¿Dónde está la estación de tren?"],
      ["How much does it cost?", "¿Cuánto cuesta?"],
      ["I would like a coffee, please", "Quisiera un café, por favor"],
      ["I don't understand", "No entiendo"],
      ["Do you speak English?", "¿Habla inglés?"],
      ["The check, please", "La cuenta, por favor"],
      ["Can you help me?", "¿Puede ayudarme?"],
      ["I'm just looking, thanks", "Solo estoy mirando, gracias"],
    ],
  },
];

async function seed() {
    // Order matters: cards reference decks, so clear children before parents,
    await db.delete(cards);
    await db.delete(decks);

    for (const [index, deck] of SEED.entries()) {
      const [inserted] = await db
        .insert(decks)
        .values({
          title: deck.title,
          sourceNotes: deck.sourceNotes,
          createdAt: new Date(Date.now() - index * 86_400_000),
        })
        .returning({ id: decks.id });

    await db.insert(cards).values(
      deck.cards.map(([front, back], position) => ({
        deckId: inserted.id,
        front,
        back,
        position,
      })),
    );
  }

  console.log(`Seeded ${SEED.length} decks.`);
}

seed();
