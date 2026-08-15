# Backend — architecture and decisions

What the backend for Veda is, why it is shaped this way, and what it is
deliberately not. This file holds **decisions**. For how to build against them
see `INSTRUCTIONS.md`; for what is actually built right now see `HANDOFF.md`.

**Status: nothing is built.** The app is front-end only, every value comes from
`src/data/mock.js`, and nothing survives a reload. This document describes the
target, not the present.

---

## 1. Three jobs, and you only write one

The app looks like one backend problem. It is three, and conflating them is how
this gets expensive.

| Job | What it needs | Who writes it |
|---|---|---|
| **Remembering** | users, wallets, bookings, orders, chat, follows | You. This is "the backend" |
| **Computing astrology** | chart from date + time + place | Nobody. Ephemeris library |
| **Real-time and money** | video, voice, UPI, payouts | Nobody. Razorpay, 100ms |

Everything below is job 1 plus thin adapters to 2 and 3.

---

## 2. Where each mock export actually belongs

`src/data/mock.js` is ~50 exports and they are not the same kind of thing.
Sorting them is the design work; roughly a third never needs a server.

### Static content — ship as JSON, no database

`deities` · `offerings` · `tarotDecks` · `bhaktamar` (48 cards) · `loadingLines`
· `askSuggestions` · `shopCategories` · `shopSubcategories` · `categories` ·
`weekDays` · `timeSlots` · `SESSION` · `topUpAmounts` · `questionPacks` ·
`premiumTiers` · `reportCatalogue`

These change when *you* change them, not when a user does. A file in `public/`
or on a CDN. In Postgres they cost a query and buy nothing.

`products` and `courses` start here and graduate to the database the day
someone other than you needs to edit them.

### Derived — computed on demand, never stored

`placements` · `chartHouses` · `days` / `today` (horoscope) · `panchang` ·
synastry results

Input is birth details plus a clock; output is deterministic. Store the
**input**, compute the rest. A stored horoscope is a cache, and should be
labelled one.

### Real state — this is the database

`user` · `consultants` · `bookings` · `bookedSlots` · `chatThreads` ·
`consultantReplies` · cart and orders · `walletTransactions` / `ledger` /
`balance` · `posts` · `clips` · `reads` · `earnings` · `payouts` · `proLedger` ·
`referrals` · `flags` (follows, saves, likes) · course enrolments · purchased
`reports` · `tarot:usedFree` · `notifications` · `sessionHistory`

### Someone else's problem

`liveSessions` and `liveChat` → video SDK. `insights` and `earningsSeries` →
analytics. `askConversation` → the LLM.

---

## 3. The trust boundary

The one concept that decides whether this app can hold money.

`spend()` in `src/store.jsx` is currently the entire money system and it runs in
the browser. Anyone with devtools can set `balance` to a crore. That is not a
bug in the code — it is what client-side means.

**Rule: anything a user would lie about is decided on a server they cannot
reach.** For this app that is exactly:

- wallet balance, and every debit and credit
- whether a booking slot is free (two people tap 11:00 at once; the server picks
  one and the other gets a clear refusal)
- whether the free weekly tarot pull is spent (`tarot:usedFree`, today a `Set`
  in memory)
- consultant earnings and payout amounts
- whether a report was paid for before it renders
- whether the caller is actually a consultant, not just standing on a `/pro/*`
  URL

Everything else stays client-side and should. Which deity you swiped to, which
murti, the thali angle, scroll position, cart contents before checkout — none of
it is worth a round trip. Do not over-secure the mandir.

**Corollary, and it is the one that bites first: the client never sends a
price.** It sends `{ productId, qty }` and the server looks it up. A client that
can send `amount` is a client that will send `1`.

---

## 4. Stack

The front end has three runtime dependencies and no state library. The backend
answers that in kind.

**Supabase** — Postgres, phone-OTP auth (what India expects), file storage for
consultant media, realtime for chat, and Row Level Security so "a user reads
only their own wallet" is a database rule rather than a route you might forget
to guard. Firebase is the same shape if you prefer it; the reasoning below does
not change.

**Plus a small set of server functions** for what RLS cannot express — Vercel or
Cloudflare functions, or one tiny Node service:

| Function | Why it cannot be a database rule |
|---|---|
| Payment webhook | Razorpay calls you; the URL is public and the signature must be verified |
| Wallet debit/credit | A debit is a transaction across two tables, not an update |
| Booking confirm | Conflict check and hold must be atomic |
| Chart compute | Calls the ephemeris service |
| Ask AI proxy | The model key can never reach a browser, and the quota is money |

**Ephemeris: Swiss Ephemeris.** It is the reference implementation and its best
binding is Python (`pyswisseph`). A ~200-line Python service taking
`{ date, time, lat, lon }` and returning positions is a legitimate second
service. JS ports exist and are less proven; Indian astrology is unforgiving
about ayanamsa and house system being exactly right, and a wrong one is wrong
silently.

**Language:** Node/TypeScript for the functions, so the repo stays one language
apart from the ephemeris.

No queue, no Redis, no GraphQL, no microservices. Add the first one that is
measurably needed and not before.

### Deliberately not

- **Writing auth from scratch.** Sessions, OTP, rate limits, reset flows. Solved.
- **A custom realtime layer.** Postgres changefeeds cover chat at this size.
- **An ORM with migrations-as-code before there is a schema.** SQL files first.
- **Server-side rendering.** The client is a static SPA on Pages and stays one.

