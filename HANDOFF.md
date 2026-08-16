# Handoff — Veda (aether-mono)

**What is actually true right now.** Front end and backend in one file, because
two files claiming to describe reality means neither gets trusted.

Updated 16 Aug 2026.

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

39 routes, ~28 screens, two sides in one codebase. Every value on screen comes
from `src/data/mock.js` (51 exports) and `src/data/bhaktamar.js`. **Nothing
survives a reload**, and that is deliberate rather than a gap.

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

---

## 2. Backend

**Nothing is built.** No database, no auth, no server, no network calls.

The work so far is the plan: six documents in `docs/`, written 15 Aug 2026, plus
the rules in `backend/INSTRUCTIONS.md`.

**Next action:** Phase 1 in `docs/06-IMPLEMENTATION.md` — auth and profile. The
smallest slice that makes the app stop forgetting you.

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

## 3. Changed on 16 Aug 2026

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
- **The working tree has uncommitted changes** in `mock.js`, `bhaktamar.js`,
  `Consult.jsx` and `Tarot.jsx` that predate this session's work.
- **Nobody has walked the routes in a browser since the fixes landed.** The build
  passes, which here proves almost nothing.

### Front-end defects, all recorded in `docs/03-APP-FLOW.md` §10

The consultant availability view applies booked slots only on Thursday while the
two seeker views apply them always · Reports writes to the cart with no way to
open it · question packs charge nothing · Ask AI shows a hardcoded wallet figure
· `/chart` has no back control · the consultant feed is the seeker's feed ·
consultant metrics disagree with the warnings citing them, 88% against 68%.

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

## 5. Nothing is in flight

No half-finished branches, no partial migrations, no third-party accounts. The
next person starts at phase 1.
