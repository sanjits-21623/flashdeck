# CLAUDE.md — Deck

An AI flashcard builder. Paste notes → split into cards → study them.

This is a **portfolio project built in one sitting (~4.5 hours) to demonstrate senior-level Next.js App Router competence, deployed live on Vercel.** Every file in this repo is going to be read by a reviewer, and the deployed URL is going to be clicked. Legibility of the architecture matters more than feature count. When forced to choose between "one more feature" and "the existing code reads cleanly and the deploy is green," choose the latter.

---

## STOP — read this before writing any code

Your training data on Next.js is likely stale. Next.js 16 changed several APIs that you will otherwise get wrong from memory. Before the first line of code:

```bash
npm show next version        # confirm 16.2.x or later
```

Then fetch and read these two pages. Do not skip this — I will be able to tell:

- `https://nextjs.org/docs/app/guides/upgrading/version-16`
- `https://nextjs.org/docs/app/api-reference/directives/use-cache`

Any Next.js docs URL accepts a `.md` suffix for a plain-markdown version.

### Version facts that override your priors

| Wrong (pre-16) | Correct (16.x) |
|---|---|
| `middleware.ts`, `export function middleware()` | `proxy.ts`, `export function proxy()` — Node runtime only, no Edge |
| `unstable_cache(fn, keys, opts)` | `'use cache'` directive + `cacheTag()` + `cacheLife()` |
| `revalidateTag('foo')` | `revalidateTag('foo', 'max')` — single-arg form is a TS error |
| `revalidatePath` after a mutation | `updateTag('foo')` for read-your-writes |
| `experimental: { ppr: true }` | `cacheComponents: true` |
| `params.id`, `searchParams.q` | `const { id } = await params` — both are Promises |
| `next lint` | `eslint .` |

If any of these conflict with what you find in the live docs, **the docs win** — tell me about the discrepancy rather than silently picking one.

---

## Stack — do not substitute

