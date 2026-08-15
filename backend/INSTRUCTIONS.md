# Backend — working rules

Rules that hold regardless of which phase you are on. They are the most
expensive things in this project to retrofit, and unlike the documents in
`docs/` they are *rules*, so they cannot go stale.

- **What** to build: `docs/05-BACKEND-SCHEMA.md`
- **Why** it is shaped that way: `docs/02-TRD.md`
- **In what order**: `docs/06-IMPLEMENTATION.md`
- **What is actually built**: `HANDOFF.md` at the repo root

---

## 1. The rules that do not bend

**1. Money is integers in paise.** Column names say so: `amount_paise`,
`balance_paise`, `price_paise`. No float touches money at any layer. Format to
rupees in the component, at the last moment.

Rates are **basis points**, never percentages: `1800`, not `18` and not `0.18`.
The percent-or-fraction ambiguity is a permanent source of hundred-fold errors.

**2. The ledgers are append-only.** No `UPDATE`, no `DELETE`, ever, enforced by
trigger. A mistake is corrected by writing a reversing entry, not by editing
history. `wallets.balance_paise` is a cache; if it disagrees with the sum of the
ledger, the ledger is right and the balance is the bug.

**3. The client never sends a price, an amount, or an identity.** It sends
`{ consultantId, serviceId, startsAt }`, `{ productId, qty }`,
`{ threadId, body }`. The server looks up price, cost and caller. **If a request
body contains a number the user benefits from, that is the bug.**

**4. Authorize on the server, always.** The URL decides routing; it does not
decide permission. `isPro` stays derived from the pathname in the client — do not
add a role boolean — and the server scopes every query by the caller's own ID.

**5. One write per user action.** A booking that debits a wallet and claims a
slot is one transaction. Two calls means a wallet debited for a slot someone
else took.

**6. Webhooks verify signatures and are idempotent.** Providers retry. The same
event arriving twice must credit once, and the guarantee is a **unique index on
the provider's own identifier** — never an application-level "have I seen this?"
check, which races with its own write.

**7. Secrets never reach the client.** Model keys, payment secrets, service-role
keys: server only. The Supabase anon key is the one credential meant to be
public, and it is only safe because RLS is on. **A table with RLS disabled is a
public table.**

**8. Store the input, compute the derivation.** Birth details are stored; charts,
horoscopes and panchang are computed. If a derivation is ever cached, the column
name says `_cache` so it is obviously throwaway.

---

## 2. Conventions

### Layout

```
backend/
  INSTRUCTIONS.md     this file
  schema/             numbered .sql files, forward-only
  functions/          one folder per server function
  ephemeris/          the Python chart service
  seed/               static JSON lifted out of mock.js
```

Create each folder in the phase that needs it, not before.

### Naming

Tables plural and snake_case. Columns snake_case. Timestamps `*_at`. Money
`*_paise`. Rates `*_bps`. Booleans read as assertions — `verified`, not
`is_verified`. Caches carry `_cache` in the name.

### Migrations

Numbered SQL files, forward-only, **never edited once applied**. A migration that
has run against any real database is history.

### Errors

A refusal returns a reason the interface can show, in the app's voice — second
person, present tense, no hedging. `spend()` already toasts "Not enough
balance"; **the server's job is to make that string true**, not to invent a new
vocabulary. Never fail silently and never return 200 on a refusal without a
structured reason.

### Testing

One runnable check per non-trivial path, and **money paths are never trivial**.
The check that matters most: apply the ledger from zero and assert it equals the
stored balance. If that passes, most of the wallet is right.

There is no test framework in this repo yet. Do not add one to write a single
assertion.

### Verification

**`npm run build` passing proves almost nothing.** There is no linter and no type
checker, so an undefined identifier inside JSX compiles cleanly and throws at
runtime. It has shipped a blank screen twice. **Every phase ends with walking the
affected routes in a browser.**

---

## 3. Local development

Not set up yet. When it is, this section holds the actual commands. The shape:

- The front end stays `npm run dev` on any free port, unchanged.
- The API runs separately; the client points at it through **one env var**, so
  switching between local and deployed is a one-line change.
- Secrets live in `.env.local`, gitignored, with a committed `.env.example`
  carrying the keys and no values.
- **Never point a dev front end at production data.** The first destructive
  mistake is always this one.

---

## 4. Keeping the documents true

The rule lives in `CLAUDE.md` at the repo root. The short version:

- A **decision** — stack, schema, a third-party choice — updates the document
  that owns it. Each fact has exactly one home; the others link.
- **Anything built, blocked, deferred or discovered** updates `HANDOFF.md`.
- **Edit the existing section.** Do not append a changelog. If a decision
  reverses, rewrite it and say what it replaced.

A document describing intent as though it were state is worse than no document,
because it gets trusted. This repo has already paid for that lesson twice: a
design doc describing a build that had been replaced several redesigns earlier,
and a handoff listing a chat fix as done while the panel threw on first open.