---

## 5. Data model

Around fifteen tables.

```
profiles          id, phone, name, role, birth_date, birth_time,
                  birth_place, lat, lon, tz, created_at
consultants       profile_id, bio, price_paise, skills[], languages[],
                  rating, verified, kyc_status
availability      consultant_id, weekday, start_time, end_time    -- the rule
bookings          seeker_id, consultant_id, starts_at, mode, status,
                  amount_paise, hold_id                           -- the facts
wallets           profile_id, balance_paise
ledger            wallet_id, delta_paise, kind, ref_type, ref_id, created_at
orders            profile_id, status, total_paise, created_at
order_items       order_id, product_id, qty, unit_price_paise
threads           seeker_id, consultant_id, last_message_at
messages          thread_id, sender_id, body, created_at
reactions         actor_id, target_type, target_id, kind   -- follow/save/like
posts             consultant_id, kind, media_url, caption, created_at
tarot_pulls       profile_id, deck, card_id, pulled_at
enrolments        profile_id, course_id, progress
payouts           consultant_id, amount_paise, status, provider_ref
```

Five things that are load-bearing:

1. **Money is integers, in paise.** Never rupees, never floats. `0.1 + 0.2 !==
   0.3` becomes a support ticket you cannot answer.
2. **`wallets.balance_paise` is a cache of `ledger`.** The ledger is truth:
   append-only, never edited, never deleted. If the two disagree the ledger
   wins. This is how you answer "where did my ₹500 go" eleven months later.
3. **`order_items.unit_price_paise` is frozen at purchase.** Change a product's
   price and old orders must not move. Same reason `bookings.amount_paise` is
   stored rather than joined.
4. **`availability` is a rule, `bookings` are facts.** `bookedSlots` in the mock
   is the *result* of subtracting one from the other. Never store a result you
   can derive; it will drift.
5. **`reactions` is the `flags` Set, normalised.** `follow:a1`, `save:po2`,
   `like:r3` is a namespaced string that maps one-to-one onto
   `(actor, target_type, target_id, kind)`. The prototype shortcut survives
   contact with the real thing, which is rare enough to note.

---

## 6. Third-party choices

| Need | Choice | Why not the obvious alternative |
|---|---|---|
| Payments in | Razorpay (or Cashfree) | Stripe is awkward for domestic UPI, and UPI is most of the volume |
| Payouts | RazorpayX / Cashfree Payouts | Paying out is a different product from taking in, with its own KYC gate |
| Video / voice | 100ms or Agora | Raw WebRTC is a team, not a task |
| LLM for Ask AI | Claude, server-side proxy | The key cannot ship to a browser and the quota is money |
| Ephemeris | Swiss Ephemeris | The alternative is being subtly wrong forever |

---

## 7. What the front end has to change

Less than it looks, because the seam already exists.

- **`src/store.jsx` is the seam.** `spend`, `addMoney`, `addToCart`,
  `toggleFlag`, `buyNow` keep their exact signatures and become awaited HTTP
  calls. Callers do not change. That ~29-key context object turned out to be the
  right design by accident — protect it.
- **`spend()` already returns `false` when short** and toasts. Now it returns
  false because the *server* said so. The refusal path is built and the copy
  already exists.
- **Screens importing `mock.js` directly** swap to a fetch hook and grow
  `loading` and `error` states. That is the real work, and it is UI work across
  ~15 screens, not backend work.
- **`isPro` stays derived from the URL.** The handoff is right that a persisted
  role boolean is a mistake — it can disagree with the address bar. But the
  server must independently verify the caller is a consultant on every `/pro`
  request. Client routing and server authorization are different questions and
  the URL only answers the first.
- **Hosting does not change.** Pages keeps serving the SPA; it calls an API on
  another origin. You will meet CORS on day one.

---

## 8. Build order

Each step ships end to end before the next begins. Vertical slices, not "all the
tables, then all the routes".

1. **Auth and profile** — phone OTP, birth details persisted. Onboarding stops
   evaporating on reload. Smallest change with real value.
2. **Wallet** — ledger and balance, server-side. `spend()` starts meaning
   something.
3. **Payments in** — Razorpay checkout, webhook, credit the ledger.
4. **Bookings** — availability, atomic slot claim, hold then capture.
5. **Chat** — persisted, realtime. Fix the seeker/consultant thread direction
   bug here rather than in the mock.
6. **Charts** — ephemeris service. Retire mocked `placements` and `days`.
7. **Ask AI** — proxy plus server-enforced question quota.
8. **Shop orders**, then **live video**, then **payouts and KYC**.

Payouts are last on purpose. They are the most regulated and the least urgent;
nobody needs to be paid on day one.

---

## 9. India-specific, and none of it optional

- **Every consultant needs KYC before their first rupee.** It is a legal gate,
  not a feature, and it gates step 8 entirely.
- **You are a marketplace**, so GST, TDS on consultant payouts and invoices
  apply. Talk to a CA before writing the payout code, not after.
- **Timezones: store UTC everywhere, with one exception.** Birth *time* needs
  the original local time and the historical offset for that place — India has
  changed its zones, and a modern offset applied to a 1980s birth shifts the
  whole chart. Getting this wrong is invisible and total.
- **Astrology advertising is regulated.** Disclaimers, and no medical or
  financial claims. The existing copy voice — blunt, promising nothing — already
  helps here. Keep it.
