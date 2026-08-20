# Handoff — Namo (aether-mono)

**What is actually true right now.** Front end and backend in one file, because
two files claiming to describe reality means neither gets trusted.

Updated 21 Aug 2026.

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

41 routes, two sides in one codebase. Every value on screen still comes from
`src/data/mock.js` (51 exports) and `src/data/bhaktamar.js` — **except**
identity and birth details, which are real now (phase 1, below): the four
onboarding questions plus phone verification write a `profiles` row, and
Profile/Chart/Horoscope read it back. Everything else still evaporates on
reload, deliberately.

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

---

## 2. Backend

**Phase 1 is built and running.** A Supabase project exists
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

**Second done-condition is not walked.** A second account seeing only its own
data is proven at the database level — acting as a different `auth.uid()`,
`profiles` returns zero rows, and the column grant refuses `admin = true` even
on the caller's own row — but nobody has done it through the UI with a real
second account, because there is only one SIM here. That check cannot catch a
front-end bug where a screen reads the wrong user, which is the class this repo
has no linter to catch. **Owner: partner, after deploy.**

**Next action:** that second-account walk. Then phase 2 — wallet.

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

## 3. Changed on 19–21 Aug 2026

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
| **Pro nav is Studio / Consult / Profile** — Feed dropped entirely | `ProFeed.jsx` deleted; a consultant runs her practice, she does not browse the seeker feed. `/pro/*` now redirects to `/pro/studio` |
| **Sessions, Chat and Call merged into one Consult tab** | `ProConsult.jsx`; an online/offline toggle sits above them on `flags`' `offline:{proId}` key, no new store slice |
| **"View kundli" on a Consult booking row** opens `/chart` prefilled | `Chart.jsx` reads `?name=&date=&time=` off `useSearchParams`, falling back to the logged-in user's own birth data; `birthDate`/`birthTime` added to every mock booking |
| **Earnings folded into Profile**, nav down to three tabs | `/pro/earnings` still routes for deep links; nothing links to it from the UI |
| **Consult (seeker side) redesigned** — banners, an "online now" quick-strip, per-card Call/Chat/Live actions | `Consult.jsx`; the old top-level Live/Booking mode switcher is gone, Live opens straight from the card like Call and Chat already did |
| **Deity image is uncropped by default** | `setting:croppedDeityImage` on `flags`, toggled from Profile → Settings. The flag is an **opt-in back to the crop**, so its absence is the common case: the shrine, deity chips and murti-picker sheet ship `object-contain`, and setting it returns them to the screen-filling `object-cover`. Read by `Pooja.jsx:27`/`:479` and `Profile.jsx:387` |
| **Phase 1 (auth and profile) built** | `profiles` table + RLS + `handle_new_user` trigger, applied via Supabase MCP — see §2 above |
| **Onboarding gains two screens**, `AskPhone` and `VerifyOtp`, between place and compute | `signInWithOtp` / `verifyOtp`; `Computing.jsx` writes the `profiles` row by `UPDATE`, not insert, once the account exists |
| **Profile, Chart and Horoscope read the signed-in user** | `useProfileFields()` in `store.jsx`, merging the real `profiles` row with mock data for the fields the backend can't compute yet (phase 7) |
| **21 Aug — onboarding asks for an email with the phone** | Required to continue, shape-checked only, never verified and never an auth factor. `AskPhone.jsx` now carries both fields; the screen's question changed from *"What's your number?"* to *"Where do we reach you?"*. Column and reasoning in `docs/05-BACKEND-SCHEMA.md` §4.1; the purpose question is `docs/01-PRD.md` §8 |
| **21 Aug — the onboarding draft survives a reload** | `sessionStorage`, in `store.jsx`. It was memory-only, and reading the SMS means leaving the app: an evicted page created an account with no birth details, silently. This is what actually caused the first live signup to land an empty row |
| **21 Aug — `Computing.jsx` stops failing silently** | A lost draft routes back to re-answer; a failed write shows the error with a retry. Both used to land on the reveal, which looks identical whether or not anything was saved |
| **A session gate added to `App.jsx`** | Redirects a signed-out visitor to `/onboarding` on load; the `/pro` side is exempt (phase 4 territory). Caught and fixed during the browser walk: the first version used `pathname.startsWith('/pro')`, which also matches `/profile` — rewritten to a segment-boundary check |

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
- **Nobody has walked the deity-image and pro-nav changes in a browser.** The
  build passes, which here proves almost nothing — the Chrome extension used
  for in-session browser QA has not been connected for two sessions running.
  The phase 1 signup path has now been walked by hand on a real device, end to
  end with real SMS; the rest of the app has not.
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

Phase 1 is done bar one check that needs a second SIM (§2). Migrations applied,
RLS on and verified, phone auth live through Twilio Verify, front end wired and
walked on a real device with real SMS.

**Not yet deployed, and the deploy needs one manual step first.** Everything
above was verified against `localhost:5260`. Vite inlines `VITE_*` at build
time and `.env.local` is gitignored, so CI had neither value — the workflow ran
`npm run build` with no `env:` block at all, which would have shipped
`createClient(undefined, undefined)` and served a white screen. `deploy.yml` now
passes both through.

**Someone has to add the two repository secrets** — Settings → Secrets and
variables → Actions → `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, values
from `.env.local`. Until they exist the deployed site is blank, and it is blank
in a way the build does not complain about.

Separately, the working tree also carries uncommitted front-end work this
session did not make — the pro-nav redesign and the deity-image toggle
recorded in §3's table (`Pooja.jsx`, and per that table's own entries,
`mock.js`, `Tarot.jsx`, `bhaktamar.js`, `Consult.jsx`). Whoever picks this up
next should reconcile with whoever holds that context before committing
either side.
