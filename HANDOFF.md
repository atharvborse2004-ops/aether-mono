# Handoff — Namo (aether-mono)

**What is actually true right now.** Front end and backend in one file, because
two files claiming to describe reality means neither gets trusted.

Updated 26 Aug 2026. **Phases 0, 1 and 2 are done. Phase 3 is built and
replayed to production, one done-condition away from finished — Razorpay's
website review of `atharvborse2004-ops.github.io` was still queued on their
side as of 25 Aug, and until it clears every live checkout is refused with
"Payment blocked as website does not match registered website(s)". §2 says
exactly where that line is.**

**Phase 4 is built and seeded on both projects. The front end is not deployed
yet.**
Consultants, price bands, services, availability, time off, bookings, the slots
function and the two views exist on both projects, and the phase's own SQL
check passes on both. Dev also carries the six mock consultants and their seven
bookings as real rows, and the front end reads all of it on both sides. Production's six are **`pending`** — invisible, unbookable, earning nothing —
so the live `/consult` will be empty until somebody approves them, which is a
deliberate one-line edit and not an oversight. What is outstanding is the
**deploy**: the front end still has to be committed and pushed, and that order
is the right way round, since deploying first would have pointed the live site
at tables that did not exist. §6.

This file describes **state**. It does not describe the system — that is
`docs/` — and it is not a changelog. History lives in `git log`, which is
better at it. When something here stops being true, rewrite the line.

---

## Start here

Enough to pick the project up cold.

```bash
npm install
npm run dev -- --port 5260     # any free port
npm run build                  # proves less than you think
```

**Two Supabase projects, and never mix them.** Rules in
`backend/INSTRUCTIONS.md` §3.

| | Project ref | Reached by | Holds |
|---|---|---|---|
| **Production** | `talqzgolttfgdzcoaqno` | the deployed site only | four real accounts |
| **Dev** | `mrjsatelbuiypodeulcx` (`namo-dev`) | `npm run dev`, `.mcp.json`, agents | throwaway |

`.env.local` (gitignored) and `.mcp.json` both point at **dev**. Production
credentials live only in the GitHub Actions secrets. A **third** store arrived
with phase 3: each project's Edge Function secrets, holding everything a server
function needs and the browser must never see. Nothing moves between the three. If `.env.local` is
missing, copy `.env.example` and fill it from the dev project's Settings → API.

**Signing in on dev costs nothing.** Test OTP is configured: phone
`+919999900001` or `+919999900002`, code `123456`, no SMS. Type `9999900001`
into the ten-digit field — the `+91` is fixed in the UI. Two numbers, so the
"a second account sees only its own data" check needs no second phone.

**Live:** https://atharvborse2004-ops.github.io/aether-mono/#/home
Pushing to `main` deploys automatically, ~40s. `HashRouter`, so GitHub Pages
needs no config for sub-routes.

### Verifying the money layer

The thing to run after touching anything near the wallet. Paste
`backend/schema/003_wallets_ledger_check.sql` into the dev SQL editor, and
`006_payments_check.sql` after it if payments are in scope.

**Passing looks like a failure:** `ERROR: PHASE 2 CHECKS PASSED`, and
`ERROR: PHASE 3 CHECKS PASSED` from the other. It raises on
its last line to roll back every row it wrote, because the ledger is
append-only and a check that inserted real rows could not clean up after
itself. Any other error names the assertion that broke. It needs at least one
profile to exist, and it measures relative to whatever balance that wallet
already holds, so it can be run repeatedly.

---

## Where to read what

| Question | File |
|---|---|
| What is this product, who uses it, what does it cost | `docs/01-PRD.md` |
| Stack, trust boundary, API surface, admin isolation | `docs/02-TRD.md` |
| Routes, screens, actions, state machines | `docs/03-APP-FLOW.md` |
| Tokens, components, the design system | `docs/04-UI-UX.md` |
| Tables, columns, RLS, seed plan | `docs/05-BACKEND-SCHEMA.md` |
| What gets built in what order | `docs/06-IMPLEMENTATION.md` |
| The rules every phase obeys | `backend/INSTRUCTIONS.md` |

---

## 1. Front end

**Complete as a prototype.** Vite 5 · React 18.3 · Tailwind 3.4 ·
`react-router-dom` 6.28 · plain JSX. Three runtime dependencies. No icon
library, no state library, no UI kit, **no linter, no type checker, no tests.**

Two sides in one codebase. Most values on screen still come from
`src/data/mock.js` and `src/data/bhaktamar.js`. Two things are real:

- **Identity and birth details** (phase 1). The onboarding questions plus phone
  verification write a `profiles` row; Profile, Chart and Horoscope read it back.
