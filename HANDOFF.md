# Handoff — Veda (aether-mono)

Written 10 Aug 2026. Read this top to bottom before touching anything; the
"In flight" section is a half-finished change you will trip over otherwise.

---

## 1. What this is

A front-end prototype of an astrology app. **No backend, no persistence, no
auth** — every string and number lives in `src/data/mock.js` (~1,500 lines) and
nothing survives a page reload. That is deliberate, not a gap.

Two sides in one codebase:

| Side | Routes | Who it is for |
|---|---|---|
| **Client / seeker** | `/home`, `/consult`, `/pooja`, `/academy`, `/shop`, … | Someone who wants a reading |
| **Consultant / pro** | `/pro/feed`, `/pro/sessions`, `/pro/studio`, `/pro/earnings`, `/pro/profile` | The astrologer |

**Stack:** Vite 5 · React 18.3 · Tailwind 3.4 · react-router-dom 6.28 · plain
JSX (no TypeScript). Only three runtime deps — react, react-dom,
react-router-dom. There is no icon library, no state library, no UI kit.

```bash
cd "C:/Atharv 2/aether-mono"
npm run dev          # any free port: npm run dev -- --port 5230
npm run build
```

**Live:** https://atharvborse2004-ops.github.io/aether-mono/#/home
Pushing to `main` deploys automatically (`.github/workflows/deploy.yml`, ~40s).
The app uses **HashRouter**, so every route lives after the `#` and GitHub
Pages needs no config for sub-routes.

---

## 2. In flight — START HERE

Three requests came in from CA Rahul Jain and **only the first step of one is
done**. `tailwind.config.js` is modified and uncommitted; nothing consumes it
yet, so the working tree is safe to build but the feature is not begun.

```
 M tailwind.config.js     ← 7 new keyframes, currently unused by any component
?? .claude/               ← local tooling config, do not commit
```

### The three requests, verbatim

> 1. "consult ko center me"
> 2. "can we put these 4 services of consult in circle on top - ek baar karke
>    dekho. how it looks"
> 3. "and all puja will be e-puja only. animated. like shri mandir app. as of
>    now we will not book any actual puja."

### What each means and where it lands

**(1) Consult in the centre of the tab bar.** Currently
`src/components/Chrome.jsx` → `const TABS` reads
`Home · Consult · Pooja · Academy · Shop`. Swap slots 2 and 3 so it becomes
`Home · Pooja · Consult · Academy · Shop`, putting Consult dead centre. One
array reorder — nothing else references tab position.

**(2) Consult's four modes become circles on top.** They are currently a
sub-nav pinned above the tab bar (`.subnav` / `.subnav-item` in
`src/index.css`, rendered near the bottom of `src/screens/Consult.jsx`). Move
them to a circle row at the top of the screen using the existing `.tile` /
`.tile-face` pattern — the same one `Home.jsx` uses for its free-tools row, so
copy that markup rather than inventing a second shape. `const MODES` in
`Consult.jsx` already has the right four entries with icons.

He said "ek baar karke dekho" — this is an experiment. **Keep the `.subnav` CSS
in `index.css` even after removing its usage**, so switching back is a markup
change rather than a rebuild.

**(3) Pooja becomes e-puja only, animated, Shri Mandir style. Nothing is
booked.** This is the real work and it is not started.

`src/screens/Pooja.jsx` currently books a *physical* pooja — a pandit, samagri,
a time slot, a confirmation sheet. All of that must go. Replace with an
animated on-screen shrine you interact with:

- Pick a deity (a circle row again — Ganesh, Shiva, Lakshmi, Hanuman, Shani
  reads well for an astrology app, since they map to graha remedies)
- A drawn shrine in the middle
- Offerings you tap: **bell, flower, diya, incense, aarti**, each firing its
  animation
- Copy must say plainly that this is an e-puja and nothing is booked

The seven keyframes for this are already in `tailwind.config.js`, unused:

| Class | What it is for |
|---|---|
| `animate-flicker` | Diya flame. Leans and narrows rather than pulsing evenly |
| `animate-petal` | One falling petal. Slips sideways and turns over; `forwards` |
| `animate-swing` | Bell, on tap |
| `animate-aarti` | Lamp travelling the traditional circle in front of the idol |
| `animate-halo` | Slow glow behind the deity |
| `animate-ripple` | One expanding ring when an offering lands; `forwards` |
| `animate-smoke` | Incense |

