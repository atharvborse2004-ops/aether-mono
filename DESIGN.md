# Design rules

Everything here is enforced somewhere in code, not left to discipline. Where
that is, is noted.

## 1. Tokens

White is primary, black is secondary. Ink on paper, not chalk on slate.

| Token         | Value                | Notes                                     |
| ------------- | -------------------- | ----------------------------------------- |
| Background    | `#FFFFFF`            | Pure white. Not off-white                 |
| Surface       | `#F2F2F2`            | Plates only                               |
| Primary text  | `#000000`            |                                           |
| Secondary     | `#565656`            | 7.0:1 on white — passes AA                |
| Tertiary      | `#6B6B6B`            | 5.1:1 — the floor for readable text       |
| Non-text grey | `#A3A3A3`            | 2.6:1 — ticks, spokes, placeholders only  |
| Hairline      | `1px solid #D6D6D6`  |                                           |
| Accent        | none                 | Colour is the enemy here                  |
| Radius        | `0`                  | Everywhere                                |
| Elevation     | none                 | Rules and whitespace, never shadows       |

The greys are re-derived rather than arithmetically flipped from the previous
dark set. Grey-on-white and grey-on-black do not land at the same luminance for
the same contrast ratio, so inverting the hex values would have quietly dropped
body text below AA.

Declared in `src/index.css`. Tailwind's default palette is **replaced**, not
extended (`tailwind.config.js`), so no other colour is reachable from a class
name. `borderRadius` and `boxShadow` scales all collapse to `0` / `none`, and
`* { border-radius: 0 !important }` is the backstop.

## 2. Typography

Inter at 300 / 400 / 500. Nothing heavier is loaded.

- Section headers: 11px, uppercase, `letter-spacing: .10em`, centered
- Body reading text: 17px, `line-height: 1.65`, centered, `max-width: 34ch`
- Hierarchy comes from **size, case and colour** — almost never weight. 500 is
  reserved for the active nav item

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

2. **Grey contrast failing WCAG** → `--text-2` and `--text-3` are set to ratios
   that pass AA (7.0:1 and 5.1:1). The 2.6:1 grey exists but is restricted to
   non-text marks. On top of that, **Me → Display → Increase contrast**
   re-points every grey token darker at runtime
   (`:root[data-contrast='high']` in `index.css`, toggled from `store.jsx`).
   Focus rings are visible everywhere (`:focus-visible`).

3. **Unlabelled Do / Don't** → both columns carry an explicit header, and the
   section opens with a sentence saying what the two lists mean.
   `src/screens/Today.jsx`.

4. **Everything centered with no grid** → centering is reserved for editorial
   moments (section labels, the reading, reflection prompts, verdicts).
   Dense data — the chart table, houses, friend list, stats strips, session
   history — sits left-aligned on real column grids. `src/screens/Chart.jsx`
   and `ConsultantProfile.jsx` are the clearest examples.

5. **Daily horoscope buried** → it is the first content block on the landing
   tab, above the fold, with nothing competing for the position.
   `src/screens/Today.jsx`.

## 7. Voice

Second person, present tense, imperative. Short declarative sentences. No
hedging, no emoji, no exclamation marks. Range from practical to cryptic. The
rules are restated at the top of `src/data/mock.js`, where all the copy lives.

The tension between a cold layout and a personal callout is the whole product.
Warm, supportive horoscope copy over this design would make it read as a
template.

## 8. What is not borrowed

The aesthetic system — white canvas, all-caps grotesk, hairline rules, blunt
copy — is a general editorial idiom and freely reusable. Deliberately **not**
reproduced: any existing app's wordmark, its commissioned collage
illustrations, or its horoscope copy. All imagery here is generated in SVG
(`src/components/Plate.jsx`) and all copy is original.
