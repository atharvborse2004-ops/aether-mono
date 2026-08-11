# Handoff — Veda (aether-mono)

Updated 11 Aug 2026. Nothing is half-finished this time: the working tree is
clean and everything below is committed and deployed.

---

## 1. What this is

A front-end prototype of an astrology app. **No backend, no persistence, no
auth** — every string and number lives in `src/data/mock.js` (~1,450 lines) and
`src/data/bhaktamar.js` (the 48-card deck, generated from the supplied master
sheet), and nothing survives a page reload. That is deliberate, not a gap.

Two sides in one codebase:

| Side | Tabs | Who it is for |
|---|---|---|
| **Client / seeker** | Home · Pooja · **Consult** · Shop · Academy | Someone who wants a reading |
| **Consultant / pro** | Feed · Sessions · Studio · Earnings · Profile (`/pro/*`) | The astrologer |

**Stack:** Vite 5 · React 18.3 · Tailwind 3.4 · react-router-dom 6.28 · plain
JSX (no TypeScript). Three runtime deps only — react, react-dom,
react-router-dom. No icon library, no state library, no UI kit.

```bash
cd "C:/Atharv 2/aether-mono"
npm run dev          # any free port: npm run dev -- --port 5260
npm run build
```

**Live:** https://atharvborse2004-ops.github.io/aether-mono/#/home
Pushing to `main` deploys automatically (`.github/workflows/deploy.yml`, ~40s).
**HashRouter**, so every route lives after the `#` and GitHub Pages needs no
config for sub-routes.

---

## 2. Where things stand

Everything requested so far is built, committed and live. There is no
in-flight work. Recent commits, newest first:

| Commit | What |
|---|---|
| `0c77167` | Mandir: full-bleed shrine, real brass props, no scroll |
| `412dd61` | Bhaktamar deck (48 cards) + real murtis in the mandir |
| `f64dda4` | Handoff update; dropped four dead mock exports |
| `4b79a84` | Removed the floating Ask AI button |
| `4d8770a` | Warmer gold + a contrast bug it uncovered |
| `99e932e` | Panchang card, mandir, tarot by tradition, one session length |
| `35a36cb` | Consult absorbed Live; Pooja got a tab; free tools moved to Home |
| `eda88ea` | Pro insights, referrals, week availability, real channels |
| `95eea1f` | Consultant side: `/pro` shell, five screens, onboarding fork |
| `466ecbf` | Full-bleed reels, Instagram-style consultant profile |
| `e8cc1f2` | Instagram-style feed actions |

Earlier: the CRED-light redesign — light canvas, rounded geometry, Plus Jakarta
Sans, skeuomorphic surfaces, frosted ink tab bar.

### Client side, as it stands

- **Home** — four free-tool circles (Horoscope · Ask AI · Tarot · Matching),
  then the feed. The feed leads with **today's reading**, then the
  **panchang**, then content. Those two are hoisted in the component rather
  than reordered in `feed`, so the pointer list stays a list of content.
- **Pooja** — an animated **mandir**, e-puja only, and **the one screen that
  does not scroll**. The shrine takes every pixel between the deity row and
  the tab bar; the ghantis, the offering rail, the altar and the thali all sit
  on the painting. Six deities, three or four murtis each behind the knob in
  the bottom-left. Nothing books a pandit and nothing is charged.
- **Consult** — four modes as circles under the wordmark: Call · Chat · Live ·
  Booking. Live is a mode here, not a tab. **One session length**: 20 minutes,
  unlimited questions, so `price` on a consultant record *is* the session
  price.
- **Shop** — promo banner rail; choosing a category reveals a banner for it and
  its subcategories.
- **Academy** — Courses / Events / Downloads, all three with cover art.
- **Tarot** — five decks by tradition. **Bhaktamar** leads and is the odd one:
  48 painted faces, one per shloka of the stotra, each carrying a Sanskrit
  verse, a transliteration, a question and a remedy. The other four (Western,
  Hindu, Islamic, Buddhist) are six drawn cards each. One free pull a week then
  ₹11, charged through the wallet.

---

## 3. Architecture you need to know

### The shell

`src/App.jsx` — `App` → `AppProvider` → `Frame`. `Frame` is a 420px phone
wrapper (`relative`, `overflow-hidden`, `h-[100dvh]`) holding `<Routes>` plus
four always-mounted overlays that self-gate on store state: `ChatPanel`,
`HoroscopePanel`, `CartSheet`, `Toast`.

Three layouts: `TabLayout` (client tabs), `ProLayout` (`BottomNav tabs={PRO_TABS}`),
`PlainLayout` (onboarding, drill-ins). Adding a route is: import the screen,
drop a `<Route>` in the right group. No route registry.

**Route-order trap:** `/pro/*` → `/pro/feed` and `/live` → `/consult` must stay
**above** the global `*` → `/home` catch-all, or a mistyped pro path silently
dumps a consultant into the client app.