**There are no images anywhere in this app.** `Plate.jsx` generates greyscale
SVG artwork procedurally from a seed string. The shrine must be drawn as SVG or
built from CSS — do not reach for an image URL, there is nowhere for it to come
from. A stylised arched niche in the engraved register the rest of the app uses
will fit better than an attempt at photoreal deity art.

New mock data needed: a `deities` array and an `offerings` array. Delete
`poojas`, `poojaCategories` and `poojaIncludes` — they describe a physical
booking that no longer exists.

---

## 3. Architecture you need to know

### The shell

`src/App.jsx` — `App` → `AppProvider` → `Frame`. `Frame` is a 420px phone
wrapper (`relative`, `overflow-hidden`, `h-[100dvh]`) holding `<Routes>` plus
four always-mounted overlays that self-gate on store state: `ChatPanel`,
`HoroscopePanel`, `CartSheet`, `Toast`.

Three layouts:

- `TabLayout` — `<main>` + `AskAiButton` + `BottomNav` (client tabs)
- `ProLayout` — same minus `AskAiButton` (`BottomNav tabs={PRO_TABS}`)
- `PlainLayout` — `<main>` only (onboarding, drill-ins)

Adding a route is: import the screen, drop a `<Route>` in the right group.
There is no route registry.

**Route-order trap:** `/pro/*` → `/pro/feed` and `/live` → `/consult` must stay
**above** the global `*` → `/home` catch-all. Without that, a mistyped pro path
silently dumps a consultant into the client app.

### Role is not state

`HashRouter` is mounted **above** `AppProvider` (`src/main.jsx`), so the store
can call `useLocation()`. `isPro` is derived from the pathname and `me` follows
it:

```js
const isPro = useLocation().pathname.startsWith('/pro')
const me = isPro ? { ...pro, profileTo: '/pro/profile' } : { ...user, profileTo: '/profile' }
```

There is deliberately **no persisted role**. The URL is the single source of
truth, deep links work on a cold load, and switching sides is an ordinary
`<Link>`. Do not add a role boolean to the store.

The logged-in consultant is `export const pro = consultants[0]` (Ritu Kashyap,
`a1`) — pinned to a real record so her bio, reviews, content, price ladder and
chat thread are all populated with no invented data.

### The store

`src/store.jsx` — one context, `useStore()` throws outside the provider. One
`useMemo` returns a ~29-key object with a **hand-maintained dep array**. Adding
a slice means four edits in that file, and **the value object and the dep array
must both be updated** or the context goes stale intermittently.

`flags` is the extensibility hatch: a `Set` of namespaced strings
(`follow:a1`, `save:po2`, `accept:bk1`, `closed:Thu:11:00`) with
`hasFlag(key)` / `toggleFlag(key, {on, off})`. It gives sticky-across-navigation
toggles and free toasts with **no new store surface**. Reach for it before
adding state.

### Design system

Everything reusable is in `src/index.css` under `@layer components`. Read it
before writing any markup — most of what you need exists.

`.pop-card` · `.pop-raised` · `.pop-tap` · `.pop-inset` (a recessed well) ·
`.pop-btn` + `-sm`/`-gold`/`-ghost` · `.pill` (+ `[aria-pressed=true]` = pressed
switch, + `.knob` = icon-only) · `.tile` / `.tile-face` (circle row) · `.seg` /
`.seg-item` · `.subnav` / `.subnav-item` · `.rail` · `.banner` · `.plate` ·
`.badge-live` · `.tick` · `.act-row` · `.deal` (staggered entrance) ·
`t-heading`/`t-sub`/`t-body`/`t-faint` · `on-ink*` · `.caps`/`.caps-sm` ·
`.tnum`

Components: `Pop.jsx` (`PopCard`, `PopButton`, `Kicker`, `PopTag`, `Stat`,
`PopBar`, `PopAvatar`), `Primitives.jsx` (`Section`, `Button`, `Row`,
`Segmented`, `Ticks`, `Ruler`, `Avatar`, `Field`, `Acts`, `Search`, `Tag`,
`firstName`), `Icon.jsx`, `Plate.jsx`, `ChartWheel.jsx`, `ReelFeed.jsx`.

