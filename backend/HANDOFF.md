# Backend — handoff

Current state of the backend. This is the file that describes **reality**, so it
is the one that goes stale fastest and the one to update first.

Updated 15 Aug 2026.

---

## 1. Where things stand

**Nothing is built.** No database, no auth, no server, no network calls. The app
is still entirely front-end and every value on screen comes from
`src/data/mock.js` and `src/data/bhaktamar.js`. Nothing survives a reload.

The work so far is the plan itself:

| Date | What |
|---|---|
| 15 Aug 2026 | `backend/` created. Architecture, rules and build order written down. Docs moved to `docs/`. Nothing implemented. |
| 15 Aug 2026 | Product list arrived. Front-end-only items built; the rest logged against the build order under "Known risks". Still nothing implemented. |

Next action: **Step 1 — auth and profile** in `INSTRUCTIONS.md`. It is the
smallest slice that makes the app stop forgetting you.

---

## 2. Decisions made

Recorded here so they are not re-argued. Reasoning is in `BACKEND.md`.

- **Buy auth, database, storage and realtime.** Supabase, unless something below
  changes it. Not writing sessions, OTP and file uploads by hand.
- **Write only what cannot be a database rule:** the wallet ledger, the booking
  conflict claim, payment webhooks, the chart service, the model proxy.
- **Money is integers in paise, and the ledger is append-only.**
- **The client never sends a price.**
- **`isPro` stays derived from the URL.** No persisted role. The server
  authorizes independently.
- **Swiss Ephemeris for charts**, as its own small Python service.
- **Payouts and KYC last.** Regulated, and nobody is owed money on day one.

## 3. Decisions still open

These block nothing today but each one blocks a specific step. Answer them
before that step, not before starting.

| Question | Blocks | Leaning |
|---|---|---|
| Supabase or Firebase | Step 1 | Supabase — real Postgres, and RLS matches the trust model |
| Razorpay or Cashfree | Step 3 | Razorpay — better documented, same capabilities |
| 100ms or Agora | Step 8 | Undecided. Compare pricing at expected minutes |
| Does the free tarot pull mean a calendar week or a rolling seven days | Step 2 | Rolling seven days from `tarot_pulls.pulled_at`. Simpler and harder to game |
| Do consultants get a separate app eventually | Step 5 | Not soon. One codebase, `/pro/*`, as today |
| Which reference chart verifies the ephemeris | Step 6 | Not chosen. Pick before writing the service, not after |

## 4. Known risks

- **The trust boundary is the whole project.** `spend()` currently runs in the
  browser. Until step 2 lands, the wallet is decorative. Do not demo it as
  though it is not.
- **Birth-time timezones are silently destructive.** A modern offset applied to
  an older Indian birth shifts the entire chart with no error. Handle it in step
  6 deliberately or the app is confidently wrong.
- **The front-end `README.md` is stale** — it describes a black-canvas
  monochrome build the app has not been for several redesigns. `docs/HANDOFF.md`
  is the accurate one. Worth a rewrite before anyone new is handed this repo.
- **New front-end features are outrunning the backend's assumptions.** A
  product list on 15 Aug added four things that cannot ship without steps 2-8:
  login and Razorpay (steps 2 and 3), a call that actually rings (step 8),
  consultant-uploaded course material — PDFs and YouTube links, paid or free
  (needs storage plus the payments ledger), and an admin panel that uploads
  deity images (storage plus a role on the user). Two more were built as mock
  UI and will need real data behind them: **consultant performance metrics**
  (`proMetrics` in `mock.js` — reply time, calls attended over requested) which
  are derived from `sessions` and `messages` and belong in section 2's
  "derived" list, and **two free tarot pulls a week**, which is now two boolean
  flags in the browser and is exactly as gameable as it sounds until
  `tarot_pulls` exists.

## 5. Nothing is in flight

No half-finished branches, no partial migrations, no dangling third-party
accounts. The next person starts at step 1 with a clean slate.
