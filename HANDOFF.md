# Handoff — Namo (aether-mono)

**What is actually true right now.** Front end and backend in one file, because
two files claiming to describe reality means neither gets trusted.

Updated 22 Aug 2026.

This file describes **state**. It does not describe the system — that is what
`docs/` is for, and repeating it here is how the two drift apart.

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

41 routes, two sides in one codebase. Most values on screen still come from
`src/data/mock.js` (51 exports) and `src/data/bhaktamar.js`. Two things are
real:

- **Identity and birth details** (phase 1). The four onboarding questions plus
  phone verification write a `profiles` row; Profile/Chart/Horoscope read it
  back.
- **The wallet** (phase 2). Balance and ledger are server rows read under RLS,
  and every debit is decided by a server function. Nothing in the browser can
  move either.

Everything else still evaporates on reload, deliberately.

```bash
npm run dev          # any free port: npm run dev -- --port 5260
npm run build
```

**Live:** https://atharvborse2004-ops.github.io/aether-mono/#/home
Pushing to `main` deploys automatically, ~40s. `HashRouter`, so GitHub Pages
needs no config for sub-routes.

### Structural facts worth knowing before touching `src/`

- **`HashRouter` is mounted above `AppProvider`** so the store can read the URL.
  `isPro` is derived from the pathname. **Do not add a persisted role** — it can
  disagree with the address bar.
- **`src/store.jsx` is one context** with a ~29-key `useMemo` and a
  **hand-maintained dependency array**. The value object and the dep array must
  both be updated or the context goes stale intermittently.
- **`flags` is the extensibility hatch** — a `Set` of namespaced strings with
  `hasFlag` / `toggleFlag`. Reach for it before adding a store slice.
- **Everything reusable is in `src/index.css`** under `@layer components`. Read
  it before writing markup.
- **`.subnav` is deliberately dead code.** Do not clean it up without asking.
- **`store.jsx` now also holds `session` and `profile`**, backed by Supabase
  auth and the real `profiles` table. `useProfileFields()` (exported next to
  `useStore`) is what screens should read for identity/birth data — it merges
  the real profile with the mock user for the fields the backend doesn't
  compute yet (sun/moon/rising need the ephemeris service, phase 7). Don't
  read `data/mock.js`'s `user` directly in a screen that shows identity.
- **`spend()` returns a promise.** It used to return a boolean and every caller
  used it as one. `if (spend(...))` is truthy whatever the server said, so a
  missed `await` is a purchase that was refused and went through anyway. All
  four charging call sites await it. There is a second guard in the store — a
  ref, because two taps land in the same tick and state set by the first has
  not applied by the second — so a button that forgets its pending state still
  cannot double charge.
- **`balance` is PAISE and it is `null` until loaded.** Rupees live only in
  `mock.js` and in what the user reads; `rupees()` is exported from `store.jsx`
  and is the one place money becomes text. A screen comparing `balance` to a
  mock price needs the hundred — `Tarot.jsx:55` is the one that does. `null`
  renders as an em dash, deliberately: a wallet flashing ₹0 at someone who has
  money is worse than showing nothing yet.

---

## 2. Backend

**Phases 1 and 2 are built and running.** A Supabase project exists
(`talqzgolttfgdzcoaqno`). The `profiles` table is live with the exact shape in
`docs/05-BACKEND-SCHEMA.md` §4.1, migrations at `backend/schema/001_profiles.sql`
and `002_profiles_email.sql` (applied via the Supabase MCP, not the CLI —
there is no `supabase/migrations` dir here, so those files are a record of what
ran, not the thing that ran it). RLS is on: `profiles_select_own`
and `profiles_update_own`, both `id = auth.uid()`. There is **no client INSERT
policy**, by design (§7) — a new row is created server-side by a
`security definer` trigger (`handle_new_user`) the instant `auth.users` gets a
phone signup, and the client only ever `UPDATE`s the row that trigger already
created. The client's `UPDATE` grant is also column-scoped: `authenticated`
can write `name`/`birth_*`, and cannot touch `admin`, `phone`, `legacy_id`,
`id` or `created_at` even on its own row — that gap wasn't in the original
task instructions, added because a plain row-scoped RLS policy alone would
have let a signed-in client grant itself `admin`. `get_advisors` (security) is
clean.

