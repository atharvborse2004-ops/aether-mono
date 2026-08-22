# 06 — Implementation plan

The order things get built, and the condition each must satisfy before it counts
as done.

**This document owns sequence.** It names tables and endpoints but defines
neither — those are `05-BACKEND-SCHEMA.md` and `02-TRD.md`. Prices and scope are
`01-PRD.md`. The engineering rules every phase obeys are
`backend/INSTRUCTIONS.md`.

---

## How to read a phase

Each phase is an **end-to-end vertical slice**: schema, server, and the front-end
change that makes it visible, shipped together. Not "all the tables, then all the
functions".

Each carries a **done condition that fails if the logic breaks.** "It works when
I click it" is not one. Where the condition is a test, it is the smallest test
that would catch the failure.

**Every phase ends with walking the affected routes in a browser.** `npm run
build` passing is not evidence — the project has no linter and no type checker,
and an undefined identifier inside JSX compiles cleanly and throws at runtime.
That has shipped a blank screen twice.

---

## Phase 0 — Pre-work

Small repairs, each cheaper before it reaches a database than after.

| Item | Status |
|---|---|
| Fix the `ChatPanel` crash — `isPro` used but never defined, in two places | **Done** |
| Split deity `credit` into artist / licence / source, with one renderer | **Done** |
| Flag the two incomplete Bhaktamar verses rather than reconstructing them | **Done** |
| Reconcile the uncommitted working tree | **Done** |
| Walk every route in a browser, including the messages knob | **Owed** — blocked on tooling for three sessions. See `HANDOFF.md` §4 |
| Choose the ephemeris reference chart | **Owed** — blocks phase 7, not phase 1 |

**Done when:** the tree is clean, the app has been walked end to end, and no
route throws.

---

## Phase 1 — Auth and profile

The smallest slice with real value: the app stops forgetting you.

**Build** — Supabase project. `profiles` with birth details, `legacy_id`, and the
IANA-zone columns. Phone OTP. RLS on `profiles`.

**Front end** — the four onboarding questions write a row at the end of the flow
instead of evaporating. Profile, Chart and Horoscope switch from the fixed mock
user to the signed-in one. A session check on load.

**This closes a real gap**: birth details are currently collected and then never
used — type a different date and nothing downstream changes.

**Done when:** you sign in, close the tab, reopen it, and your birth details are
still there. And a second account sees its own details, not yours.

**Watch:** `birth_time` is naive local plus an IANA zone, never a timestamp and
never a stored offset. Parsing `'14 November 1996'` and `'04:35 AM'` into real
date and time values happens here. Getting this wrong is invisible.

---

## Phase 2 — Wallet, and the async conversion

**Build** — `wallets`, `ledger`, both with the immutability trigger and no write
policy for anyone. A `security definer` debit function.

**Front end — this is the phase with the trap.** `spend()` and `addMoney()` keep
their names and their single home in the store, but their **return contract
changes**: a `boolean` becomes a `Promise<boolean>`, and `if (promise)` is
always truthy.

Five charging call sites must become `async`/`await` **in the same commit**:

```
src/components/CartSheet.jsx:20    if (spend(cartTotal, ...))
src/screens/Tarot.jsx:52           if (!spend(TAROT_PRICE, ...)) return
src/store.jsx:194                  if (spend(product.price, ...))   ← inside buyNow
src/screens/Reports.jsx:80         onClick={() => buyNow(r)}
src/screens/Shop.jsx:273, :347     onClick={() => buyNow(p)}
```

Miss one and it silently lets through a purchase the server refused. Each needs a
pending state on its button too, or a double-tap double-charges.

**Done when:**
1. Devtools cannot change a balance.
2. A debit larger than the balance is refused **by the server**, and the existing
   "Not enough balance" toast fires from that refusal.
3. **Replaying the ledger from zero reproduces the stored balance exactly.** This
   is the check worth writing — if it passes, most of the wallet is right.
4. Double-tapping *Buy now* charges once.

---

## Phase 3 — Payments in

**Build** — `payments`. Razorpay order creation. A webhook endpoint that verifies
the signature before trusting anything, then credits the ledger.

