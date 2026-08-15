# Design rules

Everything here is enforced somewhere in code, not left to discipline. Where
that is, is noted.

## 1. Tokens

Black is primary, white is secondary — the reference spec's own direction.

| Token         | Value                | Notes                                     |
| ------------- | -------------------- | ----------------------------------------- |
| Background    | `#000000`            | Pure black. Not dark grey                 |
| Surface       | `#0A0A0A`            | Plates only                               |
| Primary text  | `#FFFFFF`            |                                           |
| Secondary     | `#8A8A8A`            | 6.1:1 on black — passes AA                |
| Tertiary      | `#757575`            | 4.6:1 — the floor for readable text       |
| Non-text grey | `#5C5C5C`            | 3.1:1 — ticks, spokes, placeholders only  |
| Hairline      | `1px solid #262626`  |                                           |
| Accent        | none                 | Colour is the enemy here                  |
| Radius        | `0`                  | Everywhere                                |
| Elevation     | none                 | Rules and whitespace, never shadows       |

The greys are derived against black, not flipped from a light set. The same
hex does not hold the same contrast ratio on both canvases, so an arithmetic
inversion would have quietly dropped body text below AA.

Declared in `src/index.css`. Tailwind's default palette is **replaced**, not
extended (`tailwind.config.js`), so no other colour is reachable from a class
name. `borderRadius` and `boxShadow` scales all collapse to `0` / `none`, and
`* { border-radius: 0 !important }` is the backstop.

## 2. Typography

**Plus Jakarta Sans**, 300–800. This replaced Inter in the CRED-light redesign:
CRED runs on Gilroy, which is licensed, and Jakarta is the closest free
geometric sans — same low contrast and open apertures, and it survives 10px
caps, which is where most geometric sans fall apart and where this UI spends
most of its type.

**One family for Latin, two for the app.** Jakarta has no Indic coverage at
all, so the Hindi build pairs it with **Noto Sans Devanagari**, loaded in the
same font request. Order in the stack is the whole trick:

```
sans: ['"Plus Jakarta Sans"', '"Noto Sans Devanagari"', …]
```

A browser walks that stack **per glyph**, so Latin keeps Jakarta and only
Devanagari falls through to Noto. Reversing the two would restyle the entire
English UI. Without Noto in there at all, Hindi silently resolves to whatever
the OS ships — Nirmala UI on Windows, something else on Android — and one
screen renders in two unrelated typefaces.

- Section headers: 11px, uppercase, `letter-spacing: .10em`
- Body reading text: 17px, `line-height: 1.6`, `max-width: 34ch`
- Hierarchy comes from **size, case and weight**; a display heading is a weight
  rule, not a second family

Sizes are named to their role in `tailwind.config.js` (`label`, `meta`, `body`,
`read`, `lead`, `title`, `display`, `huge`) so a screen cannot invent a
nineteenth size.

## 3. Spacing

8pt grid, with unusually large vertical gaps — 40px inside a section, 56px
between them. The whitespace is the design. `.section` and `.section-tight` in
`index.css` are the only two paddings any screen uses.

## 4. Motion

Fades. `fade`, `fade-rise` (6px), `sheet-in` (16px). No bounce, no spring, no
parallax. `prefers-reduced-motion` collapses everything to ~0ms.

## 5. The three affordances

The reference design's most-cited usability failure is that some links are
underlined, some are all-caps, some are bare text, and nothing tells you which
is tappable. This build has **exactly three** interactive shapes:

| Shape       | Class      | Means                              |
| ----------- | ---------- | ---------------------------------- |
| `<Button>`  | `.act-btn` | Commits to something               |
| `<Row>`     | `.act-row` | Navigates somewhere                |
| `<TextLink>`| `.act-link`| Navigates from inside a sentence   |

If an element wears none of these, it is text and does nothing. `.act-row`
draws its trailing `→` from CSS, so no row can ship without it and every row
in the app looks identical. Selectors (segmented controls, filters) use one
shared language: tracked caps with a 1px underline on the active item.

`<Acts>` is the one addition — the like / save / share / follow toggles. It is
not a fourth *navigation* shape: nothing in an `Acts` row moves you to another
screen, so it cannot be mistaken for a `Row` or a `TextLink`. An engaged toggle
is inked and underlined; the rest are grey. State lives in the store's flag set
(`store.jsx`), so a follow or a save survives navigating away and back.

## 6. The five known flaws, and where each is fixed

The published critiques of the reference app name five problems. All five are
addressed:

1. **Inconsistent link affordances** → the three-shape system above.
   `src/components/Primitives.jsx`, `.act-*` in `src/index.css`.

2. **Grey-on-black contrast failing WCAG** → `--text-2` and `--text-3` are set
   to ratios that pass AA (6.1:1 and 4.6:1). The 3.1:1 grey exists but is
   restricted to non-text marks. On top of that, **Profile → Display → Increase
   contrast** re-points every grey token upward at runtime
   (`:root[data-contrast='high']` in `index.css`, toggled from `store.jsx`).
   Focus rings are visible everywhere (`:focus-visible`).

3. **Unlabelled Do / Don't** → both columns carry an explicit header, and the
   section opens with a sentence saying what the two lists mean.
   `src/screens/Horoscope.jsx`.

4. **Everything centered with no grid** → centering is reserved for editorial
   moments (section labels, the reading, reflection prompts, verdicts).
   Dense data — the chart table, houses, friend list, stats strips, session
   history — sits left-aligned on real column grids. `src/screens/Chart.jsx`
   and `ConsultantProfile.jsx` are the clearest examples.

5. **Daily horoscope buried** → it is the first content block on the landing
   tab, above the fold, with nothing competing for the position.
   `src/screens/Horoscope.jsx`.

## 7. Voice

Second person, present tense, imperative. Short declarative sentences. No
hedging, no emoji, no exclamation marks. Range from practical to cryptic. The
rules are restated at the top of `src/data/mock.js`, where all the copy lives.

The tension between a cold layout and a personal callout is the whole product.
Warm, supportive horoscope copy over this design would make it read as a
template.

## 8. What is not borrowed

The aesthetic system — black canvas, all-caps grotesk, hairline rules, blunt
copy — is a general editorial idiom and freely reusable. Deliberately **not**
reproduced: any existing app's wordmark, its commissioned collage
illustrations, or its horoscope copy. All imagery here is generated in SVG
(`src/components/Plate.jsx`) and all copy is original.