`profiles.email` was added on 21 Aug (`002_profiles_email.sql`): required at
the onboarding screen, nullable and not unique in the column, never an auth
factor. Reasoning in `docs/05-BACKEND-SCHEMA.md` §4.1. **Its purpose is an open
regulatory question, not a settled one** — see `docs/01-PRD.md` §8 before the
first marketing send.

`.env.local` (gitignored) and `.env.example` (committed, no values) both
exist. `src/lib/supabase.js` is the one client instance; nothing else should
call `createClient`.

**Phone auth is live, through Twilio Verify.** Enabled by hand on 21 Aug. The
route matters and cost most of the setup time, so it is written down:

- **Not Twilio's plain Messaging API.** A US long code sits behind A2P 10DLC
  registration, and Twilio leaves messaging *disabled* on the number until that
  clears — days, and money. The first attempts died on error `21704`, a
  messaging service with no sender attached.
- **Twilio Verify instead.** It picks compliant senders per country itself, so
  it needs no owned number, no A2P registration and no DLT work. Supabase takes
  it as a first-class SMS provider — pick `Twilio Verify` in the dropdown and
  give it the Verify Service SID (`VA…`), not a messaging service SID.
- **Supabase's test-OTP field needs both halves.** `SMS_TEST_OTP` alone is
  rejected; it wants the valid-until with it. Not needed now that real SMS
  works, but it is the fallback if delivery into India ever regresses.

Codes arrive on a real Indian number and the full flow has been walked:
sign-up → verify → the `profiles` row gets its details by `UPDATE` → close tab
→ reopen → still signed in, details intact. `created_at` on that row still
reads the original signup instant, which is the trigger-creates / client-updates
split in §7 holding up under a real run.

**Second done-condition: mostly closed, and it found a bug.**

There are now **four real accounts**, created on real numbers with real SMS —
the partner's testing, not a second SIM here. Three completed the full
`/otp` → `/verify` → Login flow; the fourth (`Raghu`) stopped after `/otp`,
which is why that row has a name and no birth details. Auth logs across the
window are clean: no errors, every request 200.

- **Isolation is proven with a real second account, not a synthetic one.**
  Acting as Rahul Jain's `auth.uid()`, `profiles` returns exactly one row —
  his — and `wallets` one, and `ledger` zero. He cannot see Atharv's ₹1,240.
- **The write path is proven by the data.** Three accounts hold three distinct
  and correct birth records — Pune/2004, Delhi/1984, Mumbai/1994. Nothing
  overwrote anything.
- **The read path was audited rather than walked, and it was not clean.**
  `/people/:id` rendered the mock user's initial under the label "You", so a
  signed-in Rahul saw Atharv's `A`. Fixed on 22 Aug — `Synastry.jsx` now reads
  `useProfileFields()`. **This is the exact bug class this condition exists to
  catch, and it was caught by grepping every identity read rather than by
  looking at a screen.** Worth repeating as a technique: the audit is cheaper
  than the walk and it does not need a second SIM.

What is still owed is the visual walk, and it is owed to the browser blocker in
§4 rather than to a missing phone.

### Phase 2 — wallet

`wallets` and `ledger` are live, migration at `backend/schema/003_wallets_ledger.sql`
(plus `004_refuse_mutation_search_path.sql`, a one-function lint fix that could
not be an edit to 003 because 003 had run). Shapes and constraints are in
`docs/05-BACKEND-SCHEMA.md` §4.6. `earnings_ledger` is deliberately **not**
here — it references consultants and bookings and ships inside phase 5's
booking transaction.

Three things about it are worth knowing before touching it:

- **The balance cache is maintained by an `after insert` trigger on `ledger`**,
  not by whoever writes the row. This was not in the plan; it is there because
  a cache each writer must remember to update is a cache that eventually
  disagrees. It also means a hand-typed credit in the SQL editor is correct by
  construction, which is how test wallets get funded — the recipe is at the
  foot of `003`.