**Front end** — the wallet top-up sheet opens real checkout. The decorative
payment-method tags either become real or come out.

**Done when:**
1. A real ₹1 payment credits the wallet exactly once.
2. **Firing the identical webhook payload twice still credits once.** Verify by
   replaying it, not by reasoning about it.
3. A failed payment leaves a `payments` row and **no ledger row.**

**Watch:** idempotency is the unique index on the provider's own identifier, not
an application-level "have I seen this?" check — that check races with its own
write.

**Also here:** the unimplemented cashback label on larger top-ups either becomes
real or is deleted. It must not survive into real money.

---

## Phase 4 — Consultants, availability, approval

**Build** — `consultants`, `consultant_services`, `consultant_availability`,
`consultant_time_off`. The `consultants_public` view. The slots endpoint.

**Front end** — Consult and the consultant profile read real consultants. The
consultant availability grid writes real rows. **All three callers switch to the
one slots endpoint**, which fixes the existing disagreement where the consultant
view applies booked slots only on Thursday.

Approval ships here because `status` is the public-read predicate: an unapproved
consultant is invisible, unbookable and unable to earn.

**Seed happens here**, and it is the largest single task in the plan — see §Seed.

**Done when:**
1. Two consultants exist with different prices, and each sees only their own
   availability.
2. An unapproved consultant does not appear in search and cannot be reached by
   direct URL.
3. The seeker's booking sheet and the consultant's availability grid show
   **identical** open slots for the same day — every day, not just Thursday.

**Blocked on:** the session duration decision (`01-PRD.md` §5.1). v1 seeds one
service row per consultant, so a wrong answer costs data, not schema.

---

## Phase 5 — Bookings

The phase the whole v1 exists for.

**Build** — `bookings` with the partial unique index that *is* the conflict
check. `orders` and `order_items`. `earnings_ledger`. The booking function: one
transaction doing price lookup, availability check, slot claim, wallet debit,
both ledger writes, order and line, booking insert, thread open. The status-change
endpoint, where a decline writes a **reversing** entry.

**Front end** — both booking sheets stop toasting and start booking. The client
sends `{ consultantId, serviceId, startsAt }` and **never a price**. The
consultant's accept and decline stop being flag toggles.

**Done when:**
1. **Two clients requesting the same slot at the same instant produce one
   booking, one named refusal, and no orphaned debit.** Test it by firing both
   concurrently, not sequentially.
2. A decline restores the seeker's balance via a new ledger row, and the original
   debit is unchanged.
3. The consultant's earnings ledger shows gross, fee and net for the booking, and
   `gross − fee = net` for every row.
4. A booking survives a page reload on both sides.

**Why `orders` ships now** despite sessions being the only thing sold:
retrofitting an order layer beneath a ledger that already holds live money is the
worst migration in this project. It costs about twenty lines today.

---

## Phase 6 — Chat

**Build** — `threads`, `messages`, Realtime subscription. Presence via Realtime,
not a column.

**Front end** — `ChatPanel` reads real threads. **The direction bug cannot be
expressed any more** — sender identity is a column and role is derived from the
thread, so the two flip helpers come out. Unread becomes a count of unread rows.

**Done when:**
1. A message sent from the seeker side appears on the consultant side without a
   reload, **attributed correctly on both.**
2. Nobody can read a thread they are not in.
3. Unread clears when the thread is opened, on the right side only.

**Blocked on:** the chat window question (`01-PRD.md`, `02-TRD.md`) — is paid
chat a booking with a duration, or a thread with a quota? Both columns exist so
either answer fits, but the enforcement rule needs deciding before this ships.

---

## ═══ The v1 line ═══

**After phase 6, a seeker can sign in, top up with real money, see real
consultants, book a real slot that charges them, and chat about it. Consultants
get real requests and a real earnings ledger.**

Everything below is post-v1. Everything not yet touched — Shop, Academy, Pooja,
Tarot, Reports, Premium, Ask AI, Live, insights, referrals, payouts — **keeps
running on mock data with no front-end change at all.** That is the point of the
line.

**No admin console yet.** Approve a consultant, block one, remove a post: do it
in the database GUI. It is a marketplace with a handful of consultants. Build the
console when the GUI hurts.

