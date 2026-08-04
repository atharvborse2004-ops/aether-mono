# Aether Mono — monochrome editorial layout

A second, independent layout for the Aether astrology app, built to a
brutalist-editorial spec: pure white canvas, no colour, no rounded corners, no
shadows, hairline rules and a lot of whitespace. White is primary and black is
secondary — ink on paper.

It carries the **full feature set** of `aether-astrology-app`, re-expressed in
this layout rather than reduced by it. See the parity table below.

This is a **separate codebase and a separate deployment** from the original
`aether-astrology-app`. Nothing here touches that repo or that Pages site.

**Front-end only** — no backend, no auth, no database, no network calls. Every
value on screen comes from `src/data/mock.js`.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:5174. The app is sized to a 420px phone frame and
centered, so it looks the same on desktop and mobile.

## Stack

React 18 · Vite 5 · Tailwind CSS 3 · react-router-dom (HashRouter)

No icon library. This layout has one visual language — type on rules — and an
icon set would be a second one.

## What changed from the original layout

Only the *presentation* changed. Nothing was dropped.

|                | Original (`aether-astrology-app`) | This one                          |
| -------------- | --------------------------------- | --------------------------------- |
| Canvas         | Midnight blue, star field         | `#FFFFFF`, nothing behind content |
| Accent         | Gold gradients                    | None. White, black, four greys    |
| Corners        | 16–24px radius                    | 0, enforced globally              |
| Depth          | Glass blur, glows, shadows        | 1px rules and whitespace only     |
| Nav            | Floating liquid-glass pill        | Text-only bar, hairline top       |
| Tab order      | Home · Horoscope · Consult · Ask AI · Shop | Identical                |
| Type           | Inter + Cormorant display         | Inter only, 300/400/500           |
| Alignment      | Left-aligned cards                | Centered editorial + real grid    |
| Motion         | Springs, slides, twinkle          | Fades. Nothing else               |
| Home           | Content feed, 3 modes             | Identical — Feed / Reels / Live   |
| Onboarding     | 3-step form                       | One question per screen, 4 steps  |

## Feature parity with the original

Every feature of `aether-astrology-app` is present. Where it lives here:

| Original feature                          | Here                                      |
| ----------------------------------------- | ----------------------------------------- |
| Feed of posts + articles                  | Home → Feed, zip-merged into one timeline |
| Post like / reply / share / save          | Home → Feed, `<Acts>` row                 |
| Reels vertical snap player                | Home → Reels, and `/reels/:id`            |
| Live story rail                           | Home → Feed, above the search field       |
| Live tab + live room, chat, hearts, gifts | Home → Live, `/live/:id`                  |
| Daily horoscope, 3-day switcher           | Horoscope, segmented control              |
| Mood / lucky colour / lucky number        | Horoscope, specimen row under the reading |
| Day intensity meter                       | Horoscope → Intensity ruler               |
| Four-area ratings                         | Horoscope → Read across four areas        |
| Power / Pressure                          | Horoscope → Power & pressure              |
| Transit alerts                            | Horoscope → Current transits              |
| "Do this" focus line                      | Horoscope → its own section               |
| Horoscope share / save                    | Horoscope, under the reading              |
| Consultant list + category filter         | Consult                                   |
| Consultant search                         | Consult, search field                     |
| Quick-book sheet from the list            | Consult → Book a slot                     |
| Chat request                              | Consult → Chat                            |
| Profile tabs: about / content / reviews   | Consultant profile, segmented control     |
| Follow toggle, message, share             | Consultant profile (persists in store)    |
| Intro video block                         | Consultant profile, plate + duration      |
| Rating distribution histogram             | Consultant profile → Reviews              |
| Per-duration session pricing              | Consultant profile → Choose a session     |
| Sticky book CTA                           | Consultant profile, pinned footer         |
| AI chat, free-question counter, packs     | Ask the Stars                             |
| Reset reminder                            | Ask → out-of-questions state              |
| Shop, categories, cart badge              | Shop                                      |
| Shop search                               | Shop, search field                        |
| Chart-based product suggestion            | Shop → For your chart                     |
| Discount percentage                       | Shop, on the plate                        |
| Profile, birth details, edit              | Profile → Birth data                      |
| Kundli download / share                   | Profile, under the wheel                  |
| Wallet balance + top-up                   | Profile → Wallet                          |
| Settings rows                             | Profile → Settings                        |
| Session history + receipts                | Profile → Past sessions                   |
| Restart onboarding                        | Profile → About this build                |
| Onboarding: name, date, time, place       | One question per screen                   |
| Chart-ready reveal                        | `/onboarding/computing`, second beat      |
| Article reader (FEATURES.md Tier 1 gap)   | `/read/:id`, full long-form screen        |