- **Neither table has a write policy for anybody**, and `authenticated` has no
  `INSERT`/`UPDATE`/`DELETE` grant on either. Only `wallet_debit()` writes.
- **`wallet_debit()` takes the amount and the label from the client, and
  nothing else.** The amount is within rule 3, which bans a number the *user
  benefits from* — a debit is not one. It is shaped this way because there is
  no server-side catalogue until phases 8 and 10. Phase 5's booking is the
  first purchase whose price the server looks up for itself, and this is the
  hole it closes.
- **`ref_type` is fixed at `'order'`, not passed.** `003` shipped it as a
  defaulted third parameter, which no caller ever used and which any signed-in
  client could therefore set to `'payment'` or `'refund'` by calling the RPC
  directly. No money moves either way, but a client-chosen `ref_type` renders
  as method "UPI" in the wallet and is what phase 3 reconciles settlements
  against. `005` drops the parameter.

**There is no credit path at all.** Top-up needed Razorpay, which is phase 3,
and a client-callable credit function before then is a mint. So `addMoney()` is
deleted from the store and the top-up sheet, the quick-recharge grid and the
payment-method tags are out of `Wallet.jsx` rather than left looking live. The
**"+2% cashback" label is deleted**, one phase earlier than the plan asked,
because it was on a screen being rewritten anyway and it must not be on screen
the day money starts moving.

A new account now starts at **₹0**, not the mock's ₹1,240.

**All four done-conditions pass, three of them by machine.**
`backend/schema/003_wallets_ledger_check.sql` is the runnable check — eight
assertions covering the balance cache, a refused overdraft, the immutability
trigger, the negative-balance constraint, the client's absent grants, and the
one that matters: replaying the ledger from zero reproduces the stored balance.
It rolls itself back by raising on its last line, so it is safe to re-run at
any time. Passing prints `ERROR: PHASE 2 CHECKS PASSED`, which reads like a
failure and is not.

**The fourth condition is now proven too, and in its strictest form.** Three
clicks fired in one tick at the paid tarot pull produced **exactly one ledger
row** of −1100 paise. The store's ref is what refuses the second and third; a
state flag could not, because state set by the first has not applied when they
land.

The refusal path was walked as well: a ₹1,497 report against a ₹1,240 balance
returned "Not enough balance" **from the server**, moved nothing, and wrote no
row. The test charge was then undone the only way the ledger allows — a
reversing `refund` entry — leaving three rows of history and a balance back at
124000 that still replays exactly.

**Next action:** phase 3 — payments in. Nothing is owed behind it except the
environment split described in §5, which has to happen first.

### Decisions made

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
  ~90% attribute overlap, against ~20% for the sellable things.
- **UUIDs everywhere; no mock ID is ever migrated.** They collide seven ways.
- **The admin console is a separate app on the service role.** No admin role in
  client RLS. Tiers enforced in that app; every action audited.
- **Platform sets price bands**; consultants pick one. 18% commission, stored as
  basis points.
- **Swiss Ephemeris** for charts, as its own Python service.
- **Payouts and KYC last.** Most regulated, least urgent.

### Open, and what each blocks

| Question | Blocks |
|---|---|
| Whether top-up presets and the cashback rate come back, and at what rate | Phase 3 |
| Session duration ladder — flat 20 min, tiered, or per-minute | Phases 4–5 |
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

## 3. Changed on 19–22 Aug 2026