---

## Phase 7 — Charts

**Build** — the Swiss Ephemeris service. Chart computation from stored birth
details. Panchang for a real date.

**Front end** — `placements`, `chartHouses`, `days` and `panchang` come out of the
mock.

**Done when:**
1. Two users with different birth details get **different** charts.
2. A known birth time reproduces a chart matching an independently verified
   source. **Choose that reference chart before writing the service** — otherwise
   there is nothing to test against.
3. A birth before 1945 computes with the correct historical offset for its
   place, not today's.

**Watch:** ayanamsa and house system must be explicitly set, not defaulted. A
wrong one is wrong *silently* — the chart renders, it just is not yours.

**Also fixes:** the mock's two calendars disagree — the panchang is dated a week
apart from the horoscope.

---

## Phase 8 — Ask AI

**Build** — a server-side model proxy. `ask_messages`. `entitlements`, so the
question quota is a SUM rather than a number in a browser.

**Front end** — real replies. Question packs **charge the wallet** instead of
granting free questions. The hardcoded wallet figure in the pack sheet reads the
live balance.

**Done when:** the model key is absent from the network tab, a client faking its
remaining count is still refused at zero, and buying a pack moves money.

---

## Phase 9 — Reviews and content

**Build** — `content` (merging posts, articles, clips and live sessions),
`reviews`, `reactions`, `feed_pins`. Storage buckets and a real upload path.

**Front end** — the feed becomes a query. The consultant studio uploads instead of
toasting. `follow` / `save` / `like` move from the browser `Set` to real rows.

**Done when:** a consultant publishes something that a seeker sees; a follow
survives a reload and a different device; and a review can only be left against a
completed booking, with unverified reviews visibly distinguished.

**Accept here:** follower and like counts start honest and small. Ritu shows 0
followers, not 84,200.

---

## Phase 10 — Shop and Academy orders

**Build** — `products` with stock, `courses`, `academy_events`, `enrolments`,
fulfilment and shipping.

The most operationally expensive phase: physical goods bring stock, shipping,
returns and courier tracking, none of which the UI has today.

**Done when:** an order reserves stock, a sold-out product cannot be bought by
two people at once, and the frozen line price on an old order does not move when
the catalogue price changes.

**Blocked on:** the duplicate-SKU and report-price decisions (`01-PRD.md` §5.2,
§5.3). The multiplier must be deleted before anything is seeded.

---

## Phase 11 — Live video

**Build** — the SDK integration, `sessions` with join and leave timestamps, room
lifecycle.

**Done when:** a call actually rings, both parties connect, and the session's
actual duration is recorded — which is also what phase 14 measures.

**Blocked on:** the SDK choice. Compare pricing at expected minutes.

---

## Phase 12 — Payouts and KYC

Last of the money work, on purpose: the most regulated and the least urgent.

**Build** — `kyc_documents`, `payouts`, the payout provider integration, GST and
TDS handling.

**Done when:** no consultant can be paid before KYC clears, a payout draws from
the earnings ledger rather than by scanning bookings, and the tax treatment has
been checked by someone qualified.

**Gates, both hard:**
- **KYC clears before the first rupee leaves.** Legal, not a feature.
- **Talk to a CA before writing this code, not after.** You are a marketplace.

---

## Phase 13 — Admin console

**Build** — `admin/` as a second app, making the repo an actual monorepo
(`app/`, `admin/`, `backend/`). Service-role access, **no admin role in client
RLS**. `admin_users`, `admin_actions`. Its own layout system — the phone frame
does not transfer.

Capabilities in order of payoff: consultant approval (5) → moderation (6) →
search and spend history (8, nearly free) → marketplace (3) → academy and
ranking (1) → deity and tarot upload (2) → reviews audit (7) → reschedule (4).

**Done when:** every capability writes an audit row, a support-tier account
cannot block anyone, and no admin path depends on RLS.

**Watch:** capability 2 lets a non-developer upload deity art, which **reverses
the "static content ships as JSON" position** — recorded as a deliberate
reversal. Artist, licence and source are required fields on that form, or the app
accumulates unattributable assets that legally have to be deleted along with
anything derived from them.

