# 01 — Product requirements

What Veda is, who uses it, what it sells, and what ships first.

**This document owns every rupee amount in the product.** No other document
names a price. It owns no schema, no endpoints and no column names — those are
`05-BACKEND-SCHEMA.md` and `02-TRD.md`. Build order is `06-IMPLEMENTATION.md`.

---

## 1. What this is

An astrology marketplace for India. A seeker asks a question; a consultant
answers it, live, for money. Around that sit the things people who ask such
questions also want: a daily reading, a birth chart, a shrine, a tarot deck,
remedial products, and courses.

Two apps in one phone-shaped codebase, plus a desktop console:

| Surface | Who | Where |
|---|---|---|
| **Seeker** | someone who wants a reading | Home · Pooja · Consult · Shop · Academy |
| **Consultant** | the astrologer | Feed · Sessions · Studio · Earnings · Profile, under `/pro/*` |
| **Admin** | you, then support staff | A separate desktop console |

The product has an unusual amount of character for a prototype and it is
deliberate. The copy voice — second person, present tense, imperative, blunt
rather than reassuring — is most of what distinguishes it. *"A stone does not fix
a transit. It is a reminder you paid for."* That voice is a product requirement,
not decoration, and it is also useful compliance cover: copy that promises
nothing is copy that cannot overpromise.

---

## 2. Users

### The seeker

Has a question with a deadline — a job offer, a marriage, a court date, an
illness. Wants an answer from a person, quickly, without a subscription or an
account-creation ordeal. Pays per session from a wallet rather than per
transaction, because UPI friction per ₹1,499 booking is worse than one top-up.

Does not necessarily know their birth time to the minute. A large share of
Indian users do not, and the product must not treat that as a failure state.

### The consultant

Runs their practice on the platform. Cares about three things in order:
**bookings arriving**, **getting paid**, and **being seen** — which is why the
consultant side is a feed, a session queue, a studio and an earnings screen
rather than a settings panel.

Sets nothing about their own price except which band they sit in (§4.1). Is
invisible until approved.

### The admin

Approves consultants, moderates content, manages the catalogue, and answers "what
happened to this person's money". Needs to search across all users, which is a
capability no other actor has and the reason the console is a separate
application entirely.

---

## 3. Feature inventory

Status is honest: **UI** means the screen exists and is wired to mock data;
**Real** means it is backed by a server; **None** means it does not exist.

### Seeker

| Feature | Status | Note |
|---|---|---|
| Onboarding — name, birth date, birth time, place | UI | Four questions, one per screen. Collected into the store and then **not used** — Profile, Chart and Horoscope all read a fixed mock user |
| Seeker/consultant fork | UI | `AskSide`. The consultant branch skips the birth questions entirely |
| Login / accounts | **None** | Blocks everything |
| Home feed | UI | One stream, seven card kinds. Daily reading and panchang hoisted to the top |
| Daily horoscope, 3-day switcher | UI | Fixed content for all users |
| Birth chart — table, wheel, placement detail | UI | Fixed placements for all users |
| Panchang | UI | Fixed; its date disagrees with the horoscope's |
| Consult — search, filter, four modes | UI | Call · Chat · Live · Booking as modes, not routes |
| Booking a session | UI | Shows a price, **charges nothing**, books nothing |
| Chat with a consultant | UI | Canned replies after 900 ms |
| Voice / video call | **None** | Every call button toasts "prototype only" |
| Ask AI | UI | Canned replies; free-question counter |
| Tarot — 5 decks, 48 painted Bhaktamar faces | UI | **Charges the wallet for real** |
| Pooja — animated mandir, 7 deities, 26 murtis | UI | E-puja only. Nothing books a pandit, nothing is charged |
| Shop — categories, cart, checkout | UI | **Charges the wallet for real** |
| Reports | UI | **Charges the wallet for real** |
| Premium tiers | UI | Shows a price, grants nothing |
| Academy — courses, events, downloads | UI | Enrol toasts. Course links go to YouTube *search* URLs |
| Wallet — balance, top-up, ledger | UI | Real arithmetic, in the browser |
| Payments | **None** | Payment-method tags are decorative |
| People / synastry | UI | Fixed |
| Notifications | UI | No read state, no deep links |