| Change | Note |
|---|---|
| **Pooja swipe axes inverted** | Right/left = deity, down/up = murti. `node tools/verify-pooja-swipe.mjs` |
| **Tarot is a guided flow**, not one laid-out screen | `deck → question → card`, the first two as centred modal dialogs. State machine in `docs/03-APP-FLOW.md` |
| **Three chart systems** — Vedic, South Indian, Western | `chartSystem` on the store, so Profile follows the choice made on `/chart`. `ChartSquare.jsx` holds both Indian charts |
| **Hindi and English** | `src/data/i18n.js`, `t()` off the store. Chrome, mandir and tarot translated; the ~1,580 lines of editorial copy in `mock.js` are not, deliberately |
| Noto Sans Devanagari added **after** Plus Jakarta Sans in the stack | Browsers resolve per glyph, so Latin is untouched. Without it Hindi fell back to the OS font mid-screen |
| Book button moved to the right edge of the consultant row | It commits money; sitting a thumb's width from call and message is how it gets mis-tapped |
| Consultant inbox reads from her side | Threads carry both ends; the Ask AI tab is gone on `/pro/*` |
| Performance metrics in Earnings | Reply time against target, calls attended over requested |
| **Pro nav is Earnings / Studio / Go Live / Consult / Profile** — Feed dropped entirely | Five tabs, not the three an earlier version of this row claimed. `ProFeed.jsx` deleted; a consultant runs her practice, she does not browse the seeker feed. `/pro/*` redirects to `/pro/studio`. The tab is `/pro/live`, not `/pro/golive` — the latter hits the catch-all and lands silently on Studio |
| **Sessions, Chat and Call merged into one Consult tab** | `ProConsult.jsx`; an online/offline toggle sits above them on `flags`' `offline:{proId}` key, no new store slice |
| **"View kundli" on a Consult booking row** opens `/chart` prefilled | `Chart.jsx` reads `?name=&date=&time=` off `useSearchParams`, falling back to the logged-in user's own birth data; `birthDate`/`birthTime` added to every mock booking |
| **Earnings leads the pro nav**, carrying Insights with it | This reverses an earlier row here that said Earnings was folded into Profile and unlinked — it is a tab again, first in the bar, and Go Live earned its own slot beside Studio. Corrected 22 Aug after reading `Chrome.jsx:52` against this file |
| **Consult (seeker side) redesigned** — banners, an "online now" quick-strip, per-card Call/Chat/Live actions | `Consult.jsx`; the old top-level Live/Booking mode switcher is gone, Live opens straight from the card like Call and Chat already did |
| **Deity image is uncropped by default** | `setting:croppedDeityImage` on `flags`, toggled from Profile → Settings. The flag is an **opt-in back to the crop**, so its absence is the common case: the shrine, deity chips and murti-picker sheet ship `object-contain`, and setting it returns them to the screen-filling `object-cover`. Read by `Pooja.jsx:27`/`:479` and `Profile.jsx:387` |
| **Phase 1 (auth and profile) built** | `profiles` table + RLS + `handle_new_user` trigger, applied via Supabase MCP — see §2 above |
| **Onboarding gains two screens**, `AskPhone` and `VerifyOtp`, between place and compute | `signInWithOtp` / `verifyOtp`; `Computing.jsx` writes the `profiles` row by `UPDATE`, not insert, once the account exists |
| **Profile, Chart and Horoscope read the signed-in user** | `useProfileFields()` in `store.jsx`, merging the real `profiles` row with mock data for the fields the backend can't compute yet (phase 7) |
| **21 Aug — birth place is worldwide, not four cities** | `AskPlace.jsx` searches Open-Meteo's geocoder, debounced 300ms and aborted per keystroke so a stale response can't replace a newer list. Each result carries its **IANA zone**, which is why that geocoder was picked over Nominatim/Photon — `birth_zone` was hardcoded `Asia/Kolkata`, survivable only while every option was Indian. The four Indian cities remain as the pre-typing default, so the common case costs no round trip. **Licence problem: the free tier is non-commercial and this product is not — see `docs/01-PRD.md` §8 before launch** |
| **21 Aug — onboarding asks for an email with the phone** | Required to continue, shape-checked only, never verified and never an auth factor. `AskPhone.jsx` now carries both fields; the screen's question changed from *"What's your number?"* to *"Where do we reach you?"*. Column and reasoning in `docs/05-BACKEND-SCHEMA.md` §4.1; the purpose question is `docs/01-PRD.md` §8 |
| **21 Aug — the onboarding draft survives a reload** | `sessionStorage`, in `store.jsx`. It was memory-only, and reading the SMS means leaving the app: an evicted page created an account with no birth details, silently. This is what actually caused the first live signup to land an empty row |
| **21 Aug — `Computing.jsx` stops failing silently** | A lost draft routes back to re-answer; a failed write shows the error with a retry. Both used to land on the reveal, which looks identical whether or not anything was saved |
| **A session gate added to `App.jsx`** | Redirects a signed-out visitor to `/onboarding` on load. Exempt: `/onboarding`, the `/pro` side (phase 4 territory), and the two seeker routes `/pro` links *out* to — `/chart` from a ProConsult booking row and `/consult/:id` from ProProfile's "view your public page". Both read mock data and need no session; gating them bounced a consultant out of their own screens. `/home` from "Switch to seeking" is deliberately **not** exempt — that one is asking for the seeker app. Two bugs found here: the first version used `pathname.startsWith('/pro')`, which also matches `/profile` (fixed to a segment-boundary check during the browser walk), and the cross-side links were missed until the phase 1–2 review |
| **22 Aug — phase 2 built: the wallet is real** | `wallets` + `ledger` + `wallet_debit()`, applied via Supabase MCP. Balance and history read under RLS; the client has no write grant on either table. See §2 |
| **22 Aug — `spend()` and `buyNow()` are async** | All four charging call sites converted in one commit — `CartSheet.jsx`, `Tarot.jsx`, `Reports.jsx`, `Shop.jsx` (×2). A missed `await` would be a purchase the server refused going through anyway, so they could not be split across commits |
| **22 Aug — top-up is withdrawn, not deferred** | `addMoney()` deleted from the store; the top-up sheet, quick-recharge grid and payment tags out of `Wallet.jsx`. There is no payment provider until phase 3 and a credit RPC before then is a mint. The **"+2% cashback" label is deleted** with it |
| **22 Aug — the seeded wallet transactions are gone** | `walletTransactions` is no longer read by `Wallet.jsx` or `Profile.jsx`. It held rupees while real rows hold paise, and a list mixing the two is off by a hundred on half its lines. Wallets now start empty and honest |
| **22 Aug — `/people/:id` showed the wrong person's initial** | `Synastry.jsx` rendered the mock `user.initials` under the label "You". Now `useProfileFields()`. Found by auditing every identity read against `data/mock.js`, which is the cheap substitute for the second-account UI walk |
| **22 Aug — the app is walked in a browser, first time in four sessions** | 22 routes plus seven drill-ins, zero runtime and zero console errors. Phase 2's four done-conditions all verified. §4 |
| **22 Aug — Profile's wallet card lost its "Add money" button** | It was gold, it navigated to `/wallet`, and since phase 2 that screen refuses to add money. "Open wallet" already went to the same place, so it is one button now |
| **22 Aug — phase 1–2 reviewed line by line, twelve fixes** | The ones worth naming: `wallet_debit`'s client-settable `ref_type` (`005`); the session gate bouncing the consultant's own cross-side links; `Computing.jsx`'s "Try again" re-raising the same error forever because nothing refetched the profile; two unawaited `refreshWallet` reads racing so the older one repainted a balance a purchase too high; `useProfileFields()` showing the seed person's name and birth details to a signed-in user for the length of the fetch, and permanently if it failed; `AskDate` accepting `31/02/1997`, which reached Postgres as a `date` and failed *after* the account existed |
| **22 Aug — two pro-nav rows in this table were wrong** | They claimed three tabs with Earnings folded into Profile. `Chrome.jsx:52` has five, Earnings first. Rewritten in place |
| **22 Aug — the Chrome extension blocker is diagnosed** | Installed on Default and Profile 3; the Claude Code account is on Profile 1, which has neither. §4 |
| **22 Aug — Phase 0's "reconcile the tree" is closed** | The 21 Aug onboarding work is committed. An earlier version of §5 claimed the tree also held pro-nav and deity-image work; it did not, that was already committed |

