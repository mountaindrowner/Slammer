# SLAMMERS — build roadmap

The working breakdown of `VISION.md` into buildable steps. Doc hierarchy:

- `CLAUDE.md` — engineering rules (always obey)
- `VISION.md` — the big picture: front door, economy, acts, chips, feel (source of truth for *what*)
- `DESIGN.md` — moment-to-moment loop design
- `HANDOFF.md` — how the v0.7 codebase works + extension cookbook (§13)
- `ROADMAP.md` — this file: *what order, what scope, what done means*

Rule carried from the vision: **every step leaves the game playable end-to-end**, and every
step ends with a green harness run (`?auto=1` → `TESTDONE`, captures/slam in 0.4–0.6, no
`force-settle` spam) before commit.

**Status legend:** `[ ]` not started · `[~]` in progress · `[x]` done (version noted)

---

## Decisions the vision resolves (previously open)

- **Aimed flips (HANDOFF §12A):** DECIDED — yes, via the Throw v2 attitude gesture. Skill
  lives in the hands: attitude (360° tilt), power curve, Tournament Grip band. No scoreboard.
- **Turn gating:** DECIDED — the settle rule. Turn never advances while anything moves; the
  slammer becomes a sim citizen that settles and then fades.
- **Camera:** DECIDED — frame the pot cluster (~3.5–4.5 u) at ~35–38°, world in the backdrop.
- **Economy:** DECIDED — two currencies. Chips = wagered health; **Lunch Money** = earned
  build budget, itemized on a receipt, with piggy-bank interest at shops.
- **Meta shape:** DECIDED — Starter Stacks (deck select), Collection on the main menu
  (all-time trophy binder) vs in-run Binder (working set). Breadth-not-power unlocks.
- **Chip faces:** DECIDED — procedural only; the Gemini face pipeline stays parked
  (revisit trigger: a phone playtest where finishes land but faces read samey).
- **Difficulty arc:** DECIDED — four acts, each breaks one rule; curveballs are three data
  keys on nodes (`field`, `layout`, `wincon`) + existing `rule` on rivals. Act 1 uses none.
- **Codebase shape:** DECIDED (pre-Phase-A) — development moved to `src/` modules, built by
  `python3 build.py` (plain concatenation, verified byte-identical at the split). The shipped
  artifact remains one self-contained `index.html`; both are committed. CLAUDE.md updated.
- **Physics engine:** DECIDED (re-confirmed against the vision) — the custom sim stays.
  Field conditions (tilt, low-g, wind, drains, bumpers) are parameter/force mutations that are
  *easier* in our sim than in a solver, and the settle rule, attitude throws, and LOYALTY
  assists all require authored physics. The Rapier trigger from HANDOFF §3 stands unchanged.

## Still open (playtest questions — do not decide in code)

Wincons rotate vs map-visible · Blind Bag act-gating · alien chips player-obtainable? ·
final SANDLOT name · Collection/Binder split legibility · slammer scarcity · run-loss
severity (wipe vs protected page).

---

# PHASE A — THE FEEL LOCK (steps 1–4)

> After Phase A, a phone playtest of one full match is the gate that validates throw feel and
> the venue budget before any content scales. Nothing in later phases is worth building if
> Phase A doesn't feel right.

## Step 1 — Settle rule + slammer physics  `[x]` (v0.8.0)
*Vision §7 (settle rule). Pure feel; unblocks honest playtesting.*

- [x] Slammer is a sim citizen: `launchSlammerBody()` after impact (and after the bouncer's
      hop) gives it velocity/spin and it runs through the same `stepTazo` physics as chips —
      generalized per-body dims (`bR`/`bH`), mass-weighted collision (m=3 vs chips' 1, so it
      bats chips around, not vice versa), settles via the wobble, then fades 0.5 s.
- [x] Turn gate: sim resolves only after the whole table is still for `STILL_N` consecutive
      frames (15, AUTO 5); `maybeEndTurn` blocks while any slammer phase precedes `fade`.
      Captures key off the settle event, not impact.
