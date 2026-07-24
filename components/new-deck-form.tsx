"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { createDeck } from "@/lib/actions";
import type { ActionState } from "@/lib/validation";

const initialState: ActionState = { ok: false };

export function NewDeckForm() {
  const [state, formAction] = useActionState(createDeck, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-5">
      <div>
        <label htmlFor="title" className="block text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          placeholder="Cellular Respiration"
          aria-invalid={Boolean(state.fieldErrors?.title)}
          aria-describedby={state.fieldErrors?.title ? "title-error" : undefined}
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 aria-[invalid=true]:border-red-500 dark:border-slate-700 dark:bg-slate-900"
        />
        {state.fieldErrors?.title && (
          <p id="title-error" className="mt-1.5 text-sm text-red-600">
            {state.fieldErrors.title[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="sourceNotes" className="block text-sm font-medium">
          Notes
        </label>
        <textarea
          id="sourceNotes"
          name="sourceNotes"
          rows={8}
          placeholder="Paste your notes here."
          aria-invalid={Boolean(state.fieldErrors?.sourceNotes)}
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 aria-[invalid=true]:border-red-500 dark:border-slate-700 dark:bg-slate-900"
        />
        {state.fieldErrors?.sourceNotes && (
          <p className="mt-1.5 text-sm text-red-600">
            {state.fieldErrors.sourceNotes[0]}
          </p>
        )}
      </div>

      <SubmitButton pendingLabel="Creating…">Create deck</SubmitButton>
    </form>
  );
}