- **The wallet** (phase 2). Balance and ledger are server rows read under RLS,
  and every debit is decided by a server function. Nothing in the browser can
  move either.
- **Top-up** (phase 3). Razorpay checkout, credited by a webhook.
- **The whole consultant surface** (phase 4). Who a consultant is, what they
  charge, when they are open, and which requests are waiting. `/consult`,
  `/consult/:id` and every `/pro` screen read real rows; the availability grid
  and accept/decline write them.

Everything else evaporates on reload, deliberately.

### Structural facts worth knowing before touching `src/`

- **`HashRouter` is mounted above `AppProvider`** so the store can read the URL.
  `isPro` is derived from the pathname. **Do not add a persisted role** — it can
  disagree with the address bar.
- **`src/store.jsx` is one context** with a large `useMemo` and a
  **hand-maintained dependency array**. The value object and the dep array must
  both be updated or the context goes stale intermittently.
- **`flags` is the extensibility hatch** — a `Set` of namespaced strings with
  `hasFlag` / `toggleFlag`. Reach for it before adding a store slice. It carries
  `like:` · `save:` · `follow:` · `remind:` · `tarot:free1|free2` ·
  `setting:croppedDeityImage`. Phase 4 removed three of them —
  `accept:` and `decline:` are `bookings.status` writes now, and
  `closed:{day}:{time}` is a row in `consultant_availability`.
- **Everything reusable is in `src/index.css`** under `@layer components`. Read
  it before writing markup.
- **`.subnav` is deliberately dead code.** Do not clean it up without asking.

### The money and identity contracts

- **`spend()` returns a promise.** It used to return a boolean and every caller
  used it as one. `if (spend(...))` is truthy whatever the server said, so a
  missed `await` is a purchase that was refused and went through anyway. All
  four charging call sites await it: `CartSheet.jsx`, `Tarot.jsx`,
  `Reports.jsx`, `Shop.jsx` (×2). A second guard sits in the store as a **ref**
  — two taps land in the same tick and state set by the first has not applied
  by the second — so a button that forgets its pending state still cannot
  double charge.
- **`balance` is PAISE and it is `null` until loaded.** Rupees live only in
  `mock.js` and in what the user reads; `rupees()` is exported from `store.jsx`
  and is the one place money becomes text. A screen comparing `balance` to a
  mock price needs the hundred — `Tarot.jsx` is the one that does. `null`
  renders as an em dash: a wallet flashing zero at someone who has money is
  worse than showing nothing yet.
- **`useProfileFields()` is what screens read for identity.** Signed in, it
  returns the real row or blank — never the seed person, because a signed-in
  user seeing the mock name and birth details would get a chart drawn for a
  birth that is not theirs, permanently if the fetch failed. Signed out it
  returns seed, which is the demo. **Never read `mock.js`'s `user` directly in a
  screen that shows identity** — that bug has shipped twice.
- **Sun, moon and rising are still seed for everyone**, on four screens
  (`Computing.jsx`, `HoroscopePanel.jsx`, `Shop.jsx`, and via the hook). They
  need the ephemeris service. **Phase 7 must change all four**, not just the hook.

### Screen-level facts that are not obvious from the code

- **Pooja swipe axes:** right/left = deity, down/up = murti. Guarded by
  `node tools/verify-pooja-swipe.mjs`.
- **Deity images are uncropped by default.** `setting:croppedDeityImage` is an
  **opt-in back to the crop**, so its absence is the common case.
- **Tarot is a guided flow**, deck then question then card, the first two as
  centred modal dialogs. Two free pulls a week, then the wallet is charged.
- **Three chart systems** — Vedic, South Indian, Western. `chartSystem` on the
  store, so Profile follows the choice made on `/chart`.
- **Hindi and English** via `src/data/i18n.js` and `t()`. Chrome, mandir and
  tarot are translated; the editorial copy in `mock.js` deliberately is not.
  Noto Sans Devanagari sits **after** Plus Jakarta Sans in the stack — browsers
  resolve per glyph, so Latin is untouched.
- **Pro nav is Earnings / Studio / Go Live / Consult / Profile.** Five tabs, no
  Feed — a consultant runs a practice, she does not browse the seeker feed. The
  route is `/pro/live`, **not** `/pro/golive`, which hits the catch-all and
  lands silently on Studio.