- [x] Straggler assist: after 4 s of live sim, damping ramps (friction quietly wins); the 7 s
      hard cap force-settles through `beginSettle` (wobble, never a teleport). Anti-stall
      clock now counts only while the table is live.
- Verified (v0.8.0 run): median 1.8 s impact→still, max 7.6 s, only 2 hard-cap saves in 75
  slams, caps/slam 0.40, bouncer double-hit intact, run won, no errors.

## Step 2 — Throw v2 + capture-band retune  `[x]` (v0.9.0)
*Vision §7 (attitude, power curve, Tournament Grip).*

- [x] **Attitude gesture — flick to tilt:** the drag aims; the drag's *motion at release*
      tilts. Stop dead and let go = flat pancake; flick through the stack = edge-first bite
      in that direction (smoothed 120 ms drag-velocity → direction + amount, deadzoned).
      A translucent ghost slammer above the reticle previews the tilt live. Edge impacts:
      radius shrinks, force/torque concentrate in a lane along the drive direction
      (`EDGE_LANE/EDGE_F/EDGE_T`), push bends forward, and the tumble axis biases so chips
      **flip away from the strike edge** — the aimed-flips layer. The slammer visibly falls
      tilted and drives through with forward momentum after edge hits.
- [x] **Power curve:** golf swing — smoothstep ramp to peak at 0.85 s, fast falloff, sloppy
      sag (extra aim scatter, never fouled). `powerCurve/gripAt/sloppyAt` in TUNE terms.
- [x] **Tournament Grip:** ~160 ms band at the peak (marked on the bar, fill brightens
      inside it). In-band: force ×1.1, torque ×1.15, scatter ×0.3, celebration popup + SFX.
- [x] Rival AI + harness throw through the same input space: per-rival `throwStyle`
      (Milo flat/sloppy, Cheater edge/gripped, Rich Kid flat/max-power); AUTO driver covers
      flat and edge, gripped and sloppy, and logs `tilt=`/`GRIP` per slam.
- [x] Band re-committed: 0.43 / 0.38 across verification runs; edge and flat trade advantage
      situationally rather than one dominating.

## Step 3 — Callouts  `[ ]`
*Vision §7 (callout table). Rides entirely on events steps 1–2 emit.*

- [ ] Event detector keyed off the settle event: FLIPZILLA (6+ caps/slam), RAZOR'S EDGE
      (~90° edge impact → flip), THE GOOGLIE (high-spin → flip), WHAMMIE (final chip),
      KINI KUNG FU (max power in-band), BOOMERANG (slammer rebounds onto the stack),
      CLEAN SWEEP, THE THWACK (in-band release + 3 flips).
- [ ] One callout per slam, highest rarity wins; stamp-in marker type ~1 s; one SFX hit.
- [ ] Rare callouts carry a Lunch Money kicker line (wired for real in Step 5; log-only now).
- [ ] Rule enforced in code review: triggers must trace to player-steered inputs (attitude,
      power, placement) — never pure physics luck.
