import type { Metadata } from "next";
import { NewDeckForm } from "@/components/new-deck-form";

export const metadata: Metadata = { title: "New deck" };

export default function NewDeckPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">New deck</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Give it a title and paste the notes you want to study.
      </p>
      <NewDeckForm />
    </>
  );
}