- **`/pro` is gated on a real `consultants` row** as of phase 4 — it used to be
  exempt from the session gate entirely, which is how anyone who typed the URL
  became `consultants[0]`. No session, or no row, lands on `/pro/apply`. Still
  exempt are the two seeker routes it links out to: `/chart` (a booking row's
  "view kundli", prefilled from query params) and `/consult/:id` ("view your
  public page"). `/home` from "Switch to seeking" is **not** exempt — that one
  is genuinely asking for the seeker app. Note `/profile` starts with the four
  characters `/pro`, so the check is on a segment boundary.

---

## 2. Backend — phases 1 to 4

**Both are built, verified and deployed.** Migrations are numbered SQL files in
`backend/schema/`, forward-only, applied via the Supabase MCP rather than the
CLI — there is no `supabase/migrations` dir, so those files are the record of
what ran, not the thing that ran it.

| File | What |
|---|---|
| `001_profiles.sql` | `profiles`, RLS, the column grant, `handle_new_user` |
| `002_profiles_email.sql` | `profiles.email` |
| `003_wallets_ledger.sql` | `wallets`, `ledger`, both triggers, `wallet_debit` |
| `003_wallets_ledger_check.sql` | **a test, not a migration** — never in a replay |
| `004_refuse_mutation_search_path.sql` | lint fix; 003 had already run |
| `005_wallet_debit_drop_client_ref_type.sql` | removed a client-settable `ref_type` |
| `006_payments.sql` | `payments`, `payment_capture()` |
| `007_consultants.sql` | `price_bands` (seeded), `consultants`, `consultant_services`, `consultant_availability`, `consultant_time_off`, RLS, the column grants, `consultants_public` |
| `008_bookings.sql` | `bookings`, the partial unique slot claim, read-own and the accept/decline policy |
| `009_slots.sql` | `consultant_open_slots()` — the one slots source |
| `009_slots_check.sql` | **a test, not a migration** — nine assertions, never in a replay |
| `010_bookings_view.sql` | `bookings_view`, which is what carries the other party's name |
| `011_round_price_bands.sql` | derived band prices to whole rupees; restores the six the PRD names |
| `006_payments.sql` | `payments`, RLS, `payment_capture` |
| `006_payments_check.sql` | **a test, not a migration** — never in a replay |

**A fresh project is these files in order**, minus the two `_check` files.
Dev was built that way, which is
the first real proof they reproduce the system from nothing rather than merely
describing what once happened.

### Phase 1 — identity

`profiles` matches `docs/05-BACKEND-SCHEMA.md` §4.1. RLS on, both policies
`id = auth.uid()`.

- **No client INSERT policy, by design.** The row is created server-side by a
  `security definer` trigger the instant `auth.users` gets a phone signup; the
  client only ever `UPDATE`s the row that already exists.
- **The UPDATE grant is column-scoped.** `authenticated` may write
  `name` and `birth_*` and cannot touch `admin`, `phone`, `legacy_id`, `id` or
  `created_at` even on its own row. Row-scoped RLS alone would have let a
  signed-in client grant itself `admin`.
- **`profiles.email`** is required at the onboarding screen but nullable and
  not unique in the column, and never an auth factor. **Its purpose is an open
  regulatory question** — see `docs/01-PRD.md` §8 before the first marketing send.
- **Birth time is naive local plus an IANA zone**, never a timestamp and never a
  stored offset. `AskPlace.jsx` searches Open-Meteo's geocoder because it
  returns the zone with each hit; `birth_zone` was once hardcoded
  `Asia/Kolkata`, survivable only while every option was Indian. **Licence
  problem: that geocoder's free tier is non-commercial and this product is
  not** — `docs/01-PRD.md` §8 before launch.
- **The onboarding draft lives in `sessionStorage`.** Reading the SMS means
  leaving the app, and an evicted page created an account with no birth details,
  silently. That is what landed the first live signup an empty row.
- **Onboarding never overwrites an existing birth record.** There is no
  sign-in-only route, so a returning user re-answers the questions to get a
  session; `Computing.jsx` waits for the profile to load and, if `birth_date` is
  already set, signs them in and leaves the row alone.

**Phone auth on production is Twilio Verify.** The route cost most of the setup
time, so it is written down:

- **Not Twilio's plain Messaging API.** A US long code sits behind A2P 10DLC
  registration and Twilio leaves messaging *disabled* until it clears — days,
  and money. The first attempts died on error `21704`.
- **Twilio Verify** picks compliant senders per country itself: no owned
  number, no A2P registration, no DLT work. In Supabase pick `Twilio Verify`
  and give it the **Verify Service SID** (`VA...`), not a messaging service SID.
- **The test-OTP field needs both halves** — the number-and-code pairs *and* the
  valid-until. The code alone is rejected. Dev uses this; production does not,
  and **must not**: there those numbers are a way into a real wallet.

**Both done-conditions pass.** Sign in, close the tab, reopen — still signed in,
details intact, `created_at` still the original signup instant. And a second
account sees only its own rows: on dev, account 2 returns exactly one profile,
its own, with the other's id returning an empty array when asked for directly.

### Phase 2 — wallet

`wallets` and `ledger` per `docs/05-BACKEND-SCHEMA.md` §4.6. `earnings_ledger`
is deliberately **not** here — it references consultants and bookings and ships
inside phase 5's booking transaction.

Four things to know before touching it:

- **The balance cache is maintained by an `after insert` trigger on `ledger`**,
  not by whoever writes the row. This was not in the plan. A cache each writer
  must remember to update is one that eventually disagrees; this way replaying
  the ledger reproduces the balance because the balance *is* that replay. It
  also makes a hand-typed credit correct by construction, which is how test
  wallets get funded — recipe at the foot of `003`.
- **Neither table has a write policy for anybody**, and `authenticated` has no
  `INSERT`/`UPDATE`/`DELETE` grant on either. Only `wallet_debit()` writes, and
  it takes a row lock so two debits serialise rather than both reading the same
  balance. `wallets` also has a `balance_paise >= 0` CHECK as the backstop
  under a function nobody has written yet.
- **`wallet_debit()` takes the amount and label from the client and nothing
  else.** The amount is within rule 3, which bans a number the *user benefits
  from* — a debit is not one. It is shaped this way because there is no
  server-side catalogue until phases 8 and 10; phase 5's booking is the first
  purchase whose price the server looks up for itself.
- **Phase 2 shipped no credit path at all**, because a client-callable credit
  before a payment provider is a mint. Phase 3 opened one, and it is still not
  client-callable: see below. The payment-method tags stay out of `Wallet.jsx`,
  and the **cashback label is deleted** rather than deferred — it was never
  applied and must not be on screen when real money moves.

**All four done-conditions pass.** Devtools cannot change a balance — every
write returns 403 at the grant level. An over-balance debit is refused *by the
server* with the string the UI already showed. The ledger replays to the stored
balance exactly. And three clicks fired in a single tick produced exactly one
ledger row, a stricter test than a human double-tap.

### Phase 3 — payments in

**Built on dev. Not finished, and not on production.** The code is written, the
migration is applied, and the SQL-level checks pass. What has not happened is
anyone putting a card through it.

`payments` per `docs/05-BACKEND-SCHEMA.md` §4.8, plus two Edge Functions in
`backend/functions/` — the first server functions in the project.

| | |
|---|---|
| `razorpay-order` | `verify_jwt = true`. Validates the band, opens a Razorpay order, writes the `created` row |
| `razorpay-webhook` | `verify_jwt = false`. Verifies the HMAC, then calls `payment_capture()` |

- **`payments` holds one row per event, not per payment.** Both unique columns
  are nullable so the `created` row can carry neither id yet, and Postgres lets
  nulls repeat in a unique index. The row carrying a `provider_payment_id` is a
  terminal outcome and there can only be one per Razorpay payment.
- **Idempotency is the unique index, and it is load-bearing in an unusual way.**
  `payment_capture()` inserts the event row and the ledger row in one block. A
  retried delivery violates the index, the handler catches it, and plpgsql
  rolls the whole block back — *including the credit that had already run
  inside it*. There is no window between checking and crediting because there
  is no check. It returns `ok: true, duplicate: true` so Razorpay stops
  retrying.
- **The wallet is found through the `created` row**, matched on the order id,
  never through the payload's `notes` — those round-trip through the client.
  A payment that matches no order raises rather than guessing. That means the
  webhook returns 500 and Razorpay retries an unattributable payment for a
  while, which is the loud half of the mistake and the right half.
- **The amount credited is Razorpay's**, read from a payload whose signature
  was checked first. The browser chooses what to *pay*; it never influences
  what is credited. That is what keeps the custom-amount field inside rule 3.
- **`payment_capture()` is not granted to `authenticated`** — only to
  `service_role`. The security advisor confirms it: it flags `wallet_debit` as
  callable by signed-in users, which is intended, and does not flag this one.
- **The balance is untouched by any of it.** The phase 2 trigger on `ledger`
  moves it, so a credit and the cache cannot disagree.

**Front end:** the top-up sheet is back in `Wallet.jsx` — four presets and a
custom amount — and `topup()` sits next to `spend()` in the store. It is the
one money path that does not end inside the tap that started it: the credit
arrives via a webhook on a different connection, so `topup()` polls the balance
for about twelve seconds and then says the payment is settling. Razorpay's
checkout script is fetched on first use rather than from `index.html`.

**What is verified, and what is not:**

| Done-condition | State |
|---|---|
| A real ₹1 payment credits exactly once | **Blocked**, not unbuilt. Live mode and KYC are both ready; Razorpay's own website-verification review of `atharvborse2004-ops.github.io` is pending, ETA 24-48h from 25 Aug. Every live-mode checkout — UPI and cards both — is refused with "Payment blocked as website does not match registered website(s)" until it clears |
| The identical webhook payload twice credits once | **Yes**, hand-replayed 24 Aug, and confirmed against real Razorpay deliveries 25 Aug |
| A failed payment leaves a `payments` row and no ledger row | **Yes**, same |

The replay was done by replaying, not by reasoning. A signed `payment.captured`
body was POSTed to the deployed function **three times, byte for byte
identical**: the first returned `duplicate: false`, the other two
`duplicate: true`, and the wallet holds one credit row. A signed
`payment.failed` for ₹500 wrote a `payments` row with status `failed` and no
ledger row at all. The ledger sums to the stored balance in both cases.

Signature verification was checked in both directions from the same probe: an
invalid signature returns **401 with the body never parsed**, and a valid
signature for an order that does not exist returns **500** — `payment_capture()`
refusing to guess a wallet, and 500 is the retry signal rather than a swallowed
error.

**Dev wallet `2ad16f66` now holds ₹1**, from that replay. It is a real ledger
row and the ledger is append-only, so it stays. The `order_REPLAY_TEST` and
`order_FAIL_TEST` rows in `payments` are left alongside it deliberately — a
ledger entry whose payment rows were deleted is an entry nobody can explain.

**`/wallet` has been walked**, 24 Aug, and it renders: balance ₹1, the replay's
ledger row reading `Added money · UPI · +₹1`, and the sheet opening with the
four presets, the custom field and no cashback label. Two things came out of it.

- **The CORS header list was wrong and it would have failed in production too.**
  `razorpay-order` allowed `authorization, content-type`, but `supabase-js`
  sends `x-client-info` and `apikey` on every `functions.invoke()`. The
  preflight failed, so the request never left the browser, and it surfaces as
  `Failed to send a request to the Edge Function` — which reads like the
  function is down. Fixed and redeployed. **Any future function needs all four
  in the list.**
- **A missing `RAZORPAY_KEY_ID` surfaced correctly**, before it was set, as
  "Payments are not configured yet." The refusal contract works: the server's
  string reached the toast unchanged. The log line now names *which* secret is
  missing rather than listing both — that ambiguity cost a round trip once.

**With all three secrets set, the order path works end to end.** Tapping ₹500
loads Razorpay's script, opens their checkout in test mode, and writes a real
`created` row — `order_TTKMKbGPw6Itcp`, 50000 paise. `toppingUp` greys the
button and reads "Opening checkout…" while it happens.

**The webhook is registered**, and with two faults worth fixing:

- **It is registered twice**, both entries enabled on the same URL, so every
  event is delivered twice. Idempotency absorbs it — that is what it is for —
  but it doubles the traffic and makes the logs read like a retry storm.
  **Delete one.**
- **Both subscribe to all 51 events.** Only `payment.captured` and
  `payment.failed` are handled; the rest return 200 and are ignored, so this is
  noise rather than danger. Narrow it anyway.

**A real Razorpay test payment credited correctly on 25 Aug.** ₹500 through
their checkout, one `[webhook] captured pay_TTjAR9ky5Ij9WB duplicate=false`
line, balance ₹1 → ₹501, ledger replaying to the stored balance exactly. The
whole path works: sheet, order, checkout, signature, capture, credit.

**Getting there cost two configuration mistakes worth remembering.** The
webhook was registered twice — since deleted, and note that Razorpay's Status
toggle in the details panel *deletes* rather than disables. And its secret was
the **key id** rather than the webhook secret, which produced
`signature did not match; body ignored` on every delivery for eighteen minutes.
Razorpay never shows a saved secret, only overwrites it, so the only way to
rule this out is to retype it.

**A captured payment can be lost, and one was.** `order_TTiovPCUcREweJ` is a
real ₹500 Razorpay captured while the secret was wrong. Every delivery bounced
off the signature check, Razorpay gave up, and the row still sits at `created`
with no credit. In test mode that is nothing; **in production that is a person
who paid and received nothing, with no alert and no way back.** The webhook is
currently the only route from payment to credit, so any window where it is
misconfigured, deployed broken, or down past Razorpay's retry schedule
swallows real money silently.

The fix is a reconciliation sweep, not a change to the payment path: find
`payments` rows stuck at `created` past some age, ask Razorpay's API what
became of each, and feed the captured ones back through `payment_capture()`.
That function is already idempotent, so a sweep racing a late webhook is safe
by construction. **No automated sweep exists yet** — `order_TTiovPCUcREweJ`
itself was reconciled by hand on 25 Aug (its real `pay_TTir3C60oiAFbt` looked
up in the Razorpay dashboard and fed through `payment_capture()` directly,
crediting ₹500), which proves the fix works but is not a substitute for the
sweep existing. **Still owed**, and cheap insurance against the next silent
loss now that production is live.

**Entering a test card and completing checkout could not be driven from an
agent session** — both controls live inside `api.razorpay.com`'s cross-origin
iframe, and CDP input dispatch times out on this machine besides. **A person
did it by hand** on both dev and production: a real ₹500 and a real ₹1 both
completed through the sheet, `handler()` fired, and the balance polling picked
up the credit correctly on both. **The dismiss/cancel path is still
unexercised** — `ondismiss()` and `payment.failed()` have never run, so it
remains unproven that abandoning checkout mid-payment leaves the balance and
the `created` row untouched. Low priority now that the success path is proven
twice over, but still open.

**Seen once, unexplained:** `[profile] load failed: JWT issued at future`,
while the wallet read on the same token succeeded. It appeared under a session
minted by hand in the browser console, so it is most likely an artefact of that
rather than a defect. **Watch for it on a real sign-in** before treating it as
either.

---

### Phase 4 — consultants, availability, approval

**Built and checked on dev. Not on production, and not seeded.**

Run `backend/schema/009_slots_check.sql` in the dev SQL editor after touching
anything near slots or prices. Passing looks like
`ERROR: PHASE 4 CHECKS PASSED` — same trick as the phase 2 check, it raises on
its last line to roll back every row it wrote. Nine assertions, and assertion 5
is the one that matters: it runs the subtraction on **all seven weekdays**,
which is exactly what the old bug passed only on Thursday.

- **Consultant-ness is the existence of a `consultants` row.** No role column
  anywhere, same reason `isPro` is derived from the URL. `/pro` is no longer
  exempt from the session gate: no session or no row sends you to
  `/pro/apply`, which is the application.
- **`status` is the public-read predicate**, so approval is enforced on the row
  rather than in a screen. Verified rather than assumed: a `pending` consultant
  returns nothing from the list, from a direct id lookup, from their prices,
  from their availability *and* from the slots function.
- **The applicant cannot approve themselves.** `status` and `verified` sit
  outside the column grant, exactly as `admin` does on `profiles`. Approving is
  an `UPDATE` in the GUI until phase 13.
- **The price is a band, not a number.** `price_bands` holds six tiers; the
  write policy on `consultant_services` refuses any row whose price, length and
  billing do not match an active band. **Qualify every column of the new row in
  that policy** — unqualified, `price_paise` resolves to the *band's* column,
  the comparison becomes `b.x = b.x`, and the check silently passes anything.
  That shipped, and assertion 9 caught it.
- **One slots source, and it is a Postgres function, not an Edge Function.**
  `consultant_open_slots(consultant, date)` does the three-way subtraction in
  SQL next to the tables. `security definer`, because it subtracts other
  people's bookings — it returns times, never rows. Horizon 14 days, times IST,
  both named there and nowhere else.
- **`bookings` moved here from phase 5** — the table, not the transaction.
  There is still no client INSERT policy; the only write a client can make is
  the consultant moving their own booking out of `pending`. A decline has
  nothing to reverse yet because no booking carries money until phase 5.
- **`bookings_view` is not a convenience.** `profiles` is own-row-only, so
  without it a consultant reading their own queue gets a UUID and no name. It
  carries the seeker's birth details to the consultant on that booking, on
  purpose: a reading cannot be done without them.

Two things that cost time and are worth not rediscovering:

- **A weekday derived in the browser from an IST midnight is a day early.**
  `new Date('...T00:00:00+05:30').getUTCDay()` reads the previous UTC day, so
  the availability grid struck out Wednesday for a Thursday booking and every
  row was shifted by one. It looks exactly like bad data. Anchor at noon UTC.
- **`consultants` is not an own-row-only table.** An unfiltered `maybeSingle()`
  for "my consultant row" returned every approved consultant and failed, which
  showed a real consultant the application form for the practice they already
  had. Filter by id even where RLS feels like enough.

**What has been verified, in a browser, on dev:** two consultants at different
bands, each seeing only their own grid; a pending consultant unreachable by
list, by URL and by RPC; the seeker's sheet and the consultant's grid agreeing
on open slots **on every day of the week**; Accept surviving a reload and not
undoing itself on a second tap; a grid cell writing and deleting the right
`(weekday, slot_time)` row; and `/pro/*` signed out landing on the application
while `/profile` still resolves to the seeker's own.

**The seed has run on dev, twice.** Six consultants, four services each, 35
availability rows each, seven bookings — all seven on `a1` explicitly, which is
seed trap 1 handled rather than fallen into — and seven placeholder profiles
for the booking clients the mock names but never defines. The second run
changed no counts, which is what `legacy_id` idempotency is for.

**Two things it does that are worth knowing.** Booking amounts come from the
*service* row, not from the mock: the mock charges ₹2,998 for 30 minutes, twice
the 20-minute rate, where the bands say one and a half times. And seeded people
get phone numbers starting with 1, which no Indian mobile does — nobody can
sign in as a seeded consultant by owning their number.

**Production has the schema and the seed.** `007`–`011` were replayed there
by hand on 26 Aug — pasted into the SQL editor rather than applied through the
MCP, because `.mcp.json` is pinned to dev on purpose (§3 of
`backend/INSTRUCTIONS.md`) and no agent session can reach production. So
production's `supabase_migrations` table carries no rows for them; the numbered
files are the record, as they always were. The 24 price bands read back
identical to dev, `009_slots_check.sql` passes there, and the seed ran clean —
six consultants `pending`, seven bookings, seven placeholder profiles.

## 3. Decisions made

Recorded so they are not re-argued. Reasoning is in the documents.

- **Buy auth, database, storage and realtime.** Supabase.
- **Write only what cannot be a database rule** — the wallet ledger, the booking
  claim, payment webhooks, the chart service, the model proxy.
- **Money is integers in paise; both ledgers are append-only.**
- **The client never sends a price.**
- **v1 is consult + wallet only.** 13 tables. Everything else stays mocked with
  no front-end change.
- **`orders` ships in v1** despite sessions being the only thing sold —
  retrofitting an order layer under a live ledger is the worst available
  migration.
- **Seven domain tables, one order layer, discriminator on the order line.**
- **`posts`/`reads`/`clips`/`liveSessions` merge into one `content` table.**
- **UUIDs everywhere; no mock ID is ever migrated.** They collide seven ways.
- **The admin console is a separate app on the service role.** No admin role in
  client RLS.
- **Platform sets price bands**; consultants pick one, out of `price_bands`, and
  the database refuses anything else. 18% commission, in basis points.
- **Sessions are sold two ways** — scheduled 15/20/30, and per-minute. Decided
  26 Aug; per-minute is modelled in phase 4 and metered in phase 5/11.
- **Seeded consultants land unapproved on production**, and **the marketplace
  launches empty rather than seeded** — decided 26 Aug, reasoning in
  `01-PRD.md` §7. `/consult` says so and offers the application. Flipping the
  six on for a demo is one reversible statement; approving them for the public
  is a different decision and gets re-argued there, not here.
- **Swiss Ephemeris** for charts, as its own Python service.
- **Payouts and KYC last.** Most regulated, least urgent.
- **Dev and production are separate Supabase projects**, as of 23 Aug.
- **Server functions run on Supabase Edge Functions.** Deno, next to the
  database they write. The ephemeris is the exception — Python, own service.
- **The cashback label is deleted, not deferred.** Reinstating it means pricing
  it first, in `docs/01-PRD.md` §4.8.

---

## 4. Open questions, and what each blocks

| Question | Blocks |
|---|---|
| ~~Session duration ladder~~ | **Answered 26 Aug: both.** Tiered 15/20/30 *and* per-minute, `01-PRD.md` §5.1. Phase 4 models it; phase 5/11 meters it |
| Report prices and the duplicate SKUs | Phases 8, 10 |
| Refund and cancellation policy | Phase 5 |
| Charge at booking or at session start | Phase 5 |
| Chat window — booking-bound or quota-bound | Phase 6 |
| Ephemeris reference chart | Phase 7 |
| Video SDK — 100ms or Agora | Phase 11 |
| Consultant ranking formula | Phase 13 |
| Blocking a consultant who has pending money | Phase 13 |
| Provenance of the 48 Bhaktamar card faces | Seed |

---

## 5. Known gaps

### Needs a person, not code

- **Two Bhaktamar verses are incomplete** and need a verified printed source.
  Deliberately not reconstructed: a plausible wrong shloka in a devotional deck
  is undetectable to the person it misleads.
- **The 48 card faces carry no attribution at all.** The murtis now do.
- **Razorpay is test mode only.** Key id `rzp_test_TTJTVbFWD1ehHQ`, in
  `.env.local` and needed as a function secret too. Live mode needs business
  KYC and is the long pole — **start it now if it has not begun.** Only live
  mode can satisfy "a real one rupee payment credits once", so phase 3 cannot
  close without it.

### Front-end defects, all recorded in `docs/03-APP-FLOW.md` §10

Reports writes to the cart with no way to
open it · question packs charge nothing · Ask AI shows a hardcoded wallet figure
· `/chart` has no back control · consultant metrics disagree with the warnings
citing them, 88% against 68% · **there is no sign-in-only route**, so a
returning user must re-answer the onboarding questions to get a session — the
consultant branch now routes through the same steps to `/pro/apply`, so the
gap is felt on both sides.

**Closed 26 Aug:** the Thursday-only booked-slot bug. Both sides call
`consultant_open_slots()`, and `009_slots_check.sql` asserts the subtraction on
all seven weekdays rather than the one it was written on.

### Deliberate omissions

No audio anywhere — the mandir's sangeet button says so. The chosen murti does
not survive leaving the tab. Bhaktamar is the only deck with real faces. Shani
has three murtis where the rest have four, because pre-modern devotional art of
Shani as a single figure is thin on Commons.

### Tooling, because both cost days

- **The Chrome extension presents as "extension is not connected" when it is
  installed.** It is per Chrome profile: it was on Default and Profile 3 while
  the Claude Code account sits on Profile 1. Install it on the profile signed
  into the same account, then restart Chrome.
- **CDP input dispatch times out on this machine** while screenshots and
  `javascript_tool` work fine. Drive clicks from JS.

Both were logged for weeks as hardware problems. Both were configuration. The
second-account check was the same mistake — recorded three times as "needs a
second SIM" when it needed a project where fake numbers are allowed.

### The risk that keeps repeating

**Front-end features outrun the backend's assumptions.** A product list on
15 Aug added login, payments, ringing calls, consultant-uploaded course
material and an admin panel — none of which can ship without phases 1-13.
Anything new that implies persistence should be logged against a phase before
it is built.

---

## 6. Next — deploy phase 4, then phase 5

Phase 4 is built and walked on dev. Three things stand between it and done, in
this order:

1. **Run the seed.** `backend/seed/seed.mjs`, which needs
   `SUPABASE_SERVICE_ROLE_KEY` — the one credential this repo never holds:

   ```bash
   SUPABASE_URL=https://mrjsatelbuiypodeulcx.supabase.co    SUPABASE_SERVICE_ROLE_KEY=…    node backend/seed/seed.mjs --ref=mrjsatelbuiypodeulcx
   ```

   It refuses unless `--ref` matches the URL, it is idempotent on `legacy_id`,
   and it prints every display-name join that resolved to nothing. **It has
   never run past that guard** — expect to fix something the first time.
   Production takes the same command with the production ref, and lands the six
   `pending` on purpose. Publish them deliberately:
   `update consultants set status='approved' where legacy_id like 'a_';`

2. **Replay `007` through `011` to production**, in order, via the MCP.
   `009_slots_check.sql` is a test and never goes in a replay.

3. **Walk the routes on production** once both are done. `npm run build`
   passing proves almost nothing.

Dev currently carries two hand-made consultants (`legacy_id` `dev:1` and
`dev:2`) on the two test accounts, at bands 5 and 2, with two bookings between
them. They are fixtures for the walk, not the seed, and the seed will not
collide with them.

**Then phase 5 — bookings.** `docs/06-IMPLEMENTATION.md`. The table and its
conflict index already exist; what is missing is the transaction that writes a
row, `orders`, `order_items`, `earnings_ledger`, and the reversing credit a
decline owes once a booking carries money. Per-minute sessions need their meter
here or in phase 11.

**Still owed on phase 3, and it is a clock, not a task:** one real ₹1 live
payment through the deployed site, once Razorpay's website review clears. That
closes phase 3's last done-condition.

**Owed, not blocking:**

- **The reconciliation sweep is still not built.** The one lost payment
  (`order_TTiovPCUcREweJ`) was reconciled by hand, which proves the fix works
  but leaves the next silent loss with no automated catch.
- **The checkout-dismiss path** (`ondismiss()` / `payment.failed()` in
  `topup()`) has never run.
- **If the top-up minimum is ever lowered again for a test payment**, revert it
  in the same session — both `MIN_PAISE` in
  `backend/functions/razorpay-order/index.ts` and the client copy in
  `Wallet.jsx`, redeploy the function, and push. Leaving it lowered is how a
  ₹1 minimum ends up live for real users by accident.

**Three advisor lints on dev are intentional and will reappear on production.**
`consultants_public` and `bookings_view` are owner-rights views — they must be,
since `profiles` is own-row-only and an invoker-rights view would return an
empty name for everyone but yourself; each restricts itself in its own `WHERE`.
`consultant_open_slots` is a `security definer` function callable by `anon`,
which is the entire point of it.

### Owed, not blocking

The phase 1-2 review fixes have not been walked on either project — twelve
fixes across the session gate, `Computing.jsx`, `useProfileFields()`, `AskDate`
and the store. The logic is checked and the build is green; nobody has clicked
them.

**`npm run build` passing proves almost nothing** — no linter, no type checker,
an undefined identifier inside JSX compiles cleanly and throws at runtime. It
has shipped a blank screen twice. Walk the routes.