**Visual language:** warm light canvas `#f1efec`, white cards, near-black ink
`#0e0e10`, one gold accent. Skeuomorphic — every raised surface is a ~3%
gradient + a 1px top specular highlight + a soft shadow, and every recessed one
is the exact inverse. One light source, from directly above. Presses invert the
gradient rather than just darkening.

**Icons are hand-drawn** in `Icon.jsx` (23 of them, 24-unit box, round caps,
`currentColor`). There is no icon library and adding one is not wanted. An
unknown name renders `null` — a missing glyph is a silent blank, not a crash.

### Screen anatomy

Default-exported function, no props. Module-level `const` arrays for config.
A fragment of `<section className="border-b border-rule px-5 py-6">` blocks,
each led by a `<Kicker>`. Local `useState` for screen state; the store only for
cross-screen concerns. Trailing `<div className="h-24" />` to clear the
floating button. A local `<Sheet>` last if the screen has one.

`TabHeader` must stay the **first child and a `<header>`** on tab screens —
`.deal > header` swaps its entrance transform for a fade, because a transform
on a sticky element makes it a containing block and un-sticks the bar.

---

## 4. Traps that have already cost time

1. **`npm run build` passing proves almost nothing.** An undefined identifier
   inside JSX is a *runtime* error, not a compile error. A blank Academy screen
   shipped this way. **Always** load the app and walk the routes.

2. **Tailwind cannot see runtime-built class names.** ``` `!h-${size}` ``` or
   ``` `h-[${n}px]` ``` produce classes that are never generated. Widths and
   heights that vary go in inline `style`. This has bitten twice.

3. **`followers: '84.2k'` and `views: '312k'` are display strings**, not
   numbers. Do not parse them back to chart them — add the numbers you need
   alongside (see `insights.byHour`, `earningsSeries`) and leave the strings.

4. **CSS source order beat specificity once already.** `.navbar` set its
   background *after* an `@supports` block while `.topbar` set it before, so
   one stayed opaque and the other went translucent from identical intent. Both
   bars are now declared together, once, after both rule blocks.

5. **`.deal` caps its stagger at 8 children.** A screen with more top-level
   sections has everything past the eighth land together.

6. **Contrast on the frosted bars.** Gold caps measure 2.8:1 on the tab bar,
   which is why the active tab is white + heavier weight + a gold indicator bar
   rather than gold text. Measure against the bar's *lightest* composite before
   putting a colour on it.

---

## 5. Recent history (newest first)

| Commit | What |
|---|---|
| `35a36cb` | Consult absorbed Live behind a sub-nav; Pooja got a tab; free tools moved to Home as circles; real Tarot screen |
| `eda88ea` | Pro insights, referrals, week availability, real chat/call/live channels |
| `95eea1f` | Consultant side: `/pro` shell, five screens, onboarding fork |
| `466ecbf` | Full-bleed reels, Instagram-style consultant profile, call beside message, 3-tab chat |
| `e8cc1f2` | Instagram-style feed actions; Live flattened into the tab row |

Earlier in the session: the CRED-light redesign (light canvas, rounded
geometry, Plus Jakarta Sans, skeuomorphic surfaces, frosted ink tab bar).

---

## 6. Known gaps and deliberate omissions

- **Pro side:** real availability rules, actual payouts, KYC, media upload.
  Studio publishes to a toast; "go live" opens the room that already exists.
- **Client side:** no real payments, no accounts. Every commit flow ends in a
  toast and says so in the copy.
- `ChatPanel`'s consultant threads are written from the *seeker's* side. A
  consultant reading them sees threads named after herself with her own replies
  marked as the other party. ~6 lines to flip when `isPro` — not done.
- The screenshot tooling broke partway through the last session, so several
  recent screens were verified via the DOM (structure, computed styles, click
  behaviour) but **never actually looked at**: the five pro screens, the reel
  overlay, and the Consult sub-nav. Worth eyeballing early.

---

## 7. House style for copy

`mock.js` opens with a voice rule that every string obeys: second person,
present tense, imperative where possible. No hedging, no emoji, no exclamation
marks. Blunt rather than reassuring — "A stone does not fix a transit. It is a
reminder you paid for." Match it; it is most of the product's character.