### Role is not state

`HashRouter` is mounted **above** `AppProvider` (`src/main.jsx`), so the store
can call `useLocation()`. `isPro` is derived from the pathname and `me` follows
it. There is deliberately **no persisted role** — the URL is the single source
of truth, deep links work cold, and switching sides is an ordinary `<Link>`.
Do not add a role boolean.

The logged-in consultant is `export const pro = consultants[0]` (Ritu Kashyap,
`a1`), pinned to a real record so her bio, reviews, content and chat thread are
populated with no invented data.

### The store

`src/store.jsx` — one context, `useStore()` throws outside the provider. One
`useMemo` returns a ~29-key object with a **hand-maintained dep array**. Adding
a slice means four edits in that file, and **the value object and the dep array
must both be updated** or the context goes stale intermittently.

`flags` is the extensibility hatch: a `Set` of namespaced strings
(`follow:a1`, `accept:bk1`, `closed:Thu:11:00`, `tarot:usedFree`) with
`hasFlag` / `toggleFlag(key, {on, off})` — sticky toggles and free toasts with
**no new store surface**. Reach for it before adding state. `spend(amount,
label)` handles paid actions and already refuses + toasts when short.

### Design system

Everything reusable is in `src/index.css` under `@layer components`. Read it
before writing markup — most of what you need exists.

`.pop-card` · `.pop-raised` · `.pop-tap` · `.pop-inset` · `.pop-btn`
+ `-sm`/`-gold`/`-ghost` · `.pill` (+ `[aria-pressed]` = pressed switch,
+ `.knob` = icon-only) · `.tile` / `.tile-face` / `.tile-face-on` (circle rows)
· `.seg` · `.subnav` *(defined, currently unused — see below)* · `.rail` ·
`.banner` · `.sheen` · `.plate` · `.badge-live` · `.tick` · `.act-row` ·
`.deal` · `t-heading`/`t-sub`/`t-body`/`t-faint` · `on-ink*` · `.caps` · `.tnum`

**`.subnav` is deliberately dead.** Consult's modes used to live in a bar
pinned above the tab bar; they are circles at the top now. The CSS stays so
reverting is a markup change. Do not "clean it up" without asking.

Components: `Pop.jsx` (`PopCard`, `PopButton`, `Kicker`, `PopTag`, `Stat`,
`PopBar`, `PopAvatar`), `Primitives.jsx` (`Section`, `Button`, `Row`,
`Segmented`, `Ticks`, `Ruler`, `Avatar`, `Field`, `Acts`, `Search`, `Tag`,
`firstName`), `Icon.jsx`, `Plate.jsx`, `PujaProps.jsx`, `ChartWheel.jsx`,
`ReelFeed.jsx`.

`PujaProps.jsx` is the mandir's brass — `Ghanti`, `Thali`, `Marigold`, `Diya`,
`Dhoop`, drawn as objects rather than icons because a line glyph on a shrine
reads as a toolbar. They share one `BRASS` ramp and one light direction; a bell
lit from the left beside a thali lit from above is what makes drawn props look
pasted on. Every gradient id goes through `useId` — these render two and three
at a time and duplicate ids mean the second instance borrows the first's fill.

**Visual language:** warm canvas `#f1efec`, white cards, near-black ink
`#0e0e10`, one gold accent. Skeuomorphic — every raised surface is a ~3%
gradient + a 1px top specular highlight + a soft shadow; every recessed one is
the exact inverse. One light source, from directly above. Presses invert the
gradient rather than just darkening.

**Icons are hand-drawn** in `Icon.jsx` (25 of them). No icon library, and one is
not wanted. An unknown name renders `null` — a missing glyph is a silent blank,
not a crash.

**Images exist in exactly two places**, both shipped from `public/` and
referenced through `import.meta.env.BASE_URL` — never imported, so they stay
out of the bundle graph and only the one on screen is fetched:

| Where | What | Weight |
|---|---|---|
| `public/cards/` | 48 Bhaktamar deck faces, 600×900 | 5.8 MB |
| `public/deities/` | 23 murtis, 3–4 per deity, 600×750 | 2.0 MB |

Everywhere else is still drawn. `Plate.jsx` generates greyscale SVG artwork
procedurally from a seed string and the other four tarot decks use it. Do not
reach for an image URL for anything new; there is still nowhere for one to come
from.

The deity art is public-domain or CC devotional painting off Wikimedia Commons,
muted and warmed by `tools/deity-art-process.py` — rerun that rather than
editing a webp; `tools/deity-art-search.py` is how the candidates were found in
the first place, and prints contact sheets to pick from. Some of it is
**share-alike**, which is why `credit` is a field on every image and why the
line in the murti sheet is not decoration. The shrine itself carries no text,
so that sheet is the only place the attribution lives — if it goes, the images
have to go with it.