- Next.js 16.2.x, App Router, TypeScript strict, Turbopack (default, don't configure it)
- React 19.2
- Tailwind v4
- **Neon Postgres** via the Vercel Marketplace integration — `@neondatabase/serverless` + `drizzle-orm/neon-http`
- Drizzle ORM + `drizzle-kit` (dev)
- `tsx` (dev) for running the seed script
- Zod for all server-side input validation
- Anthropic SDK (`@anthropic-ai/sdk`) for card generation
- **Deployment target: Vercel.** Node 20.9+.

No auth. No test framework. No state management library. No component library. No `useEffect` data fetching. If you think the project needs one of these, say so and stop — don't add it.

### Why Postgres and not SQLite

Vercel's filesystem is ephemeral and per-invocation. A `better-sqlite3` file would appear to work locally, build fine, and then silently reset on every request in production — the worst possible failure mode for a demo someone else is clicking. Neon is a managed Postgres that the Vercel integration provisions and wires up automatically. Do not propose SQLite, LibSQL files, JSON files, or in-memory stores as a shortcut.

---

## Architecture rules (non-negotiable)

1. **Server Components are the default.** `'use client'` appears in at most five files, all leaves. It must never appear in a `layout.tsx` or a top-level `page.tsx`.
2. **All data reads go through `lib/data.ts`.** Every exported function there starts with `'use cache'` and calls `cacheTag()`. Entity-scoped reads must include the entity id in the tag (`deck-${id}`, never a shared `deck` tag).
3. **All writes go through Server Actions in `lib/actions.ts`.** Every action validates its `FormData` with a Zod schema before touching the database, and calls `updateTag()` on the affected tags before returning or redirecting.
4. **One Route Handler exists, and only because Server Actions cannot stream tokens.** `app/api/generate/route.ts` returns a `ReadableStream`. If you find yourself writing a second Route Handler, it should have been a Server Action.
5. **`proxy.ts` stays thin.** One cheap thing: attach an `x-request-id` header. No database calls, no JWT verification, no business logic. This is a deliberate demonstration that I know what the file is for.
6. **Loading states are `<Suspense>` boundaries with real skeletons**, sized to match the content they replace. No full-page spinners, no `loading` booleans in client state.
7. **Nothing touches the database at build time.** No seeding in `postbuild`, no top-level DB calls in module scope. Vercel builds must succeed against an empty or unreachable database.

---

## Target file map

Build toward exactly this. Deviations need a one-line justification in your response.

```
app/
├── layout.tsx                        # accepts { children, modal } — parallel route slot
├── page.tsx                          # deck grid (RSC, cached)
├── loading.tsx
├── error.tsx                         # 'use client', has reset()
├── not-found.tsx
├── globals.css
├── @modal/
│   ├── default.tsx                   # returns null
│   └── (.)decks/[id]/page.tsx        # intercepted deck preview → renders in <Modal>
├── decks/
│   ├── new/page.tsx                  # RSC shell + <NewDeckForm />
│   └── [id]/
│       ├── page.tsx                  # full deck page, generateMetadata, notFound()
│       ├── loading.tsx
│       └── study/page.tsx            # RSC shell + <StudySession />
└── api/generate/route.ts             # streaming card generation, exports maxDuration

components/
├── modal.tsx                         # 'use client' — <dialog>, router.back() on dismiss
├── new-deck-form.tsx                 # 'use client' — useActionState
├── submit-button.tsx                 # 'use client' — useFormStatus (SEPARATE component)
├── card-list.tsx                     # 'use client' — useOptimistic on delete
├── study-session.tsx                 # 'use client' — keyboard nav
└── skeletons.tsx                     # RSC

lib/
├── db.ts                             # neon-http drizzle client
├── schema.ts                         # drizzle pg table definitions
├── validation.ts                     # zod schemas
├── data.ts                           # 'use cache' reads
├── actions.ts                        # 'use server' writes
└── ai.ts                             # anthropic client + prompt

db/
└── seed.ts                           # run manually via `npm run seed`, never in CI

drizzle/                              # generated migration SQL — COMMIT THIS
proxy.ts                              # NOT middleware.ts
drizzle.config.ts
next.config.ts                        # cacheComponents: true
.env.example                          # committed
.env.local                            # gitignored
```

No `vercel.json`. Vercel auto-detects Next.js, and function duration is configured with a route-level `maxDuration` export instead.

---

## Data model

Drizzle `pg-core`:

```
decks:  id (uuid, pk, defaultRandom) | title (text, notNull) | sourceNotes (text)
        | createdAt (timestamp with tz, defaultNow)
cards:  id (uuid, pk, defaultRandom) | deckId (uuid, fk → decks.id, onDelete cascade)
        | front (text, notNull) | back (text, notNull) | position (integer, notNull)
```

`db/seed.ts` inserts three decks with 6–10 cards each so the deployed app is never empty when someone opens it. It must be idempotent — truncate before insert — and it needs `.env.local` loaded before any module evaluates, since it runs outside Next.js.

Load it with Node's `--env-file` flag, not an in-file `dotenv` call:

```json
"seed": "tsx --env-file=.env.local db/seed.ts"
```

Calling `config({ path: '.env.local' })` at the top of `seed.ts` does **not** work: ES imports are hoisted, so `lib/db.ts` evaluates — and calls `neon(process.env.DATABASE_URL!)` with `undefined` — before that line ever runs. `--env-file` populates the environment before module evaluation begins, so hoisting can't defeat it.

`drizzle.config.ts` is different and may keep using `dotenv`, because it reads `process.env.DATABASE_URL` inside the `defineConfig({...})` call rather than at import time.

The seed is run **manually, from my laptop, against the remote Neon database.** Never as part of a build.

---

## Build order

Work in phases. **After each phase, stop, run the verification command, and report back before continuing.** Do not chain phases together.

**Phase 0 — Deploy pipeline first (~30 min).** This goes before feature work on purpose. A deploy that first runs at hour 4 is a deploy that fails at hour 4.

1. `create-next-app@latest` (TypeScript, Tailwind, App Router, no `src/`).
2. `git init`, first commit, push to a new GitHub repo.
3. Import the repo on Vercel. Confirm the default "hello world" deploy is green and reachable.
4. Add Neon from the Vercel Marketplace integration and attach it to this project. It injects `DATABASE_URL` into all three environments automatically — do not hand-copy connection strings.
5. `vercel env pull .env.local` to get `DATABASE_URL` locally.
6. Add `ANTHROPIC_API_KEY` in the Vercel dashboard for Production, Preview, **and** Development, then pull again.
7. Write `.env.example` listing both variable names with empty values. Confirm `.env.local` is gitignored.

→ Verify: the Vercel URL loads, `cat .env.local` shows both variables, `npx tsc --noEmit` is clean. Report the deployed URL to me.

**Phase 1 — Data layer (~30 min).** `lib/schema.ts`, `lib/db.ts`, `drizzle.config.ts`, `drizzle-kit generate`, `drizzle-kit migrate` against Neon, `db/seed.ts`. Add `cacheComponents: true` to `next.config.ts`.
→ Verify: `npm run seed` succeeds; querying `decks` from a throwaway script returns 3 rows; `npm run build` succeeds; push and confirm the Vercel deploy is still green.

**Phase 2 — Read path (~45 min).** `lib/data.ts`, home grid, `decks/[id]`, `generateMetadata`, `notFound()`, `error.tsx`, Suspense + skeletons around the card list.
→ Verify: home renders 3 seeded decks; a bad id renders `not-found`; deck page streams the card list after the header. **Check this on the deployed URL, not just localhost** — this is the first phase where cache behavior can differ in production.

**Phase 3 — Write path (~45 min).** `lib/validation.ts`, `createDeck` + `deleteCard` actions, `NewDeckForm` with `useActionState`, separate `SubmitButton` with `useFormStatus`, `CardList` with `useOptimistic`.
→ Verify: submitting an empty title shows a field-level error without a page reload; deleting a card disappears instantly and stays deleted after refresh. Confirm on the deployed URL.

**Phase 4 — Intercepting modal (~45 min).** `@modal` slot, `default.tsx`, `(.)decks/[id]/page.tsx`, `Modal` client component.
→ Verify all four: (a) clicking a deck from the grid opens a modal, (b) the URL changes to `/decks/[id]`, (c) refreshing that URL renders the full page not the modal, (d) Escape and backdrop click both `router.back()`.

**Phase 5 — Streaming AI (~45 min).** `lib/ai.ts`, `app/api/generate/route.ts` returning a `ReadableStream`, client consumer that renders cards as they arrive. Add `export const maxDuration = 60;` to the route.
→ Verify: cards appear progressively, not all at once — **on the deployed URL specifically.** Streaming through Vercel's edge network behaves differently from `next dev`; a stream that works locally and buffers in production is a known failure and must be caught here.

**Phase 6 — Polish (~30 min).** `proxy.ts`, README with the live URL, final deploy.

### Budget rule

If Phase 5 isn't working within 45 minutes, **cut it.** Replace AI generation with a deterministic `splitIntoCards()` that splits on blank lines and `Q:`/`A:` prefixes, keep the same function signature, and note the tradeoff in the README.

The priority order when time runs short is: **green deploy > clean RSC boundary > working intercepting route > AI streaming.** A live URL with a hardcoded splitter beats a localhost demo with token streaming. Never sacrifice a working deploy to save a feature.

---

## Code conventions

- Named exports everywhere except `page.tsx` / `layout.tsx` / `route.ts`, which need defaults.
- `@/` path alias for all internal imports, including in `db/seed.ts`. No relative `../../` chains, no `.ts` extensions in import specifiers, no `allowImportingTsExtensions` in tsconfig.
- Explicit prop types on every component. No `any`, no `React.FC`.
- Server Actions return a typed `ActionState`, never throw for validation failures. Throw only for genuinely exceptional errors so `error.tsx` catches them.
- `params: Promise<{ id: string }>` and `await` it. Always.
- Tailwind utilities inline. No `@apply`, no separate CSS modules.
- Comments explain *why*, not *what*. Three or four comments in the whole repo is a reasonable target — but do add one above the `@modal` directory, one above `proxy.ts`, and one above the `maxDuration` export, since those are the parts a reviewer will pause on.

---

## Forbidden

- `'use client'` in `app/layout.tsx` or `app/page.tsx`
- `useEffect` + `fetch` for initial data
- `middleware.ts`, `unstable_cache`, `getServerSideProps`, the Pages Router
- `revalidatePath` as a reflex — use tags
- `useFormStatus` in the same component as the `<form>` (it returns `pending: false` there; this is the classic mistake)
- API routes that duplicate what a Server Action does
- SQLite, local file databases, JSON stores, or module-scope in-memory state
- Database access during `next build`
- Committing `.env.local`, or hardcoding any connection string or API key
- `vercel.json` unless something genuinely can't be configured in code — ask first
- Barrel `index.ts` files
- `any`, `@ts-ignore`, `eslint-disable`
- Adding dependencies not listed in the stack section without asking

---

## Verification loop

After every phase:

```bash
npx tsc --noEmit
npx eslint .
npm run build
git push            # then confirm the Vercel deployment is green
```

All four clean before you tell me a phase is done. If `next build` warns about a component being unexpectedly dynamic under `cacheComponents`, that is a real signal — fix it, don't suppress it.

Do not tell me something works because the code looks correct. Run it, and from Phase 2 onward, check it on the deployed URL rather than only on localhost.

---

## Known gotchas

**Deployment**

- **Streaming is the thing most likely to break only in production.** If the AI route buffers on Vercel but streams locally, check that the response sets `Content-Type: text/event-stream` (or `text/plain`) and `Cache-Control: no-store`, and that nothing wraps the stream in a `.text()` or `.json()` call on the way out.
- **`maxDuration`.** Fluid compute is on by default; Hobby projects cap at 300s. `export const maxDuration = 60;` on the generate route is well inside that and plenty for card generation. Don't set it higher — a long ceiling turns a hung request into an invisible failure.
- **Env vars are per-environment.** A variable added only to Production will make Preview deploys fail with a confusing runtime error. Set all three, then `vercel env pull` again.
- **The Neon integration owns `DATABASE_URL`.** Don't also define it manually in project settings; you'll get a shadowing conflict that's tedious to debug.
- **Migrations do not run automatically.** Run `drizzle-kit migrate` from your laptop against Neon before the deploy that needs the new schema, not after.
- **Build cache lies.** If a change doesn't appear on the deployed URL, redeploy without cache before you start debugging application code.

**Application**

- **Zod version.** Zod 4 uses `z.flattenError(err)`; Zod 3 uses `err.flatten()`. Check `package.json` and use the matching API — don't guess.
- **`@modal/default.tsx` is mandatory.** Without it, hard-navigating to any route that the slot doesn't match 404s the whole page.
- **`(.)` vs `(..)`.** The interceptor lives at `app/@modal/(.)decks/[id]/` — the convention matches against *route segment* levels, not filesystem levels, and this is the most common place to get it wrong. If the modal isn't intercepting, this is why.
- **`neon-http` doesn't support transactions.** If you need one, switch that call to the `neon-serverless` websocket driver rather than faking it with sequential writes. For this project you shouldn't need one — say so if you think you do.

---

## README requirements

Write `README.md` last, ~25 lines, aimed at an engineer skimming for 90 seconds. It must cover:

1. **The live Vercel URL, on the first line.** This is the single most important character sequence in the repo.
2. One sentence on what the app does, and setup steps that work from a clean clone (`vercel env pull`, `drizzle-kit migrate`, `npm run seed`, `npm run dev`).
3. **Architecture decisions** — why the modal is an intercepting route, why exactly one Route Handler exists, why `proxy.ts` is deliberately thin, why reads are tag-cached rather than path-revalidated, and why Postgres rather than SQLite given the deployment target.
4. **Tradeoffs** — what was cut for the time budget and what would come next (auth, spaced repetition scheduling, tests, rate limiting on the generate route).

Section 3 is the most important text in the repo. It converts "he built a thing" into "he makes deliberate tradeoffs." Write it as prose, not bullets, and keep it honest — don't claim decisions that weren't made.

---

## Interaction

- Ask before deviating from the file map or the stack.
- Report at phase boundaries, and include the deployment status in the report. Don't disappear for an hour.
- If you're stuck for more than ~10 minutes on any single problem, stop and describe the blocker rather than trying a fifth variation.
- **Vercel CLI scope.** Read-only CLI commands are yours to run: `vercel login`, `vercel link`, `vercel env pull`, `vercel env ls`, `vercel ls`, `vercel inspect`, `vercel logs`. Everything that mutates project state is mine, not yours — `vercel deploy`, `vercel env add`, `vercel env rm`, `vercel project rm`, and the Neon marketplace integration. For those, tell me exactly what to click and wait for confirmation.
- **All deploys come from `git push`**, never from `vercel deploy`, so the deployed commit is always traceable to a SHA.
- If you think one of these rules is wrong, say so directly. Don't quietly work around it.