### Consultant

| Feature | Status | Note |
|---|---|---|
| Feed | UI | Renders the *seeker's* Home, including the free-tools row and shop cards |
| Session requests — accept / decline | UI | Toggles a flag |
| Availability grid | UI | 7 × 6, closures held in a browser Set |
| Channels — chat / live / call per booking | UI | Chat opens the panel; call toasts |
| Studio — publish reel / article / go live | UI | Publishes to a toast. **No upload path exists anywhere in the app** |
| Earnings, ledger, payouts | UI | Withdraw toasts; the balance never moves |
| Performance metrics | UI | Real numbers in mock; needs deriving from sessions and messages |
| Insights | UI | Fixed |
| Referrals | UI | Header total disagrees with its own list |
| KYC | **None** | Legal gate on payouts |
| Approval before going live | **None** | Anyone typing `/pro/feed` is a consultant today |

### Admin

Nothing exists. All nine capabilities in §6 are unbuilt.

---

## 4. Money

Every amount in the product. Seven revenue lines, **all of them real** — the
business is not a single take-rate with decoration around it.

### 4.1 Sessions — the primary line

**The platform sets price bands; consultants choose one.** They do not type a
number. This keeps quality legible to seekers, keeps margin predictable, and
means a price change is a catalogue edit rather than a migration.

Current consultant prices, which become the seed bands:

| ₹749 | ₹899 | ₹999 | ₹1,299 | ₹1,499 | ₹2,200 |
|---|---|---|---|---|---|

**Platform commission: 18%**, expressed in basis points everywhere it is stored.
A ₹1,499 session pays the consultant ₹1,229 and the platform ₹270.

**Session length is an open decision — see §5.** Three incompatible models exist
in the current data.

### 4.2 Tarot

**₹11 per pull, after two free pulls a week.** The cheapest thing in the app and
deliberately so — it is the habit-forming line, not a margin line.

The "week" is currently two booleans in browser memory and resets on reload.

### 4.3 Reports

Six reports. **Their prices are an open decision (§5)** because the current
numbers are a placeholder multiplied at load time:

| Report | Base | Currently shown |
|---|---|---|
| Natal | ₹499 | ₹1,497 |
| Career | ₹699 | ₹2,097 |
| Love | ₹899 | ₹2,697 |
| Synastry | ₹1,299 | ₹3,897 |
| Transits | ₹599 | ₹1,797 |
| Remedial | ₹449 | ₹1,347 |

### 4.4 Question packs — Ask AI

6 questions ₹199 · 12 questions ₹349 · 20 questions ₹499.
Five free questions on arrival. **Packs currently grant questions without
charging.**

### 4.5 Premium tiers

₹349 · ₹899 · ₹1,299. **Overlaps §4.3 and §4.4 — see §5.**

### 4.6 Shop

Physical remedial goods: gemstones, maalas, rudraksha, remedies.
**₹640 to ₹26,400**, with strike-through MRPs from ₹1,200 to ₹24,000 driving a
computed discount badge. Two products are sold out.

Physical goods bring stock, shipping, returns and courier tracking — none of
which the current UI has. This is the most operationally expensive line and it is
sequenced late.

### 4.7 Academy

Courses ₹1,999 · ₹2,499 · ₹3,499 · ₹4,299.
Events ₹0 · ₹499 · ₹1,499 — **₹0 is how free is expressed**, and one event is
sold out by seats rather than by a flag.

Consultant-uploaded course material — PDFs and video links, free or paid — is a
requested capability with **no upload path in the app today**.

### 4.8 Wallet

Everything is paid from a wallet rather than per transaction.

Top-up presets **₹500 · ₹1,000 · ₹2,000 · ₹5,000**; custom amounts **₹100 to
₹1,00,000**. A "+2% cashback" label appears on ₹2,000 and above and **is never
applied** — either implement it or remove it before real money moves.

Opening demo balance: ₹1,240.

### 4.9 Referrals