- Touches: capture pipeline, a new `CALLOUTS` table, `#fx` layer, tlog.
- Done when: a good slam gets named, and the names teach technique (AUTO logs which callouts
  fire and at what rates — RAZOR'S EDGE should correlate with edge attitude, etc.).

## Step 4 — Camera + first venue (the driveway)  `[ ]`
*Vision §9. Prove the venue budget on ONE venue before content scales.*

- [ ] Pot-cluster framing: fit radius from live cluster bounds (~3.5–4.5 u), elevation
      ~35–38°, aim-drift toward reticle, arena ring allowed off-frame.
- [ ] Two-finger gestures: pinch dolly (2.5–6), twist yaw, drag pan (clamped), double-tap
      home + auto-home ~4 s into rival turn. User offset layer composed over sway/follow/
      punch; pitch clamped; second pointer kills in-progress aim; inertia with fast damping.
- [ ] Backdrop pipeline: 2–3 baked billboard canvas planes (15/30/60 u) with parallax from
      camera sway, pre-darkened into the sky color (no fog). ≤4 draw calls. CSS sky stays.
- [ ] Driveway venue to the corner-store standard: surface (chalk on driveway asphalt),
      midground (sprinkler ticking, fence, parked car), backdrop (cul-de-sac at golden hour),
      signature (dog behind the fence — barks at whoopees).
- Touches: `fitCamera`/`placeCamera`, pointer handlers, scene setup, a new `VENUES` registry
  keyed by rival.
- Done when: chips read as printed objects at gameplay zoom (the rim/finish art budget is
  finally visible), orbiting the table shows a place, and frame time holds on the webview
  budget (`setPixelRatio(1)` etc. — CLAUDE.md rules hold).

**PHASE A GATE:** phone playtest of a full match. Judge: throw feel, settle tension, venue
cost. Only then proceed.

---

# PHASE B — ECONOMY & OBJECTS (steps 5–7)

## Step 5 — Lunch Money + the receipt  `[ ]`
*Vision §3. Pure UI/state; makes wins legible before the shop can spend them.*

- [ ] `run.money`; match-end awards exactly per the table: $4 win · $1/capture (win or lose) ·
      +$3 clean sweep · +$2 underdog (rank-sum ante'd down) · +$1 per bell-saved staked chip ·
      piggy bank +$1 per $5 held at shop (cap +$5).
- [ ] The receipt: itemized lines ticking in one at a time with a register ka-ching per line
      (Web Audio). Callout kickers land here.
- [ ] Money visible on map/shop screens; $0 at run start (the locked-shop tutorial beat).
- Touches: `endMatch`/result screen, `ringBell` (record survivors), run state, SFX.
- Harness: receipt lines to tlog; assert money math (`MONEY start=0 … end=N` reconciles).
- Done when: the receipt reads as "here's what your play earned," line by line.

## Step 6 — Shop v2 + Blind Bags + first finishes  `[ ]`
*Vision §4 + §8. The build moment and the dopamine ritual.*

- [ ] Shop v2 priced in Lunch Money: singles wall (2 chips + 1 slammer, rotating), Trade
      Counter (sell at kid-logic rates; rotating "collecting this week" bonus), Rumors ($1 —
      reveals next boss's rule + demand on the map).
- [ ] Blind Bags: Chum ($4, 3 commons) · Weird ($5, 2 effect rares) · Heavy ($5, phys/field) ·
      Foil ($6, 1 chip, elevated legendary odds, guarantees HOLO+). Reveal ritual: shake →
      peel → slide → rarity glow → face. Never skippable under 2 s (AUTO gets a fast path).
- [ ] First three finishes, as a `finish` key on chip *instances* (not designs):
      **HOLO** (view-dependent rainbow sweep — fresnel hue rotation in the face material),
      **STATIC** (TV-snow face that resolves on settle — sells Step 1),
      **SURVIVOR** (earned wear from existing provenance/stake data — scuffs baked into the
      face canvas per match survived).
- [ ] Finishes are cosmetic-only (METAL later, via `phys`, is the one sanctioned exception).
- Touches: store screens, binder entry shape (`{key, prov, finish, wear}`), `paintDesign`
  (per-instance variants), a material hook for view-dependent effects.
- Harness: AUTO buys a bag; tlog the pulls; run-end binder reconciles.
- Done when: a Foil Bag pull is a top-3 moment and a HOLO mid-tumble reads at gameplay zoom.

## Step 7 — LOYALTY  `[ ]`
*Vision §8. Rarity gets teeth — one bounded, declared torque assist.*

- [ ] LOYALTY +1/+2/+3 by rarity, shown on the chip card. When *your* slammer's impact
      reaches a chip you own in the Pot, that chip gets a bounded flip-torque assist scaled
      by LOYALTY — through the standard hook path in `slamImpactAt` (ownership-aware `ang`
      multiplier), no dice, no rubber-banding.
- [ ] Tune inside the Step 2 band (LOYALTY shifts *whose* chips flip, not how many).
- Done when: staking rares is measurably less terrifying (harness: recapture rate of own
  rares up; overall band unchanged across 3 runs).

---

# PHASE C — THE FRONT DOOR (step 8)

## Step 8 — Menu, Starter Stacks, tutorial  `[ ]`
*Vision §2. The game opens like a game.*

- [ ] Main menu over the live cul-de-sac diorama (Step 4's backdrop reused, golden hour):
      PLAY · COLLECTION · SETTINGS, layout reserving future rows (MULTIPLAYER, DAILY COURT).
- [ ] Starter Stack select: SANDLOT unlocked and inspectable chip-by-chip; two locked stacks
      visible with one-line unlock hints (Heavy, Chaos as the first pair). Stack = chips +
      slammer (+ later a stated modifier).
- [ ] Collection screen: all-time chips across runs with finish/provenance/wear (persistent
      via localStorage — first cross-run state; keep it breadth-only).
- [ ] The transition: menu framing drops into play framing over the driveway in one ~1.5 s
      move, skippable after first view.
- [ ] Played tutorial, run one only: slam 1 aim-only → slam 2 power → slam 3 attitude →
      first in-band release pays the TOURNAMENT GRIP beat → rival narrates toss/ante/keeps
      in three diegetic lines. Never blocks input beyond one line; never repeats.
- Touches: screens/flow, `newRun` (stack param), persistence layer, tutorial overlay driver.
- Harness: AUTO path through menu → stack → tutorial run.
- Done when: first-minutes flow is menu → stack → driveway with zero loading walls, and the
  tutorial teaches all three throw layers without reading.

---

# PHASE D — STRUCTURE & THE ARC (step 9 → content passes)

## Step 9a — The knob system, proven  `[ ]`
*Vision §6. Three data keys, one instance each, before any content scales.*

- [ ] `NODES[i].field / .layout / .wincon` schema + per-node application hooks.
- [ ] First field condition: **tilted court** (constant lateral accel in `stepTazo`; visible
      as the floor plane actually tilted).
- [ ] First alt wincon: **Bounty** (marked chip worth the match; everything else terrain).
- [ ] Dosage rule encoded in act data: Act 1 none, Act 2 one knob/node, Act 3 two, finale three.
- Harness: **per-wincon auto-drivers** (Bounty AI aims at the mark; assert wincon resolution).

## Step 9b — Branching Court + act framing  `[ ]`
- [ ] Map v2: branching node graph (~10–14 nodes/act), legible node types (match/shop/boss/?),
      route choice as risk trade. Needs the 4th+ rivals to make branches mean something.
- [ ] Run summary screen: route taken, auto-named build, chips lost, the turn it flipped
      ("HE TOOK IT 6–5") — the near-miss honesty rule: no rubber-banding anywhere, ever.
- [ ] Act 1 completed as content: The Principal (confiscation bell — clock rule exists) mid-act,
      Rich Kid remains act boss.

## Step 9c → Act 2 content pass  `[ ]`
- [ ] Venues per rival to the corner-store standard (arcade champ, mob booth with the swinging
      lamp + hole-in-table Drain, the Mayor, the Resolute Desk).
- [ ] THE PRESIDENT boss; field conditions rolled out one per node.
- [ ] Remaining finishes as bag content across the act (MAGIC MOTION, POP-UP, METAL-via-phys,
      GLOW, WET INK, X-RAY, INFINITY, MISPRINT).

*(Acts 3–4 get their own passes after Act 2 ships: zero-G/orbit layouts, alien binders,
THE OVERLORD capture-veto, then THE ENGINE multi-phase finale. Not planned in detail here on
purpose — Act 2 will teach us the real per-act cost.)*

---

## Standing engineering notes

- The single-file, zero-asset, webview-budget rules in `CLAUDE.md` hold through all phases.
  Backdrops are baked canvas billboards, not geometry; venue detail is prop count.
- The harness grows with the game: throw driver (Step 2), receipt assertions (5), bag pulls
  (6), wincon drivers (9a), menu path (8). A step isn't done while `?auto=1` can't drive it.
- Version cadence continues: one step ≈ one minor version ≈ one commit ≈ one artifact publish.
- ~~Watch the file-size budget…~~ DONE pre-Phase-A: dev now lives in `src/` (22 modules by
  section), `python3 build.py` emits the identical single-file `index.html`. Add new systems
  as new numbered files rather than growing existing ones past a few hundred lines.
