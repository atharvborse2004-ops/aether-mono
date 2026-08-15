# Backend — working instructions

How to build against `BACKEND.md`. Rules that hold regardless of which step you
are on, then the steps themselves with the condition each must satisfy before it
counts as done.

Read `BACKEND.md` first for *why*. This file is *how*. `HANDOFF.md` is *where we
are*.

---

## 1. Rules that do not bend

These are the ones that are expensive to retrofit. Everything else is
negotiable.

1. **Money is integers in paise.** Column names say so: `amount_paise`,
   `balance_paise`, `unit_price_paise`. Format to rupees at the last moment, in
   the component. No float touches money at any layer.

2. **The ledger is append-only.** No `UPDATE`, no `DELETE`, ever. A mistake is
   corrected by writing a reversing entry, not by editing history. `balance` is
   a cache; if it disagrees with the sum of the ledger, the ledger is right and
   the balance is the bug.

3. **The client never sends a price, an amount, or an identity.** It sends
   `{ productId, qty }`, `{ consultantId, slot }`, `{ threadId, body }`. The
   server looks up price, cost and caller. If a request body contains a number
   the user benefits from, that is the bug.

4. **Authorize on the server for every `/pro` route.** The URL decides routing.
   It does not decide permission. `isPro` stays derived from the pathname in the
   client — do not add a role boolean — and the server checks the token
   independently.

5. **One write per user action.** A booking that debits the wallet and claims
   the slot is one transaction. Two calls means a wallet debited for a slot
   someone else took.

6. **Webhooks verify signatures, and are idempotent.** Razorpay retries. The
   same event arriving twice must credit once. Key on the provider's event id.

7. **Secrets never reach the client.** Model keys, payment secrets, service
   keys — server only. The Supabase anon key is the one thing that is meant to
   be public, and it is only safe because RLS is on. If RLS is off on a table,
   that table is public.

8. **Store the input, compute the derivation.** Birth details are stored;
   charts, horoscopes and panchang are computed. If you cache one, name the
   column so it is obviously a cache and can be thrown away.

---

## 2. Conventions

**Layout**

```
backend/
  BACKEND.md          architecture and decisions
  INSTRUCTIONS.md     this file
  HANDOFF.md          current state, decisions pending, next action
  schema/             .sql files, numbered, forward-only
  functions/          one folder per server function
  ephemeris/          the Python chart service
  seed/               static JSON lifted out of mock.js
```

Nothing here exists yet. Create each folder in the step that needs it, not
before.

**Naming** — tables plural and snake_case, columns snake_case, timestamps
`*_at`, money `*_paise`, booleans read as assertions (`verified`, not
`is_verified`).

**Errors** — a refusal returns a reason the UI can show. `spend()` already
toasts "Not enough balance"; the server's job is to make that string true, not
to invent a new vocabulary. Never fail silently and never return 200 on a
refusal.

**Migrations** — numbered SQL files, forward-only, never edited once applied.
`001_profiles.sql`, `002_wallet.sql`. A migration that has run on any real
database is history.

**Testing** — one runnable check per non-trivial path, and money paths are never
trivial. The check that matters most: apply the ledger from zero and assert it
equals the stored balance. If that passes, most of the wallet is right.

---

## 3. The steps

Each step lists what it delivers and the condition that proves it. Do not start
the next until the previous is live and the app uses it.

### Step 1 — Auth and profile

Phone OTP sign-in. `profiles` row with birth details written by onboarding.

*Front end:* the onboarding screens already collect name, date, time and place
into `birth` in the store. `setBirthField` keeps its signature; the last
onboarding step writes the row.

**Done when:** you sign in, close the tab, reopen, and your birth details are
still there.

### Step 2 — Wallet

`wallets` and `ledger`. Server functions for debit and credit. `spend()` and
`addMoney()` in the store become awaited calls with unchanged signatures.

**Done when:** devtools cannot change your balance, a debit larger than the
balance is refused by the server with the existing toast, and replaying the
ledger from zero reproduces the balance exactly.

### Step 3 — Payments in

Razorpay checkout, webhook endpoint, signature verification, credit on success.

**Done when:** a real ₹1 payment credits the wallet exactly once, and firing the
same webhook payload twice still credits once.

### Step 4 — Bookings

`availability`, `bookings`, atomic claim. Wallet debit and slot claim in one
transaction. `bookedSlots` becomes a query, not a constant.

**Done when:** two clients requesting the same slot at the same moment produce
one booking, one clear refusal, and no orphaned debit.

### Step 5 — Chat

`threads`, `messages`, realtime subscription. `ChatPanel` reads from the
database.

Fix the direction bug here: `chatThreads` is written from the seeker's side, so
a consultant currently sees threads named after herself with her own replies
marked as the other party. With real rows, sender identity is a column and the
bug cannot be expressed.

**Done when:** a message sent from the client side appears on the pro side
without a reload, attributed correctly on both.

### Step 6 — Charts

Python ephemeris service. `placements`, `chartHouses`, `days` and `panchang`
computed from the stored birth details.

**Done when:** two users with different birth details get different charts, and a
known birth time reproduces a chart you have verified against an independent
source. Pick that reference chart before you start.

### Step 7 — Ask AI

Server-side model proxy. `questionsLeft` enforced server-side; `questionPacks`
purchases credit it through the wallet.

**Done when:** the key is absent from the network tab, and a client that fakes
`questionsLeft` still gets refused at zero.

### Step 8 — Shop orders, live video, payouts

In that order. Orders freeze `unit_price_paise` at purchase. Live video is an
SDK integration. Payouts need consultant KYC first and a CA conversation before
the code.

---

## 4. Local development

Not set up yet. When it is, this section holds the actual commands. Until then,
the shape:

- Front end stays `npm run dev` on any free port, unchanged.
- The API runs separately; the client points at it through one env var so
  switching between local and deployed is a one-line change.
- Secrets live in `.env.local`, which is gitignored. There is a committed
  `.env.example` with the keys and no values.
- Never point a dev front end at production data. The first destructive mistake
  is always this one.

---

## 5. Keeping these files true

`HANDOFF.md` is the one that goes stale, because it is the one that describes
reality. It gets updated in the same session as the work, not later.

The rule for all three files lives in `CLAUDE.md` at the repo root. The short
version:

- A **decision** — stack, schema, a rule, a third-party choice — updates
  `BACKEND.md`.
- A **convention or a step change** updates `INSTRUCTIONS.md`.
- **Anything built, blocked, deferred or discovered** updates `HANDOFF.md`.

A document that describes the intent rather than the state is worse than no
document, because it is trusted. The front-end `README.md` is currently proof of
this: it describes a black-canvas monochrome build that the app stopped being
several redesigns ago.