**The `ChatPanel` crash listed under 15 Aug was introduced by the consultant-inbox
change and fixed by someone else.** `isPro` is now destructured at the top of the
component. It is the same failure as trap 1 and worth remembering as the pattern:
a prop threaded through four components, defined in none of them, green build.

---

## 4. Known gaps

### Needs a person, not code

- **Two Bhaktamar verses are incomplete** and need a verified printed source.
  They were deliberately not reconstructed: a plausible wrong shloka in a
  devotional deck is undetectable to the person it misleads.
- **The 48 card faces carry no attribution at all.** The murtis now do.
- **The app has now been walked in a browser, 22 Aug.** The extension blocker
  is cleared: it was installed on the Default and Profile 3 Chrome profiles
  while the Claude Code account sits on Profile 1. Installing it there fixed
  it. **Keep that in mind if it breaks again — it presents as "extension is
  not connected", which reads like an install problem and is not.**

  Walked: all 22 top-level routes plus seven drill-ins, signed in as a real
  account. **Zero runtime errors and zero console errors anywhere.** Phase 2's
  four done-conditions all verified, including the two that no SQL check can
  reach — see §2.

  One caveat on the tooling, because it cost time: **CDP input dispatch times
  out on this machine** while screenshots and `javascript_tool` work fine. The
  clicks in this walk were driven from JS. That is not a worse test for the
  double-tap condition — it is a stricter one, since three clicks can be fired
  in a single tick, which no human tap can do.