Screens with no counterpart in the original — People, synastry, the placement
detail pages, Premium, Notifications and the contrast toggle — are additions,
not replacements.

## Screens

**Onboarding** — intro → name → birth date → birth time (to the minute) →
birth place → a computing screen that names its data source, then reveals the
chart. One question per screen, huge type, deliberately no progress bar.

**Tabs** — five destinations, in the reference app's order. Profile lives
behind the header avatar on Home and Horoscope so the bar stays at five.

| Tab       | What's in it                                                                                                                                                          |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home      | Three modes behind one switcher. **Feed** — live rail, search, and a zip-merged timeline of notes and article link-previews, closing on a horoscope teaser. **Reels** — the vertical snap player, inline. **Live** — room list with status and viewer counts |
| Horoscope | The reading first, then Day at a Glance, the mood / colour / number specimen, the focus line, labelled Do / Don't, Getting Along With, current transits, Power & Pressure, four ratings, reflection prompts. Yesterday / Today / Tomorrow switcher |
| Consult   | Search, category filters, consultant list with Chat / Book, quick-book sheet                                                                                            |
| Ask AI    | Chart-aware thread, free-question quota, packs sheet, reset reminder                                                                                                    |
| Shop      | Search, chart-based suggestion, category filters, product grid with computed discounts, cart                                                                            |

**Drill-in screens** — Profile, chart (table + wheel) → placement detail,
People → synastry → invite, the article reader, the standalone reel route,
live room, consultant profile, Notifications, Premium.

## Structure

```
src/
  App.jsx                  routing + phone frame
  index.css                tokens, type roles, the three affordances
  store.jsx                birth draft / cart / questions / contrast / toasts
  data/mock.js             all hardcoded content, plus the voice rules
  components/
    Primitives.jsx         Label, Section, Button, Row, TextLink, Segmented,
                           Acts, Search, Ticks, Ruler, Avatar, Field, Tag, Stub
    Chrome.jsx             TopBar, BottomNav, Sheet, Toast
    ReelFeed.jsx           vertical snap player, shared by Home and /reels/:id
    Plate.jsx              procedurally generated greyscale imagery
    ChartWheel.jsx         engraved SVG chart wheel
  screens/
  screens/onboarding/
```

See [DESIGN.md](DESIGN.md) for the token table, the affordance rules and the
five known flaws in the reference design that this build deliberately fixes.

## Imagery

No photography and no traced collage. Every plate is drawn procedurally in SVG
— orbital diagrams, engraved line fields, halftone and contour — always
greyscale, always under a fractal-noise film grain. If you want photographic
plates later, source them from public-domain archives (The Met Open Access,
NASA Image and Video Library, Rijksmuseum Open Data), desaturate to pure
greyscale and drop them in behind the same `.grain` overlay.

## Deployment

Pushing to `main` builds and publishes to GitHub Pages via
`.github/workflows/deploy.yml`. The router uses `HashRouter` and Vite's `base`
is derived from the repo name, so deep links work on a project Pages site
without extra config.
