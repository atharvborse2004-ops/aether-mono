# CRED / NeoPOP — exact spec + where it maps onto this app

All values below are pulled from CRED's open-sourced design system source
(`CRED-CLUB/neopop-web`, `src/primitives/*`), not from eyeballing screenshots.

---

## 1. What NeoPOP actually is

CRED's 4th-gen design system. Neumorphism + Pop Art. Five rules do 90% of the work:

| Rule | Concrete meaning |
|---|---|
| Hard geometry | `border-radius: 0`. Everything is a rectangle. |
| Hard elevation | Shadows are **offset solid blocks**, never blurred. No `blur` in `box-shadow`. |
| Deep black canvas | Page bg `#0d0d0d`, cards `#121212`. Never pure `#000`. |
| Voltage accents | One neon per screen against the black. Never two. |
| Isometric + linear motion | Objects move on a fixed axis, 3D drawn in 2D. No arcs, no bounce. |

---

## 2. Color — exact tokens

### Core

```
black       #0d0d0d      ← page background (mainAppBackground)
white       #ffffff
red         #EE4D37
yellow      #F08D32
blue        #144CC7
green       #06C270
```

### Neutrals

```
popBlack   100 #8A8A8A  200 #3D3D3D  300 #161616  400 #121212  500 #0d0d0d
popWhite   100 #D2D2D2  200 #E0E0E0  300 #EFEFEF  400 #FBFBFB  500 #ffffff
```

### Voltage ramps (100 → 800; **500 is the "on-brand" step**)

```
poliPurple      #E8DFFF #D2C2FF #B49AFF #9772FF #6A35FF #4A25B3 #351A80 #20104D
orangeSunshine  #FFEFE6 #FFDBC7 #FFC3A2 #FFAB7C #FF8744 #B35F30 #804322 #4D2914
parkGreen       #DDFFF1 #C4FFE6 #9DFFD6 #76FFC6 #3BFFAD #29B379 #1E8057 #124D34
pinkPong        #FFE1E9 #FFC6D4 #FFA0B7 #FF7B9A #FF426F #B32E4E #802138 #4D1421
mannna          #FFF8E5 #FFEFC7 #FFE5A2 #FFDB7D #FFCB45 #B38E30 #806623 #4D3D15
neoPaccha       #FBFFE6 #F7FFC6 #F2FF9F #EDFE79 #E5FE40 #A0B22D #727F20 #454C13
yoyo            #F4E5FF #E5C5FF #D59FFF #C379FF #AA3FFF #772CB3 #552080 #33134D
```

### Status

```
error    #FCE2DD #F6A69B #F47564 #F05E4B #EE4D37
warning  #FBDDC2 #F8C699 #F5AC6A #F29947 #F08D32
info     #C2D0F2 #89A5E3 #3F6FD9 #2C5ECD #144CC7
success  #E6F9F1 #83E0B8 #4FE3A3 #1FC87F #06C270
```

### Component colors (dark theme, verbatim)

```
page background   #0d0d0d
card background   #121212
card stroke       rgba(255,255,255,0.1)

button primary    bg #0d0d0d   text #ffffff
                  edges { top #3D3D3D  right #8A8A8A  bottom #3D3D3D  left #D2D2D2 }
button secondary  bg #ffffff   text #0d0d0d   border #0d0d0d
                  edges { top #C7C7C7  right #ffffff  bottom #8A8A8A  left #ffffff }

input text        white @ 0.9
input placeholder rgba(255,255,255,0.3)
```

### Text opacity ladder (this is how CRED gets hierarchy without extra colors)

```
heading      0.9
sub-heading  0.7
body         0.5
body lighter 0.3
```

---

## 3. Typography

CRED ships three families:

| Role | CRED font | Free substitute (closest) |
|---|---|---|
| Headings / titles | **Cirka** (serif, paid) | Instrument Serif, Bodoni Moda, Playfair Display |
| UI + body | **Gilroy** (geometric sans, paid) | Satoshi, Outfit, Poppins |
| Numbers, labels, meta | **Overpass Mono** | Overpass Mono (free, Google Fonts) |

Token naming in the system: `t{type}{size}{weight}` — e.g. `th44eb`
(Heading 44 ExtraBold), `tsh36b` (SerifHeading 36 Bold), `tb16m` (Body 16 Medium),
`tc12b` (Caps 12 Bold).

- Types: `HEADING`, `SERIF_HEADING`, `BODY`, `CAPS`
- Sizes: 8 → 44 px
- Weights: `REGULAR`, `MEDIUM`, `SEMI_BOLD`, `BOLD`, `EXTRA_BOLD`

`CAPS` is the signature move: small (10–13px), uppercase, bold, wide tracking,
mono or sans — used for every label, tag, section kicker, and button text.

---

## 4. The elevated button (the single most copied CRED element)

True implementation: a face + four absolutely-positioned edges, right edge
`skewY(45deg)`, bottom edge `skewX(45deg)`, both `EDGEWIDTH` thick. On press the
face translates `translate3d(EDGEWIDTH, EDGEWIDTH, 0)` with
`transition: 0.12s ease-in-out`, and specific edges are pinned depending on
`elevationDirection`. Default padding `16px 20px`.

