# Veda (aether-mono)

Front-end prototype of an astrology app. Vite · React 18 · Tailwind · HashRouter.
Two sides in one codebase: client (`/home`, `/pooja`, `/consult`, `/shop`,
`/academy`) and consultant (`/pro/*`). No backend yet — every value comes from
`src/data/mock.js`.

## Map

```
src/            the app. Do not reorganise — App.jsx routing and the
                index.css component layer both assume this shape
  components/   shared UI. Read index.css @layer components before writing markup
  screens/      client screens, one file each, default export, no props
  pro/          consultant screens
  data/         mock.js + bhaktamar.js. All content lives here
docs/           HANDOFF.md (frontend truth) · DESIGN.md · CRED-DESIGN.md
backend/        BACKEND.md (decisions) · INSTRUCTIONS.md (how) · HANDOFF.md (state)
tools/          Python art pipeline for the deity murtis
public/         cards/ (48 tarot faces) · deities/ (26 murtis)
```

`docs/HANDOFF.md` is the accurate description of the front end — read it before
touching `src/`. It lists nine traps that have already cost time. The root
`README.md` is **stale**; it describes a monochrome build the app no longer is.

## Keeping the docs true

These files are the project's memory. Update them **in the same session as the
discussion or the work**, not later, and without being asked:

| What came up | Update |
|---|---|
| A backend decision — stack, schema, a rule, a third-party choice | `backend/BACKEND.md` |
| A backend convention, or a change to the build steps | `backend/INSTRUCTIONS.md` |
| Backend work done, blocked, deferred, or a risk discovered | `backend/HANDOFF.md` |
| Front-end work done, a new trap, a deliberate omission | `docs/HANDOFF.md` |
| A visual token, affordance rule, or design decision | `docs/DESIGN.md` |

Rules for those edits:

- **Edit the existing section.** Do not append a running log or a changelog at
  the bottom. If a decision reverses, rewrite it and say what it replaced.
- **State, not intent.** `backend/HANDOFF.md` describes what is actually true
  right now. A doc that describes the plan as though it were built is worse than
  no doc, because it gets trusted.
- **Date the handoffs** when the state changes.
- **Tell the user which file changed**, in one line. Never silently.

## House style

Copy follows the voice rule at the top of `src/data/mock.js`: second person,
present tense, imperative where possible. No hedging, no emoji, no exclamation
marks. Blunt rather than reassuring. Documentation in this repo matches it.
