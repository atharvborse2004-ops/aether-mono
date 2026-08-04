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
| Type           | Inter + Cormorant display         | Inter only, 300/400/500           |
| Alignment      | Left-aligned cards                | Centered editorial + real grid    |
| Motion         | Springs, slides, twinkle          | Fades. Nothing else               |
| Home           | Content feed                      | The daily reading, first thing    |
| Onboarding     | 3-step form                       | One question per screen           |

## Feature parity with the original

Every feature of `aether-astrology-app` is present. Where it lives here:

| Original feature                          | Here                                      |
| ----------------------------------------- | ----------------------------------------- |
| Feed of posts + articles                  | Read → Notes / Long                       |
| Post like / reply / share / save          | Read → Notes, `<Acts>` row                |
| Reels vertical snap player                | `/read/clip/:id` — snap-scrolls all clips |
| Live story rail                           | Read, above the search field              |
| Live tab + live room, chat, hearts, gifts | Read → Live, `/read/live/:id`             |
| Daily horoscope, 3-day switcher           | Today, segmented control                  |
| Mood / lucky colour / lucky number        | Today, specimen row under the reading     |
| Day intensity meter                       | Today → Intensity ruler                   |
| Four-area ratings                         | Today → Read across four areas            |
| Power / Pressure                          | Today → Power & pressure                  |
| Transit alerts                            | Today → Current transits                  |
| "Do this" focus line                      | Today → its own section                   |
| Horoscope share / save                    | Today, under the reading                  |
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
| Profile, birth details, edit              | Me → Birth data                           |
| Kundli download / share                   | Me, under the wheel                       |
| Wallet balance + top-up                   | Me → Wallet                               |
| Settings rows                             | Me → Settings                             |
| Session history + receipts                | Me → Past sessions                        |
| Restart onboarding                        | Me → About this build                     |
| Onboarding: name, date, time, place       | One question per screen                   |
| Chart-ready reveal                        | `/onboarding/computing`, second beat      |

Screens with no counterpart in the original — People, synastry, the placement
detail pages, Premium, Notifications and the contrast toggle — are additions,
not replacements.

## Screens

**Onboarding** — intro → birth date → birth time (to the minute) → birth place
→ a computing screen that names its data source. One question per screen, huge
type, deliberately no progress bar.

**Tabs**

| Tab     | What's in it                                                                                                                             |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Today   | The reading first, then Day at a Glance, labelled Do / Don't, Getting Along With, current transits, Power & Pressure, four ratings, reflection prompts. Yesterday / Today / Tomorrow switcher |
| Chart   | **Table view by default**, wheel view one tap away. Every row drills into a placement page                                                 |
| Read    | Notes, long reads, clips and live rooms                                                                                                   |
| Consult | Category filters, consultant list, profile with a booking sheet                                                                            |
| Me      | Birth data, wallet, contrast toggle, session history, links to everything else                                                             |

**Drill-in screens** — placement detail, People → synastry → invite, clip
viewer, live room, consultant profile, Ask the Stars, Shop, Notifications,
Premium.

## Structure

```
src/
  App.jsx                  routing + phone frame
  index.css                tokens, type roles, the three affordances
  store.jsx                birth draft / cart / questions / contrast / toasts
  data/mock.js             all hardcoded content, plus the voice rules
  components/
    Primitives.jsx         Label, Section, Button, Row, TextLink, Segmented,
                           Ticks, Ruler, Avatar, Field, Tag, Stub
    Chrome.jsx             TopBar, BottomNav, Sheet, Toast
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