### Screen anatomy

Default-exported function, no props. Module-level `const` arrays for config. A
fragment of `<section className="border-b border-rule px-5 py-6">` blocks, each
led by a `<Kicker>`. Local `useState` for screen state; the store only for
cross-screen concerns. Trailing `<div className="h-24" />`. A local `<Sheet>`
last if the screen has one.

`TabHeader` must stay the **first child and a `<header>`** on tab screens —
`.deal > header` swaps its entrance transform for a fade, because a transform
on a sticky element makes it a containing block and un-sticks the bar.

---

## 4. Traps that have already cost time

1. **`npm run build` passing proves almost nothing.** An undefined identifier
   inside JSX is a *runtime* error, not a compile error. This has shipped a
   blank screen once and silently dropped an `import { Link }` once — both with
   a green build. **Always** load the app and walk the routes.

2. **Tailwind cannot see runtime-built class names.** `` `!h-${size}` `` or
   `` `h-[${n}px]` `` produce classes that are never generated. Anything that
   varies goes in inline `style`. Bitten twice.

3. **Scripted multi-edit passes corrupt files.** A sequence of index-based
   splices duplicated half of `Consult.jsx`; the build caught it as an unclosed
   fragment, but it could as easily have been silent. For anything beyond one
   or two replacements, rewrite the file.

4. **Say which surface a contrast number belongs to.** `--gold` carried the
   comment "4.9:1 on canvas". That was its ratio against a white *card*; on the
   canvas it was 4.29:1, under AA, and gold text appears on both.

5. **`followers: '84.2k'` and `views: '312k'` are display strings**, not
   numbers. Do not parse them back to chart them — add the numbers you need
   alongside (`insights.byHour`, `earningsSeries`) and leave the strings.

6. **CSS source order beat specificity once.** `.navbar` set its background
   after an `@supports` block while `.topbar` set it before, so identical
   intent produced one opaque bar and one translucent. Both are declared
   together now.

7. **`.deal` caps its stagger at 8 children.** Anything past the eighth
   top-level section lands together.

8. **Tailwind's opacity modifier silently does nothing on this palette.**
   Every colour resolves through a CSS variable, so `bg-ink/70` cannot be
   computed and Tailwind emits no background at all rather than failing.
   It cost a white label on a cream wall in the mandir. Anything translucent
   goes in an inline `style` with a literal `rgba()`.

---

## 5. Known gaps and deliberate omissions

- **Pro side:** real availability rules, actual payouts, KYC, media upload.
  Studio publishes to a toast; "go live" opens the room that already exists.
- **Client side:** no real payments or accounts. Every commit flow ends in a
  toast and the copy says so.
- **Tarot's "weekly" free pull is a single flag**, not a dated window
  (`tarot:usedFree`). Nothing persists across a reload, so a real week boundary
  needs a clock *and* a store that remembers — add both or neither.
- **`ChatPanel`'s threads are written from the seeker's side.** A consultant
  reading them sees threads named after herself with her own replies marked as
  the other party. ~6 lines to flip on `isPro`. Not done.
- **Sangeet in the mandir plays nothing** — there is no audio anywhere in the
  app. The button toasts and says so.
- **The chosen murti does not survive leaving the tab.** `pic` is local state
  in `Pooja` and resets to 0 on a deity switch. Making it stick is a `flags`
  entry (`murti:d1:2`), not a store slice — but it still dies on reload like
  everything else, so it buys little.
- **Bhaktamar is the only deck with faces**, and it is Jain only. The other
  traditions were always meant to get their own; the card shape already
  supports it — `img`, `sub`, `virtue`, `ask`, `remedy`, `sa`, `iast` are all
  optional and `Tarot.jsx` gates on the field, not the deck.
- **Shani has three murtis, the rest have four.** Pre-modern devotional art of
  Shani as a single figure is thin on Commons; the fourth would have been a
  temple photograph with signage in it.

---

## 6. Verification status — read this

Chrome reaches `localhost` again, so this session's work **was looked at**, not
just queried: the mandir with every deity, the murti picker, the offerings and
their toasts, and a Bhaktamar pull with its shloka block. Screenshots still
break intermittently — `Page.captureScreenshot` times out for a while after you
scroll a page holding a large image. `read_page` never fails; use it when the
camera does.

Everything through commit `99e932e` was verified by **walking the routes and
querying the DOM** — structure, computed styles, click behaviour, contrast
ratios — but almost none of it has been **looked at**. That backlog is still
open for the five pro screens, the Consult mode circles and the panchang card.

## 7. House style for copy

`mock.js` opens with a voice rule every string obeys: second person, present
tense, imperative where possible. No hedging, no emoji, no exclamation marks.
Blunt rather than reassuring — *"A stone does not fix a transit. It is a
reminder you paid for."* Match it; it is most of the product's character.