**₹2,000 per consultant who joins.** The single largest per-action payout in the
product and it currently has no fraud control.

### 4.10 Where money actually moves today

Five paths, all client-side:

Cart checkout · Shop *Buy now* · Reports *Buy now* · Tarot pull · Wallet top-up.

Everything else that displays a price charges nothing — including **every booking
flow**, which is the primary revenue line.

---

## 5. Pricing decisions still open

Not guessed at. Each one changes what gets seeded.

### 5.1 Session length — TBD

Three models coexist in the data:

| Source | Says |
|---|---|
| `SESSION` | One flat **20 minutes**, unlimited questions |
| Consultant records | One price each, implying one length |
| Booking records | **30 / 15 / 10 minutes** at ₹2,998 / ₹1,499 / ₹999 |

A fourth possibility, common in Indian astrology apps, is **per-minute billing**
where the wallet drains live during a call. That is a materially different
backend — metering, live balance checks, mid-session cutoff — and choosing it
late is expensive.

The schema holds any of them. **Decide before the booking phase.**

### 5.2 The duplicate SKUs — TBD

The same products are sold twice at different prices:

| Product | As a premium tier | As a report | Ratio |
|---|---|---|---|
| The Relationship Report | ₹899 | ₹2,697 | 3× |
| Eros — for two | ₹1,299 | ₹3,897 | 3× |

And **Ask the Stars at ₹349 is the same SKU as the 12-question pack at ₹349** —
identical price, identical grant, sold from two places.

Whichever price wins, one of those lists loses rows. Premium becomes a
*merchandising view* over reports and question packs rather than a third
catalogue, which is what forces this to be resolved rather than encoded.

### 5.3 The report multiplier — decide, then delete

Report prices are `base × 3`, computed when the module loads. It is a placeholder
that was never replaced.

It has **already compounded once**: a consultant ledger row bills a "Natal
report" at ₹4,041, which is 449 × 9 — the multiplier applied twice, to the
*Remedial* base rather than Natal's. That number matches no report in the
catalogue.

Six real prices get typed once, and the multiplier is deleted before anything
reaches a database.

### 5.4 Cancellation and refunds — TBD

Charging at booking time makes every cancellation a credit, and who may cancel,
until when, and for how much is business policy that becomes ledger rows.

Default if undecided: **debit at booking, no self-service cancellation, refunds
only as an admin-written reversing entry.** Ship that and say so in the app.

### 5.5 Consultant ranking formula — TBD

Admin capability 1 includes controlling where consultants appear. What feeds the
score — rating, reply time, completion rate, recency, a manual boost, or paid
placement — is a product decision with revenue implications, and paid placement
in particular changes what the ranking *means* to a seeker.

---

## 6. Admin capabilities

Nine, none built. All read across every user, which is why the console is a
separate application.

| # | Capability | Notes |
|---|---|---|
| 1 | **Academy CMS and consultant ranking** | Two things. Content ordering is small; ranking affects who earns |
| 2 | **Deity images and tarot decks** | Upload with **artist, licence and source as required fields**. Reverses the "static content ships as JSON" position, deliberately |
| 3 | **Marketplace** | Products, images, stock, orders, fulfilment |
| 4 | **Reschedule a session** | Money does not move — the original charge stands |
| 5 | **Approve consultant signups** | A queue. Until approved: invisible, unbookable, cannot earn |
| 6 | **Remove posts, block consultants** | **Soft delete only.** A removed post in a dispute is evidence. Blocking a consultant with confirmed bookings and a pending balance needs a policy — see below |
| 7 | **Reviews, with admin audit and consultant analytics** | Reviews tied to completed bookings carry a verified badge |
| 8 | **Search users and consultants, spend history, analytics** | The most privacy-sensitive capability. Every lookup is audited |
| 9 | **Detect consultants gaming calls and messages** | Flags for human review — never automatic penalties |

### Permission tiers

**Support** reads and searches. **Moderator** removes content and blocks.
**Finance** touches payouts and refunds. **Superadmin** manages admins.

Least privilege from the first day, because retrofitting tiers later means
auditing every call site that assumed god mode. **Every action of every tier is
audited**, which is what makes an appeal answerable.

