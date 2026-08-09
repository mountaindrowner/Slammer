# SLAMMERS — run loop vision

The big-picture doc. `DESIGN.md` covers the moment-to-moment loop; this covers everything
around it: the front door, the run, the economy, the escalation arc, the chips as objects,
and the feelings we're engineering. Vocabulary rules apply (Binder, Pot, House Rules, the
Court — and new, enforced below: **Lunch Money**, **Blind Bags**, **Starter Stacks**,
**LOYALTY**, **Tournament Grip**, **Callouts**).

---

## 1. What makes roguelike loops work (research distillation)

Principles pulled from Balatro/Slay the Spire/Inscryption analysis, each mapped to us:

1. **Bite-sized chunks power "one more."** Balatro's blinds chunk a run so the next attempt
   never feels big. → Our matches are ~3 min; a run is ~8–10 nodes. Never let a node exceed
   ~4 minutes.
2. **The feedback IS the product.** Balatro is "just math" made visceral — strip the juice and
   it's a calculator. → Our physics sim is the juice engine; every capture must *land* (we
   already have hitstop/flash/shockwave — protect and extend this).
3. **Readability before spectacle.** Balatro reserves high-intensity effects for high-impact
   events and uses color as an information language. → Effect popups stay color-coded; the
   biggest VFX budget goes to match point, legendary flips, and boss rules triggering.
4. **Builds are the replay engine.** Balatro's replayability = crafting builds around specific
   hands/suits. → Builds = slammer pouch + chip archetype (cluster/magnet, heavyweight/bell,
   chaos/whoopee, control/sticky). Every shop should let you push a leaning.
5. **Losing must point forward.** Great roguelikes make a loss feel like information — you can
   see the decisions that killed you, and there's still something new to uncover next run.
   → Run summary screen that shows *the moment it turned*; meta unlocks are breadth, not power.
6. **Legible doom, not sudden death.** StS keeps health persistent within an act so a weak
   deck dies visibly and early rather than frustrating you at the boss. → The Binder thinning
   across matches is exactly this. Keep it visible at all times.
7. **Route choice is a real decision.** StS players eyeball the map for shops/elites/campfires
   and trade risk for payoff. → The Court map must branch, with legible node types.
8. **The question isn't "can I win," it's "will I be a god."** Late StS runs are about
   *how hard* you win. → Post-win scoring (Style points? clean sweeps? sweep streaks) and
   escalating rematches give the ceiling.
9. **Acts should escalate from familiar to otherworldly** — StS moves castle → alien; Inscryption
   *rewrites its own rules* each act. → This is our local→cosmic arc, and license for each act
   to break one rule the player thought was fundamental.

---

## 2. The front door — menu, Starter Stacks, first minutes

SLAMMERS opens like a game, not a cutscene. Story mode is the launch content, not the whole
product — the front door is built from day one to hold more (multiplayer is the obvious
future tenant). Atmosphere lives in the backdrop; the menu itself is honest UI.

### The main menu

The cul-de-sac at golden hour as a live diorama behind the UI — chalk circle on the asphalt,
porch lights coming on, the street curving away (the §9 backdrop pipeline, reused). The title
sits chunky and marker-drawn. The menu is a clean stack:

- **PLAY** → Starter Stack select → the Court
- **COLLECTION** — the all-time binder: every chip ever owned across all runs, with finish,
  provenance, and SURVIVOR wear on display. (Provisional call, flagged for Mark: Collection
  lives on the main menu as the permanent trophy room; the in-run Binder remains this run's
  working set. They are different objects with different jobs.)
- **SETTINGS**
- Future rows (MULTIPLAYER, DAILY COURT, etc.) get added to this stack when real — the layout
  reserves the room now so nothing needs redesigning later.

No autoplaying drama. The backdrop breathes (sprinkler ticks, a dog barks once in a while);
the menu waits.

### Starter Stack select

Press PLAY and you land on the Starter Stack screen — the Balatro deck-select move, in our
fiction. A Starter Stack is the binder page you walk out the door with: which chips, which
slammer, and (later tiers) a baked-in rule twist.

