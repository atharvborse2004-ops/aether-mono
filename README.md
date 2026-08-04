# Aether Mono — monochrome editorial layout

A second, independent layout for the Aether astrology app, built to a
brutalist-editorial spec: pure black canvas, no colour, no rounded corners, no
shadows, hairline rules and a lot of whitespace.

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

|                | Original (`aether-astrology-app`) | This one                          |
| -------------- | --------------------------------- | --------------------------------- |
| Canvas         | Midnight blue, star field         | `#000000`, nothing behind content |
| Accent         | Gold gradients                    | None. Black, white, four greys    |
| Corners        | 16–24px radius                    | 0, enforced globally              |
| Depth          | Glass blur, glows, shadows        | 1px rules and whitespace only     |
| Nav            | Floating liquid-glass pill        | Text-only bar, hairline top       |
| Type           | Inter + Cormorant display         | Inter only, 300/400/500           |
| Alignment      | Left-aligned cards                | Centered editorial + real grid    |
| Motion         | Springs, slides, twinkle          | Fades. Nothing else               |
| Home           | Content feed                      | The daily reading, first thing    |
| Onboarding     | 3-step form                       | One question per screen           |

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