**Blocked on:** the ranking formula (`01-PRD.md` §5.5) and the
blocked-consultant-with-pending-money policy (`01-PRD.md` §6).

---

## Phase 14 — Anti-fluking detection

**Build** — a materialized view over sessions, bookings and messages. A nightly
job writing `consultant_flags`. Thresholds as **editable rows, not code.**

Signals: connected duration against booked duration · calls attended against
requested · zero-message chat sessions · reply latency against target · repeat
declines.

**It flags; a human resolves.** No automatic penalties.

**Done when:** a deliberately gamed session is flagged within a day, a flag can be
resolved with a reason, and a threshold can be changed **without a deploy.**

**Not a machine-learning project.** It is three SELECTs behind a cron. Scope it
that way in writing or it grows.

---

## Seed

The largest single task, in phase 4.

**No mock ID is ever migrated.** They collide across at least six entity families
— the same string is a wallet transaction and a warning, an article and a tarot
card, a clip and a review. Everything gets a fresh UUID plus `legacy_id` holding
the original, and the polymorphic references are re-pointed through that column.
Without the mapping they cannot be resolved at all.

**Roughly fifteen display-name joins do not resolve.** Only three real foreign
keys exist in the mock; everything else joins by name, and names like the six
booking clients, two of the session-history consultants and two product
recommenders **match no record anywhere.**

Rule: unmatched names create placeholder profiles flagged as such, and **the seed
prints the full list.** It fails loudly at seed time rather than as a foreign key
violation at 2am.

**Three specific traps:**

1. **`bookings` has no consultant reference.** Every row implicitly belongs to
   the first consultant. A verbatim seed silently attributes all seven bookings
   to one person, and it stays invisible until a second consultant signs in.
2. **Two Bhaktamar cards are incomplete** and flagged `partial: true`. A length
   check on the Devanagari fields fails on exactly two of 48 rows. It is a
   content gap needing a verified source, not an encoding bug.
3. **The report multiplier must not reach the database.** Six real prices get
   typed once. It has already compounded into one wrong ledger figure.

---

## Risk register

Highest first.

| Risk | Why it matters | Mitigation |
|---|---|---|
| **The trust boundary** | Until phase 2, the wallet is decorative and devtools can set any balance | Do not demo it as though it is not. Phase 2 is second for this reason |
| **Birth-time timezones** | A modern offset on an older Indian birth shifts every house cusp with **no error raised anywhere** | Store zone plus naive time. Test a pre-1945 birth explicitly in phase 7 |
| **The async return contract** | Five charging call sites let purchases through if missed | Convert all five in one commit; grep for `spend(` and `buyNow(` before merging |
| **Silent ephemeris misconfiguration** | Wrong ayanamsa renders a plausible, wrong chart | Pick the reference chart before writing code |
| **Front-end features outrunning the backend** | Already happening — two free tarot pulls, consultant metrics and course uploads were added as UI against assumptions the schema had not made | Every new front-end feature that implies persistence gets logged against a phase before it is built |
| **Referral fraud** | The per-join bounty is the largest per-action payout in the product and has no controls | Design the control before phase 9, not after the first abuse |
| **Blocking a consultant mid-obligation** | Their seekers have paid | Policy decision required before phase 13 |
| **Physical fulfilment** | Stock, shipping, returns and couriers are absent from the UI entirely | Sequenced late, deliberately |
| **Image licence drift** | Share-alike derivatives lose their attribution when a surface is redesigned | Licence is a required field; attribution stays reachable in the interface |

---

## Decisions blocking specific phases

| Decision | Blocks | Default if undecided |
|---|---|---|
| Session duration ladder | 4, 5 | Flat 20 minutes at the consultant's band |
| Refund and cancellation policy | 5 | Debit at booking; no self-service cancellation; refunds as an admin reversing entry |
| Charge at booking or at session start | 5 | At booking |
| Chat window semantics | 6 | — |
| Ephemeris reference chart | 7 | — |
| Report prices, and the duplicate SKUs | 8, 10 | — |
| Video SDK | 11 | — |
| Consultant ranking formula | 13 | — |
| Blocked consultant with pending money | 13 | — |