### On capability 9

It measures things that already exist as consultant metrics: median reply time,
calls attended against calls requested, sessions completed, connected duration
against booked duration, zero-message chat sessions.

**It is a scheduled query, not a machine-learning project.** Thresholds live as
editable rows so they tune without a deploy.

**It flags; a human decides.** Heuristic detection has false positives, and
auto-penalising someone's livelihood on a threshold produces appeals that cannot
be answered. This is a product decision as much as a technical one: an accused
consultant must be able to see the flag and respond to it.

### Unresolved admin policy

**What happens when a consultant with confirmed bookings and a pending balance is
blocked?** Their seekers have paid. Options are refund-and-cancel, honour the
bookings then block, or hold the balance pending review. Needs an answer before
capability 6 ships.

---

## 7. Scope — v1

**A seeker signs in, tops up, sees real consultants, books a real slot with real
money, and chats about it.**

That is the revenue path and roughly a third of the surface. Everything else
keeps running on mock data with **no front-end change at all**.

### In

Login · profile with birth details that survive a reload · wallet with real
money · Razorpay top-up · real consultant list · availability · booking that
charges and reserves · chat that persists · consultant approval · consultant
earnings ledger.

### Out, and still mocked

Shop · Academy · Pooja · Tarot · Reports · Premium · Ask AI · live video ·
payouts · KYC · notifications · referrals · insights and earnings charts · the
admin console.

**No admin console in v1.** Approving a consultant, blocking one, removing a post
— do it in the database GUI. It is a marketplace with one real consultant. Build
the console when clicking through the GUI hurts, somewhere north of twenty
consultants.

### Deliberately not in v1, despite being tempting

- **Payouts.** Most regulated, least urgent. Nobody is owed money on day one.
- **Live video.** The most expensive integration, and chat proves the marketplace
  works first.
- **The astrology itself.** Charts and horoscopes stay fixed until the booking
  loop earns money. The uncomfortable truth is that the readings are the product
  narrative but the booking is the business.

---

## 8. Regulatory and legal

- **KYC gates the first payout.** Not a feature — a legal gate. It blocks the
  entire payout capability.
- **Marketplace tax.** GST, and TDS on consultant payouts. Talk to a CA before
  writing payout code, not after.
- **Astrology advertising is regulated.** Disclaimers required; no medical claims
  and no financial-advice claims. The existing copy voice already refuses to
  promise outcomes, which helps.
- **Image licences are a product constraint.** Of 26 murtis, four are CC BY and
  three are share-alike, and the processing pipeline produces **derivatives that
  inherit the obligation**. Attribution must remain reachable in the interface,
  and share-alike images may not go behind a paywall. If the attribution surface
  is removed, the images have to be removed with it.
- **Scripture is not editable copy.** The 48 Bhaktamar verses are the tradition's
  words. Two are currently incomplete and are flagged as such rather than
  reconstructed — a plausible wrong shloka is undetectable to the person it
  misleads.

---

## 9. Success criteria

v1 has worked when:

1. A seeker signs in, closes the tab, returns, and is still themselves with their
   birth details intact.
2. Devtools cannot change a wallet balance.
3. Replaying the ledger from zero reproduces every balance exactly.
4. A real ₹1 payment credits once, and a duplicated webhook still credits once.
5. Two people tapping the same slot produce one booking, one clear refusal, and
   no orphaned debit.
6. A message sent from the seeker side appears on the consultant side without a
   reload, attributed correctly on both.
7. An unapproved consultant is invisible to seekers.

Business signals are deliberately absent from that list. v1 is a correctness
milestone.

## 10. Non-goals

- A social network. The feed exists to surface consultants, not to retain
  scrollers.
- Free astrology at scale. The free tools are an entrance, not the product.
- Western astrology parity. The product is Vedic-first, with other traditions
  present in the tarot decks only.
- A pandit-booking or physical-puja marketplace. The mandir is e-puja and charges
  nothing, on purpose.
- Desktop for seekers. The app is a 420px phone frame. Only the admin console is
  a desktop product.