- **First run:** exactly one stack unlocked — the basic stack (working name **SANDLOT**;
  final name is Mark's call). Shown as a physical stack you can inspect chip-by-chip, then
  confirm. No choice paralysis on day one.
- **Locked stacks are visible** from the start, greyed with a one-line unlock hint ("Win a
  run" / "Beat THE PRESIDENT" / "Own 5 HOLO chips"). Seeing the shelf is the pull.
- **Variant stacks tilt the build, never the story.** A Heavy stack leans manholes and METAL;
  a Chaos stack ships whoopees and WET INK; a Collector stack starts poor in slams but rich
  in LOYALTY. Same Court, same rivals, different hand you're dealt.
- Later-tier stacks may carry a difficulty modifier baked in (the stake-equivalent), stated
  plainly on the stack's card.

### The transition in

Confirm the stack and the menu diorama IS the first venue — the camera drops from menu
framing down into play framing over the driveway chalk circle (one continuous move, ~1.5 s,
skippable after first view). The neighbor kid walks into frame. No loading wall between
"deciding to play" and "playing."

### First node, first match, the tutorial

The Court map shows the opening act with $0 Lunch Money — the shop node sits there visibly,
unaffordable, teaching the economy by being locked. The only live option is the first match.

The tutorial is played, not read — overlays on the opening slams of run one only:

1. *Slam 1:* aim only (attitude locked flat, power auto). "Drag to aim. Let go."
2. *Slam 2:* power unlocked — the curve meter appears. "Release at the peak."
3. *Slam 3:* attitude unlocked — the tilt gesture. "Tilt it. Edge bites, flat sweeps."
4. First sweet-spot release gets the **TOURNAMENT GRIP** callout with one extra beat of
   celebration — teaching that the band exists by paying it.
5. The coin toss, ante, and for-keeps rule are narrated by the rival, diegetically ("winner
   keeps what he flips — you know how this works"), one line each. He teaches you the stakes
   by taking your chips.

Rule: the tutorial never blocks input longer than one line of text, never repeats after run
one, and every mechanic it teaches is re-discoverable through play (callouts and receipt
lines are the ongoing teachers).

## 3. The economy — Lunch Money

Chips are the *wagered* currency (the health bar). **Lunch Money is the *earned* currency**
(the build budget). Two currencies, two feelings: chips churn and hurt; money saves and spends.

**Clear rules (all visible on the match-end screen, itemized, one line each):**

- Win a match: **$4 base**
- Every capture, win or lose: **$1** (for-keeps means even losses pay something)
- **Clean sweep** (rival captures 0): **+$3**
- **Underdog** (won while ante'd down in total chip rank): **+$2**
- **Bell save** (your stake survived to the bell): **+$1 per surviving staked chip**
- **Piggy bank**: at each shop, **+$1 per $5 held (cap +$5)** — saving is a strategy, and
  spending your saved pile is a *decision with weight* (the Balatro interest feeling)

No money for slams, no money for style mid-match — money attaches to *outcomes* so the itemized
receipt reads as "here's what your play earned."

## 4. The shop cadence & Blind Bags

Run rhythm: **2–3 matches → shop → 2–3 matches → shop → boss**. The shop is the exhale and the
build moment. Corner Store already exists; it grows into:

- **Singles wall** — 2 chips + 1 slammer, visible, rotating. Known quantities, fair prices.
- **Blind Bags** — the pack-opening ritual. Sealed foil bag, themed, $4–6:
  - *Chum Bag* (3 commons, cheap filler for ante fodder)
  - *Weird Bag* (2 rares from the effect pool)
  - *Heavy Bag* (phys/field chips)
  - *Foil Bag* (1 chip, elevated legendary odds, expensive)
  The reveal is a ritual: bag shakes, peels, chips slide out one at a time, rarity color glow
  before the face shows. This is a top-3 dopamine moment — budget real animation here.
- **The Trade Counter** — sell chips from the Binder at kid-logic rates (the store guy lowballs
  legendaries and overpays for whatever he's "collecting this week" — a rotating bonus that
  makes selling a puzzle).
- **Rumors** ($1) — buy intel on the next boss's House Rule and demand. Information as a good.

## 5. The Court — act structure, local → cosmic

**The prime tone rule: the tazos never change.** Same cardboard chips, same binder of playground
junk, from the first sidewalk match to the edge of the universe. What escalates is the
*opposition* — and the deadpan joke carrying the whole arc is that everyone, at every scale of
existence, takes tazos completely seriously. The President clears his desk for it. The aliens
crossed the galaxy for it. Your SMILEY chip sits on the event horizon table exactly as it sat
on the curb.

Four acts, ~10–14 nodes, branching. Each act **breaks one rule the player thought was
fundamental** (the Inscryption move) and escalates the venue and the rivals.

### Act 1 — THE BLOCK
The neighbor kid, the schoolyard, the cul-de-sac. What we have. Teaches the honest game: one
stack, one pot, flat asphalt. Mid-node: **The Principal** (confiscation bell). Boss: **The Rich
Kid** (MINT CONDITION).
*Rule you learn:* physics is fair.

### Act 2 — THE GROWN-UPS
The secret: adults never stopped playing. The city champ at the arcade, a mob guy in a
back-room booth ("house always wins" rule), **The Mayor** on the city-hall steps — and the act
boss: **THE PRESIDENT**, chips out on the Resolute Desk, secret service calling the coin toss.
*Rule that breaks:* **the arena stops being flat.** Field conditions arrive (§6): tilted
courts, vents, bumpers, the mob booth with a hole in the table.

### Act 3 — FIRST CONTACT
They didn't come for our water. UFO tractor-beam court, the gray guys, a zero-G mothership
deck, an intergalactic tournament where every species brought its binder. Alien rivals stake
alien-printed tazos — still tazos, just bootlegs from planets you've never heard of — and they
play *weird*.
*Rule that breaks:* **the pot stops behaving.** Multi-stacks, mutating win conditions (§6),
rival chips with physics-cheating effects. Boss: **THE OVERLORD** (capture-veto rule — flip his
crown chip or nothing you take counts).

### Act 4 — THE ENGINE
Past the last star there is a machine the size of a galaxy, and it has been slamming since
before there was anyone to play against. It is immense. It is patient. It has never lost.
Courts: a rooftop under a wrong sky, the Moon (low gravity, for real), the rings of Saturn,
and finally the deck of THE ENGINE itself — a black table lit by dying suns, your cardboard
binder on one side, eternity on the other.
Boss: **THE ENGINE** — multi-phase; every prior act's broken rule returns at once.
*Rule that breaks:* **scale.** And the answer to it: your junk holds its own, because you
built it.

Tone note: cosmic ≠ grimdark. Bootleg-90s cosmic — glow-in-the-dark star chips in the shop,
airbrushed van-art nebulas, the Moon rendered like a mall poster. THE ENGINE should feel like
the cover of a cassette tape a kid would think is the coolest thing ever made.

## 6. Curveballs — flipping the gameplay on its head

Four orthogonal knobs, so surprises compose instead of repeating. Each is a data key on the
node (`NODES[i].field / .layout / .wincon` + existing `rule` on rivals):

**A. Field conditions (arena mutators)** — *where* you play changes physics:
- Tilted court (everything drifts downhill; herding is free one way, impossible the other)
- Ice / rain-slick (low friction — sliders never stop, GUM WAD becomes gold)
- Low gravity (moon court: everything flips easy, floats long — chaos up, control down)
- Wind / air vent (a visible lane of continuous lateral force)
- The Drain (a hole; chips that slide in are gone from the match — not captured, *gone*)
- Bumpers / curbs (bank-shot terrain; the bead-ring collision already supports this)
- Tiny court (half radius — every slam hits everything; whoopees become bombs)

**B. Pot layouts** — *what* you're slamming at:
- Multi-stack (pot split into 2–3 stacks; choosing which to attack is the turn decision)
- The Wall (chips stacked vertically like a tower — topple physics)
- Scatter start (no stack; chips pre-strewn — a board state to read, not a tower to crack)
- The Orbit (stacks on a slowly rotating platform — timing enters the aim)

**C. Win conditions** — *why* you're slamming (defaults to capture-majority-at-bell):
- **Bounty** — one marked chip is worth the match; everything else is terrain
- **King of the Court** — own the chip nearest center when the bell rings
- **Sudden Death** — first capture wins; one slam each, best setup wins (a duel, not a brawl)
- **Protect the Egg** — your golden chip must survive N of the rival's slams
- **The Heist** — the vault chip is ringed by MANHOLEs; crack the defense before the bell
- **Doubles** — 2v2 with an AI partner whose chips mix into your pot (partner barks included)

**D. House Rules** — *who* you're playing (exists; the per-rival cheat layer).

Composition examples that write themselves: Bounty + Ice ("catch the greased pig"), Multi-stack
+ Tilted ("the downhill stack is easier — and everyone knows it"), Protect the Egg + The Drain
("keep your egg away from the hole while he herds it there").

**Dosage rule:** Act 1 uses none. Act 2 introduces one knob per node. Act 3 composes two.
The final boss composes three. Surprise needs a baseline of normal to deviate from.

## 7. The Throw — skill lives in the hands

The core input, three layered skills, no scoreboard. This is the depth fix: reward technique,
not luck, and keep everything inside the physics sim.

**1. Attitude (drag gesture, first).** Aim sets where the slammer comes down; attitude sets
*how it's tilted* when it lands, adjustable a full 360°. The throw always travels down at the
target — only the slammer's orientation is in play. Flat = pancake impact, force spread wide,
best against scattered chips. Edge-leading = bites at a point and drives through, violent
concentrated movement, best for blasting into a tight stack. This mirrors the real game:
the old handbook's long-range throws traded accuracy for power and spin, short-range traded
power for placement — flat vs. edge is our version of that same tradeoff.

**2. Power (curve, second).** The meter isn't linear — it ramps fast, peaks, and falls off
fast, golf-swing style. Getting the power you want takes timing; overshooting is easy and
punished with a sloppy throw, not a fouled one.

**3. The sweet spot.** A thin band near the peak of the curve. Release inside it → the throw
comes out *clean*: a touch more force, tighter accuracy, extra flip torque on contact. Call
the band the **Tournament Grip** — the W.P.F. really did sanction exactly one grip for
official competition, and nailing it is what separates technique from luck.

Physics tuning note from the real game: ~12 caps was the known ideal stack — enough for the
"thwack," while overstuffed stacks just collapse without flipping. That's a real-world
confirmation of the capture-band problem: pot size and stack layout are tuning levers for
flip rate, not just difficulty dressing.

### The settle rule — the table decides when the turn ends

Hard match-flow law: **the turn does not advance until every chip is at rest.** No bell, no
capture tally, no rival slam while anything is still moving — the tension of watching one chip
wobble on its edge IS the game, and cutting it short kills the best moment we have.

Engineering spec:
- **The slammer is a citizen of the sim.** It never vanishes on impact — it hits, flips,
  tumbles, and settles under the same physics as everything else. Only once at rest does it
  fade (~0.5 s), clearing the table for the tally. The slam should look like a thing that
  happened, not an effect that played.
- *At rest* = linear + angular velocity under threshold for N consecutive frames (tune ~15),
  every chip and the slammer.
- *Straggler assist:* if any chip is still live after ~4 s, ramp its damping so it winds down
  naturally — invisible hand, looks like friction winning.
- *Hard cap:* at ~7 s, snap the chip to its nearest stable face with a tiny settling wobble
  (never a teleport). The rule: the player must never see a chip frozen mid-air or standing
  on edge when the tally runs.
- The capture tally, callouts, and receipt all key off the settle event, not the impact —
  captures aren't real until the table is still.

### Callouts — named technique, shouted

Every great hit gets a name slammed across the screen for ~a second (stamp-in, chunky marker
type, one SFX hit — celebration, not interruption). Two sources feed the library, and the mix
is the point: half the vocabulary is *real 90s playground lore* from the POG handbook, half is
ours. It should feel like technique passed down, not random flavor text.

| Callout | Trigger (all detectable in sim) |
|---|---|
| **FLIPZILLA** | 6+ captures in a single slam |
| **RAZOR'S EDGE** | near-perfect vertical (edge ~90°) impact that flips a chip |
| **THE GOOGLIE** | high-spin impact converts to a flip (real handbook throw) |
| **WHAMMIE** | flipping the final chip in the Pot (real: the last-cap specialist's shot) |
| **KINI KUNG FU** | max-power release inside the Tournament Grip band (real: the jump slam) |
| **BOOMERANG** | slammer rebounds high and lands back on/near the stack (real: catch-your-kini flex) |
| **CLEAN SWEEP** | table cleared (already pays +$3 on the receipt) |
| **THE THWACK** | sweet-spot release with 3+ flips — the platonic slam |

Rules of the library: callouts trigger on *outcomes the player steered* (attitude, power,
placement), never on random physics luck alone — that's what makes them read as technique.
One callout per slam, highest rarity wins. Rarer callouts can carry a Lunch Money kicker on
the receipt ("RAZOR'S EDGE bonus +$1") so style literally pays.

Reserved from the same lore for later systems: **Snakebite** (the classic trap-chip house
rule — flip the snake, forfeit the round's captures) is sitting right there for a House Rule
or a cursed chip in a Weird Bag.

## 8. The chips — finishes, depth, and the collect impulse

Chips are the collectible, the currency, and the health bar — they deserve the biggest art
budget in the game. Target: a chip held up close (Binder view, capture close-up) should make
someone want to own it. Period-authentic bonus: the real product lines literally shipped
Techno, Magic Motion, Hologram, Metal, and Glow variants — so finish tiers aren't a gamey
bolt-on, they're canon.

All of these are achievable in the zero-asset pipeline (canvas textures + shader tricks +
view-angle math), no image files:

**HOLO FOIL** — the flagship. View-dependent rainbow sweep across the face (fresnel-driven
hue rotation). The sheen must *move* as the chip tumbles and as the player orbits the camera
— which is exactly what the two-finger orbit gesture is for. Rarity glow you chase in every
Blind Bag.

**MAGIC MOTION** — lenticular. Two art frames that swap as viewing angle crosses a threshold,
with a soft interlaced flicker at the crossover. A chip that winks. (Real product name —
free lore.)

**POP-UP** — fake interior depth. Layered face textures offset by view vector (interior-mapping
trick) so the art floats inside the chip like a tiny diorama under glass. The "wait, HOW" chip
— best reserved for legendaries.

**METAL** — brushed-steel face, anisotropic glint... and it's *heavier in the sim*. The one
finish that crosses into physics (as a proper `phys` hook): drops harder, flips less, hits
like a slammer. Real metal tazos existed; kids knew they were unfair. That's the point.

**GLOW** — charges in bright venues, glows in dark ones. Pure emissive trick, but it turns
into a slow-burn payoff: the chip you've carried since the driveway starts *glowing* on the
mothership deck. Cosmic bootleg energy.

**STATIC** — the face is animated TV snow that resolves into the art only when the chip comes
to rest. Ties directly into the settle rule: the table goes still, the picture tunes in.

**WET INK** — the print smears on hard impacts and slowly re-forms while it lies on the table.
Slightly cursed. Weird Bag material.

**X-RAY** — the back face is the front art's skeleton. Face-down (captured) X-rays look
*better* than face-up, which messes with the flip logic in the player's head in a fun way.

**INFINITY** — infinity-mirror face. Nested glowing rings receding into fake depth (parallax
layers shrinking toward a vanishing point), so looking into the face is looking down a lit
tunnel — then you tilt it side-on and it's just a cardboard chip, thin as ever. The lie is
the magic. Best-in-slot "hold it up to your eye" chip; natural legendary tier alongside POP-UP.

**MISPRINT** — procedural bootleg charm: off-register color plates, a typo'd name, clipped
die-cut. Every misprint generates differently, so no two runs' misprints match. The chip
that's valuable *because* it's wrong.

**SURVIVOR** — not a finish you buy: wear the chip *earns*. Scuffs, dents, and edge chips
accumulate per match staked-and-survived, baked from the provenance data we already store.
A dinged-up SMILEY that lived through nine antes should look like it. This is the Binder's
emotional engine — cheap to render, impossible to fake.

**Rarity has teeth — the LOYALTY stat.** Rarity shouldn't be purely cosmetic; give it one
small, legible mechanical edge. Every chip carries LOYALTY (+1 common → +3 legendary): when
*your* slammer's impact reaches a chip you own in the Pot, that chip gets a flip-torque assist
scaled by its LOYALTY. Fiction: rare chips are loyal — they fight to come home to your Binder.
Design consequences, all good: staking rares is less terrifying (they're easier for you to
recover, including bell saves), rival rares stay hard to take (they're loyal to *him*), and
the collect impulse gets a gameplay reason on top of the visual one. Translation note: the sim
is deterministic physics, not dice — so "+2 chance to flip" is implemented as a bounded torque
assist through the standard `effect` hook, visible on the chip's card, and tuned *inside* the
committed 0.4–0.6 capture band. No hidden dice, no rubber-banding — LOYALTY is a declared chip
power, same class as MECHA-TAZO's overclock.

Design rules: finishes are cosmetic-only (METAL is the single sanctioned exception, and it
goes through the standard `phys` hook, not a special case). Finish rarity gates Blind Bag
excitement: Chum Bags pull matte, Foil Bags guarantee one HOLO+. Every finish must read at
two distances — the sheen visible mid-tumble at gameplay zoom, the detail rewarding the
Binder close-up.

**Parked, deliberately: the Gemini face pipeline.** The Underdogs machinery (Gemini image
gen → Playwright compositor → sprite atlas → base64) exists and could paint chip faces — and
we are not using it. Two reasons, both Mark's call: painted raster faces would clash with the
procedural look everything else is built in, and a face atlas re-opens the webview memory
fight. Revisit trigger: a phone playtest where the finishes land but the *faces* read samey.
Until then: procedural faces, full stop.

## 9. Staging & camera — close play, wide world

Two framing changes, working together:

**Tighter on the game.** The camera fits the *pot cluster*, not the full arena circle — frame
radius ~3.5–4.5 units instead of 6.4+, chips readable as objects with printed faces, the arena
ring allowed to run off-frame. During aim, drift toward the reticle; on captures, the existing
dolly punch. The action should feel like kneeling over the game, not surveying it.

**Wider around it.** Because the camera sits closer and lower (~35–38° instead of 42°), the
horizon enters the frame — and that's where the act's world lives. Each act dresses a backdrop
ring well outside play space:

- *The Block:* the cul-de-sac in the distance — houses with lit windows, parked cars, the
  street curving away, a basketball hoop, sunset sky
- *The Grown-Ups:* city hall columns, the arcade's neon spill, the Oval Office curtains
- *First Contact:* the tractor beam you're standing in, the mothership interior curving up,
  Earth hanging outside a porthole
- *The Engine:* machinery the size of weather, dying suns, the works

**Every rival owns a place.** Venues aren't act wallpaper — each rival has *their* table, and
walking into it is part of meeting them. The play surface itself is diegetic: you're never on
an abstract arena, you're on somebody's turf. Venue anatomy, three layers plus a signature:

- *Surface* — what you actually slam on, with its own texture and reads: curb asphalt, a
  school desk with pencil grooves, the corner-store counter, green felt, the Resolute Desk
  blotter, brushed alien alloy
- *Midground* — the room at arm's reach, where the detail budget goes
- *Backdrop* — the painted billboard layers (act-scale world)
- *Signature* — one animated or interactive touch that makes it THEIRS

The corner store as the reference standard: you play **on the front counter, right by the
register**. Midground: the register itself (it rings on Lunch Money payouts — reuse the receipt
ka-ching), lotto scratchers under the glass you're slamming on, the cigarette wall, a slushee
machine cycling colors, the hot-dog roller turning, "NO LOITERING" sign, the door chime when a
match starts. Signature: the clerk leans into frame to watch big slams. Every venue should
answer: what's the surface, what's humming in the midground, what leans in.

Other venue sketches: neighbor kid = driveway chalk court, sprinkler ticking, dog behind the
fence (barks at whoopees); the Principal = his own desk, your confiscated stuff visible in the
drawer; the mob guy = back-booth felt with a hanging lamp that swings on impact; THE PRESIDENT
= the Resolute Desk, red phone (it rings if you're winning too hard); the mothership = deck
with Earth in the porthole and captured cul-de-sac props floating in a specimen jar.

**Camera controls (mobile gestures).** Player-driven camera on top of the cinematic rig:

- **One finger** stays gameplay: aim + power (untouched)
- **Two-finger pinch** = zoom (dolly the fit radius between ~2.5 close-up and ~6 overview)
- **Two-finger twist** = orbit yaw around the pot (venues are built to be seen from any angle
  — this is what makes the diorama detail pay off)
- **Two-finger drag** = small pan, clamped to the court
- **Double-tap** = snap home to the default frame; auto-return home ~4 s after the rival's turn
  starts so the game never hides behind a forgotten camera

Engineering: pointer-event cache, two active pointers → each frame compute Δdistance (zoom),
Δangle (yaw), Δcentroid (pan); apply as a *user offset layer* composed on top of the existing
sway/follow/punch offsets so cinematics still work at any user framing. Clamp pitch entirely
(yaw + dolly only — no gimbal, no under-floor views). Kill any in-progress aim when a second
pointer lands. Inertia on release with fast damping. All offsets lerp home rather than jump.

**Engineering within the webview budget (CLAUDE.md rules hold):** backdrops are cheap layers,
not geometry — 2–3 baked billboard planes (painted canvas textures, same zero-asset pipeline
as the floor) at 15/30/60 units with parallax from the camera sway, plus the midground built from the existing low-poly prop pipeline — venue detail is prop
count, not poly count, and props repeat across venues with palette swaps. A vertical gradient sky stays
CSS. No fog: depth reads through the painted layers' value shift (distant layers pre-darkened
into the sky color when baking). Target: backdrop adds ≤4 draw calls per act.

This also solves a real problem: at 42° full-arena framing, chips are ~40 px on a phone. The
art pipeline (rim textures, printed-cap finish) is being paid for and not seen. Closer camera
is where that budget starts earning.

## 10. The dopamine map

Engineering the feel-good moments Mark named, by timescale:

| moment | the feeling | what we build |
|---|---|---|
| the slam lands | impact | hitstop, flash, clatter (have it — protect it) |
| reading the board | "I see the play" | stake variants as terrain make setups *visible*: gum cluster + one whoopee = a plan. Aim UI hints nothing — the pattern is the player's to spot, the payoff is theirs to own |
| the chain pops | jackpot | mecha chains, whoopee ripples — stagger the captures ~150 ms apart so the ear counts them |
| match point | tension | last chip settling in slow-mo close-up when the match hangs on it (backlog §12G — promote it) |
| the receipt | earned | itemized Lunch Money lines ticking in one by one with the register *ka-ching* per line |
| the blind bag | anticipation | shake → peel → slide → rarity glow → face reveal. Never skippable under 2 s |
| the build clicks | identity | first match after a shop where the new piece pays off — shops should sell *combos in halves* so this moment is engineered, not lucky |
| the near-miss | "one more" | loss screen shows the margin ("HE TOOK IT 6–5") and the turn it flipped, replayable as a ghost. A close loss must feel like *my* mistake, never RNG theft |
| the run banner | accomplishment | court-completion recap: route taken, build named (auto-generated: "Gum-Wall Cluster Build"), chips lost along the way, trophy minted |

**Near-miss honesty rule:** rubber-band nothing. No pity boosts, no hidden rival nerfs at match
point. The "almost had it" feeling only converts to "one more run" if the player trusts the
sim; the moment they suspect the game let them get close, the loop dies.

## 11. Reconciliation with the current build

What this vision *changes* about v0.7, in system terms:

- **Match feel:** settle-rule turn gating; slammer stays in-sim and fades after rest; the
  three-part throw (attitude gesture → power curve → Tournament Grip band); Callouts.
- **Objects:** finish tiers on chips (HOLO, MAGIC MOTION, POP-UP, METAL, GLOW, STATIC,
  WET INK, X-RAY, INFINITY, MISPRINT, SURVIVOR); the LOYALTY stat via the standard `effect`
  hook; METAL via the standard `phys` hook.
- **Presentation:** pot-cluster framing, per-rival venues (surface/midground/backdrop/
  signature), backdrop billboard pipeline, two-finger camera gestures, front door + Starter
  Stack select + played tutorial.
- **Structure & economy:** Lunch Money on top of chip migration (chips = health/wager, money
  = build budget); shop v2 + Blind Bags; acts with branching nodes; the three curveball data
  keys (`field`, `layout`, `wincon`).

What it *keeps*: the entire capture/for-keeps core, the bell, House Rules, rival demands, the
two-item-class framework, the vocabulary, the harness — which needs new auto-drivers per
wincon and a throw-input driver (attitude + power release are now part of the input space the
self-play must cover).

**Build order, de-risked — each step leaves the game playable end-to-end:**

1. **Settle rule + slammer physics.** Small, pure feel, and it unblocks honest playtesting —
   nothing else can be judged while turns advance over moving chips.
2. **Throw v2** (attitude gesture, power curve, Tournament Grip) **+ capture-band retune.**
   The new throw changes flip physics, so this is where 0.4–0.6 gets re-committed — one
   tuning fight, not two. Harness gets the throw-input driver here.
3. **Callouts.** Rides entirely on events steps 1–2 emit. Cheap, loud, teaches technique.
4. **Camera + first venue.** Pot-cluster framing, backdrop layers, pinch/twist/pan gestures —
   proven on ONE venue built to the corner-store standard (driveway is the cheapest candidate:
   it's the tutorial venue anyway). This step sets the per-venue cost budget honestly.
5. **Lunch Money + the receipt.** Pure UI/state; makes wins legible before the shop exists to
   spend them in.
6. **Shop v2 + Blind Bags + first finishes.** HOLO (the chase), STATIC (sells the settle
   rule), SURVIVOR (the soul — provenance data already exists). Bag ritual never skippable.
7. **LOYALTY.** One bounded torque assist through the `effect` hook, tuned inside the band
   committed in step 2.
8. **The front door.** Menu, Starter Stack select (SANDLOT + two locked stacks visible),
   the played tutorial over run one's opening slams, menu-to-driveway camera drop.
9. **Structure pass.** Branching nodes, act framing, first field condition (tilted court) +
   first alt wincon (Bounty) to prove the knob system, then the Act 2 content pass — venues,
   THE PRESIDENT, escalation.

Steps 1–4 are the "feel lock": after them, a phone playtest of a full match answers the
open §12A aimed-flips question and validates the venue budget before content scales.

Open questions for playtesting, not for deciding now: whether wincons rotate per node or are
visible on the map (map-visible favors route strategy); whether Blind Bag contents are
act-gated; whether Act 3 alien bootleg chips enter the player-obtainable pool or stay
rival-exclusive; final name of the basic Starter Stack (SANDLOT is placeholder); whether
Collection-on-main-menu vs. in-run Binder split reads clearly to a new player; slammer
scarcity (are slammers tradeable/losable, or permanent tools?); run-loss severity (full wipe
vs. a protected Binder page).