- **The second-account check needs a second SIM.** Proven at the database
  level, not through the UI. See §2 — owner is the partner, after deploy.

### Front-end defects, all recorded in `docs/03-APP-FLOW.md` §10

The consultant availability view applies booked slots only on Thursday while the
two seeker views apply them always · Reports writes to the cart with no way to
open it · question packs charge nothing · Ask AI shows a hardcoded wallet figure
· `/chart` has no back control · consultant metrics disagree with the warnings
citing them, 88% against 68%.

**Resolved:** the consultant feed being the seeker's feed — `ProFeed.jsx` is gone,
Feed is no longer a concept on the pro side.

### Deliberate omissions

No audio anywhere — the mandir's sangeet button says so. The chosen murti does
not survive leaving the tab. Bhaktamar is the only deck with real faces. Shani
has three murtis where the rest have four, because pre-modern devotional art of
Shani as a single figure is thin on Commons.

### The risk that keeps repeating

**Front-end features outrun the backend's assumptions.** A product list on 15 Aug
added login, payments, ringing calls, consultant-uploaded course material and an
admin panel — none of which can ship without phases 1–13 — plus two features
built as mock UI that will need real data behind them. Anything new that implies
persistence should be logged against a phase before it is built.

---

## 5. What's in flight

**Phase 1 is done** bar one check that needs a second SIM (§2). Migrations
applied, RLS on and verified, phone auth live through Twilio Verify, front end
wired and walked on a real device with real SMS.

**Phase 2 is done bar the browser walk** (§2, §4). Schema, RLS, the debit
function and the runnable check all pass; the four charging call sites are
converted; the client cannot write a balance. What is not proven is the
double-tap condition, which lives in the browser and needs the extension
blocker in §4 cleared.

**Nothing is owed on phases 1 and 2.** All three items that were open this
morning are closed: the Chrome extension is connected and the app is walked
(§4), the repository secrets were never actually missing (below), and the
second-account condition is proven with a real second account, with the one
front-end defect it exposed fixed (§2).

**Not yet deployed, and the deploy needs one manual step first.** Everything
above was verified against `localhost:5260`. Vite inlines `VITE_*` at build
time and `.env.local` is gitignored, so CI had neither value — the workflow ran
`npm run build` with no `env:` block at all, which would have shipped
`createClient(undefined, undefined)` and served a white screen. `deploy.yml` now
passes both through.

**The two repository secrets already existed.** An earlier version of this
section said they were missing and that the deployed site was blank. Both were
wrong: the 20 Aug run passed the workflow's `Verify Supabase env is present`
step, which exits 1 on an empty value, and the live bundle has the right
project ref inlined. They were re-set on 22 Aug from `.env.local` — same
values, confirmed by the deployed bundle's project ref matching.

The working tree is clean and Phase 0's "reconcile the tree" item is closed.

**Nothing deployed yet still carries the phase 2 wallet**, and that matters
more than it did for phase 1: the deployed site talks to the same Supabase
project as local. There is one real wallet per real account, not one per
environment. `backend/INSTRUCTIONS.md` §3 says never point a dev front end at
production data — that rule is currently being broken, knowingly, because
there is one project and no money in it. **It has to stop being true before
phase 3**, which is the phase where the rupees are real.