Two visible edges read identically and cost one line:

```css
.neopop {
  border: 1px solid #0d0d0d;
  border-radius: 0;
  padding: 16px 20px;
  box-shadow: 4px 4px 0 0 #8A8A8A;          /* right + bottom edge, zero blur */
  transition: transform .12s ease-in-out, box-shadow .12s ease-in-out;
}
.neopop:active {
  transform: translate3d(4px, 4px, 0);
  box-shadow: 0 0 0 0 #8A8A8A;
}
```

Rules: shadow blur is always `0`. Offset equals the press travel. Nothing scales.

---

## 5. Where it maps onto this app

Current app is soft-glass mystical: `rounded-2xl`, `backdrop-blur`, gold gradients,
blurred shadows, `Cormorant Garamond`. NeoPOP is the exact opposite on four of those.
Taking it wholesale deletes the astrology feel. The split that keeps both:

**Take** — elevation mechanics, CAPS labels, opacity ladder, one-accent-per-screen,
linear motion, full-bleed CTA blocks.
**Leave** — universal `radius: 0`, neon voltage palette (keep gold as the voltage),
`backdrop-blur` glass (NeoPOP has none).

| File | Change |
|---|---|
| `tailwind.config.js` | Add `boxShadow.pop*` (zero-blur), `letterSpacing.caps`, keep `midnight`/`gold`. Swap `display` font Cormorant → Instrument Serif for the CRED serif-heading read. |
| `src/index.css` | Add `.neopop` + `.neopop-gold`. Keep `.glass` — do **not** merge the two on one surface. |
| `Card.jsx` | New `variant: 'pop'` → `#121212` bg, `rgba(255,255,255,0.1)` stroke, `rounded-none`, `shadow-pop`. Existing variants untouched. |
| `SectionHeader.jsx` | Kicker → CAPS 11px bold, tracking `0.12em`, white @ 0.5. Biggest single-file visual win. |
| `Chip.jsx` | CAPS text, `rounded-none`, 1px border, zero-blur press shift. |
| `BottomNav.jsx` | Keep glass. Only the active indicator becomes a hard 2px gold bar. |
| `Welcome.jsx`, `ChartReady.jsx` | Primary CTA → `.neopop-gold`. High-stakes reveal moment = where CRED's elevation belongs. |
| `BirthDetails.jsx` | Inputs: text white @0.9, placeholder `rgba(255,255,255,0.3)`, 1px bottom rule, no fill. |
| `ProductCard.jsx`, `ConsultantCard.jsx` | Price/rating in Overpass Mono. Card body stays glass; CTA inside goes `.neopop`. |
| `Toast.jsx` | Status colors `#06C270` / `#EE4D37` / `#F08D32`, zero-blur shadow. |
| `LiveCard.jsx` | LIVE badge: `#EE4D37`, CAPS 10px, square. |
| `ChartWheel.jsx`, `StarField.jsx` | Untouched. Mystical core — NeoPOP does not go here. |
| `BottomSheet.jsx` | Handle + top corners stay rounded; internal CTA goes `.neopop`. |

### Ready-to-paste tailwind additions

```js
boxShadow: {
  pop:      '4px 4px 0 0 #8A8A8A',
  'pop-sm': '2px 2px 0 0 #8A8A8A',
  'pop-gold':'4px 4px 0 0 #b47f28',
  'pop-none':'0 0 0 0 transparent',
},
letterSpacing: { caps: '0.12em' },
fontFamily: {
  mono: ['"Overpass Mono"', 'ui-monospace', 'monospace'],
},
```

### Fonts to load

```
Overpass Mono   — Google Fonts, free
Instrument Serif — Google Fonts, free (Cirka substitute)
Outfit or Satoshi — Gilroy substitute (Outfit is on Google Fonts)
```

---

## Sources

- [CRED-CLUB/neopop-web](https://github.com/CRED-CLUB/neopop-web) — token values above are from `src/primitives/`
- [CRED-CLUB/neopop-android](https://github.com/CRED-CLUB/neopop-android)
- [NeoPOP playground](https://playground.cred.club)
- [CRED open-sources NeoPOP — Analytics India Magazine](https://analyticsindiamag.com/ai-news-updates/cred-open-sources-its-ui-design-system-neopop/)
- [CRED's Neo-Pop design philosophy — Homegrown](https://homegrown.co.in/article/806427/cred-s-new-design-philosophy-channels-the-unbridled-creative-spirit-of-the-neo-pop-art-movemen)
- [Thoughts on CRED's UI revamp — NeoPOP, UX Planet](https://uxplanet.org/thoughts-on-creds-ui-revamp-apr-2022-6d2b4dcfcfc6)
- [CRED design case study — Bootcamp](https://bootcamp.uxdesign.cc/from-good-design-to-a-great-salesmanship-cred-design-case-study-70c50478e27a)
- [How the design team at CRED is pushing boundaries — IndieFolio](https://resources.indiefolio.com/how-the-design-team-at-cred-is-pushing-boundaries/)
- [CRED's neoPOP UI kit (unofficial) — Figma Community](https://www.figma.com/community/file/1118043778634755120/creds-neopop-ui-kit-unofficial)
