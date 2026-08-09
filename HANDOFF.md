# SLAMMERS — build report & handoff (v0.7.0)

Written for a fresh session picking this project up. Companion docs: `CLAUDE.md` (engineering
rules — obey these), `DESIGN.md` (loop design + backlog).

- Branch `claude/game-poc-aqzn5w`, head `4a7da92`, 7 feature commits.
- One file: `index.html` — ~2,275 hand-written lines + three.js r128 inlined (603 KB of 705 KB).
- Zero assets. No build step, no npm, no modules.
- Every claim below was verified with the headless self-play harness (`?auto=1`).

## 1. State of the build

Playable end to end on a phone. A run is: court map → ante (rival demands chips from your
Binder) → coin toss → alternating physics slams until the pot empties or the bell rings →
captures migrate between binders permanently → next node. Three rivals, one house rule, plus a
corner store.

Most recent full verified run: **71 slams, 0.52 captures/slam, 7 tosses, 1 bell, 1 store trade,
2 slammers won as spoils, run completed, no errors.**

**Solid:** physics feel and solidity; art direction (night court, vector chip art, grain);
the core duel and capture attribution; data-driven extensibility (new chip ≈ 10 lines of data).

**Thin:** run structure is a 4-node straight line; there is **no Binder screen** (provenance is
stored but never shown); rival AI is ~20 lines of aim-at-cluster + noise; only one house rule
built; no meta-progression.

## 2. Concept

Don't clone Balatro's skeleton — copy its move. It warped poker's real rules with wacky cards;
this warps the real playground rules of tazos. The hook tazos have that poker doesn't: **you
played for keeps.** No abstract score targets, no chips-times-mult. The Binder is simultaneously
deck, wallet, and health bar. Bosses are kids with House Rules. Wacky chips cheat the physics.

Vocabulary rule (enforced): **Binder, Pot, House Rules, the Court.** Never "deck", "shop",
"relic", "modifier".

## 3. Architecture decisions

- **three.js is inlined, not CDN** — the artifact viewer's CSP blocks external hosts (and the
  sandbox blocks cdnjs). Inlining is what makes the game a single offline-capable shareable file.
- **No physics engine, deliberately.** The game needs *authored* dishonesty (flip rule read at
  settle time, a lean-back band that tunes capture rate, ripple delays, "counts as flipped
  however it lands"). A real solver would have to be fought for deterministic tunable outcomes.
  - If physics ambitions grow (15+ chip pots, ricochet mechanics, stack-toppling): swap the bead
    sim for **Rapier** (WASM, inlinable, keeps the single file and all UI).
  - If this graduates to a shipping product: rebuild in **Godot 4**, treating this build as a
    playable design document with proven feel constants.
- **DOM for UI, WebGL for the arena only.**
- **Mobile-webview budget held throughout:** `setPixelRatio(1)`, `antialias:false`, near 1 /
  far 80, no shadow maps, no fog, debounced + scheduled resize (never per-frame).

File regions in order: diagnostics → `TUNE` → `DESIGNS` → `SLAMMERS` → `RIVALS`/`NODES` →
audio → three setup → tazo builder (vector art, rims, shadows, busts) → run/match state →
screens → sim → capture pipeline → main loop.

## 4. Version history

| ver | commit | what |
|---|---|---|
| 0.1.0 | `a55b595` | Whole loop, pixel-art era. Pot stack, aim + power bar, slam sim, turns, rival AI, for-keeps migration, 3 rivals, mint house rule, 5 chip effects, SFX, diagnostics. |
| 0.2.0 | `82e8262` | Made it *read* 3D: camera 57°→42°, idle sway + slam-follow + impact dolly punch, blob shadows, dusk sky, diorama props. |
| 0.3.0 | `cdc85aa` | Indie regrade. Pixel grids → **vector layer renderer**; all designs redrawn smooth with a printed-cap finish. Night court under one streetlight + film grain/vignette. |
| 0.4.0 | `a84f0ff` | Impact drama (slow-mo approach, hitstop, flash, lamp flare, shockwave), low-poly rival busts, physics feel pass (ripple, flip-vs-push falloff, first chip-vs-chip collision, clatter, air drag, coin-wobble settle). |
| 0.5.0 | `e45dc56` | Chip girth: 2× thickness, per-design striped rim textures, embossed inset face ring. Rebalanced (capture rate had spiked to 1.18). |
| 0.6.0 | `ac8aac3` | **Anti-clipping**: orientation-aware floor support, bead-ring 3D collision, slammer as a solid body landing on the stack. |
| 0.7.0 | `4a7da92` | Full loop: coin toss, slammer pouch, demand antes, the bell, 4 stake variants, court map + corner store, anti-stall backstop, `DESIGN.md`. |

## 5. Physics engine (read before changing anything)

**The flip rule** — the whole game in one line: when a tumbling disc rests, take its local
up-vector; if it points down, the chip flipped and the current slammer captures it.

With thick pucks this needed nuance. In `beginSettle()` a decisive tilt (|up.y| > 0.12) sets the
face; a chip resting near edge-on **falls back onto the face it was already lying on**. That band
is the primary capture-rate dial.

**Orientation-aware floor contact.** Original bug: the sim clamped each chip's *center* to a
fixed height, so tilted rims knifed through the asphalt. `supportY(q)` now computes the true
lowest point of a tilted disc (`h/2·|n.y| + R·sinθ`). Consequences that improved feel:
hard tilted landings apply a real angular impulse about the rim contact (chips **trip over their
edge**); gravity applies a continuous tipping torque (`TUNE.TIP`) so leaning chips **fall flat
physically**; vertical rest only when nearly flat (|n.y| > 0.85).

**Bead-ring collision (the key idea).** A 2D circle test can't express a thick disc at an
arbitrary angle. Each body is a **rigid ring of 9 spheres** — center + 8 rim beads at radius
`R − h`, each of radius `h` — recomputed from the quaternion each frame (`computeBeads()`).
Bead-vs-bead contact handles flat stacking at exact face-to-face height, edge-to-edge contact,
mid-air tumbling clashes at any orientation, and a slider waking (and possibly flipping) a
resting chip — bank shots are physically real. Resolution: positional separation weighted by
which bodies are free to move (sleepers and the slammer hold), then linear **and** angular
momentum exchange via `contactOffset × normal`. Restitution `TUNE.REST_DISC`. Center-distance
broad-phase reject first.

**Other behaviors:** shockwave ripple (`pendingImps` + `TUNE.RIPPLE`) so impulses arrive later
the farther out a chip sits; flip torque falls off faster than push force (`IMP_ANG_POW`) so
center hits flip and edge hits slide; air drag + flutter; coin-wobble settle (damped slerp +
decaying sinusoid); stack support with wake-on-capture-below; anti-stall (tip torque never pumps
past `SETTLE_W`, plus a 7 s force-settle backstop); slammer solid via `slamRestY()`; bouncer hop
(second impact at 55% strength).

**Known residual:** a chip resting half-on another sits flat at bead-contact height rather than
leaning, so a small wedge gap can appear. It never interpenetrates. True leaning-rest poses need
multi-contact resolution.

## 6. Content inventory

**Chips (17)** are *reactive* — three orthogonal hook types: `effect` (capture pipeline),
`phys` (weight class, multiplies incoming impulse/torque/gravity), `field` (continuous influence).

| chip | rarity | hook | behavior |
|---|---|---|---|
| SMILEY, ZA SLICE, GRAYBO, GOLD STAR, RAD SKULL, STREET CAT, HYPNO, KAIJUDUCK | common | — | vanilla stakes |
| RUBBER | rare | `effect:rubber` | 45% chance a flip bounces back over |
| TWO-FACE | rare | `effect:double` | flipped however it lands — guaranteed capture |
| THE WHOOPEE | rare | `effect:whoopee` | detonates 450 ms after flipping, launches neighbors |
| CURSED VHS | rare | `effect:cursed` | flipping it flips one of *your own* stakes to the opponent |
| MECHA-TAZO | legendary | `effect:mecha` | chain-flips adjacent chips on landing |
| FEATHERWEIGHT | rare | `phys 1.6/1.5/0.6` | flies far, flips easy, falls slow |
| MANHOLE | rare | `phys 0.55/0.5` | heavyweight, barely budges, survives to the bell |
| MAGNETO | rare | `field:magnet` | drags nearby chips while moving; wakes close sleepers |
| GUM WAD | rare | `field:sticky` | chips touching it stop dead — creates clusters |
| THE CALL | coin | — | the toss coin, not a stake |

**Slammers (4)** are *active* — the persistent build identity, chosen per throw from the pouch.

| slammer | radius | impulse | flip torque | fx | source |
|---|---|---|---|---|---|
| SLAMMY | 1.0 | 1.0 | 1.0 | — | start |
| BOUNCER | 0.9 | 0.85 | 0.9 | `bounce` | start |
| THE DRILL | 0.7 | 0.9 | 1.6 | — | store / beat Cheater |
| MINTY (metal) | 1.1 | 1.3 | 0.95 | — | beat Rich Kid |

**Rivals & court.** MILO (Sidewalk, ante 2, acc 0.45) → THE CHEATER (Schoolyard, ante 3,
`need:rare`, acc 0.97) → **CORNER STORE** → THE RICH KID (Cul-de-sac, ante 3, `need:best`,
acc 0.75, **MINT CONDITION**).

MINT CONDITION is the only implemented house rule and demonstrates the two-hook pattern:
*impulse out* ×1.35 when he slams, *impulse in* ×0.65 for chips he staked. Each rival also has a
low-poly 3D bust, accent color, demand line, and four barks (hit/ouch/win/lose).

## 7. Art pipeline (zero assets)

- **Faces:** each design has a `bg` gradient pair and an `art` array of layer specs in 0–100
  space. `drawLayer()` supports `dot ring ell arc line rect poly star wedge`. Rendered at 256 px,
  then a shared **printed-cap finish**: grain speckle, worn dark edge, embossed inset ring
  (shadow+highlight so art reads recessed), gloss crescent.
- **Rims:** `paintRim()` derives a 512×64 repeating edge texture from the chip's own palette —
  casino edge spots, laminated layer lines, grain, baked chamfer bands. This is most of what
  sells solidity.
- **Scene:** one tungsten SpotLight + cold hemisphere bounce + dim fill; Phong specular on chips;
  a single baked 512² floor texture (asphalt, lamplight pool, court ring, chalk graffiti — baked
  to avoid decal z-fighting); blob shadows scaling/fading with height (staggered in y); curb,
  hydrant, milk crate, soda can, chalk stick, streetlight; camera at 42° with distance from
  FOV+aspect, sway/follow/punch/shake; CSS film grain (`mix-blend-mode:overlay`, reduced-motion
  safe) + vignette over a transparent renderer on a CSS night sky.

## 8. Verification harness (most useful tool here)

Open `index.html?auto=1` — the game **plays itself, both sides**, through a complete run: stakes
chips (highest rarity first, satisfying demands), calls the coin, rotates slammers, slams, trades
at the store, continues to run end. Results append to hidden `#testlog` and `document.title`
(`TESTDONE WON binder=12`).

Headless Chromium flags that matter: `--enable-unsafe-swiftshader` (software WebGL) and a large
`--virtual-time-budget` (a full run needs ~300–560 s virtual). **Headless Chromium fires
`requestAnimationFrame` only once under virtual time**, so AUTO mode drives frames with
`setTimeout` (`nextFrame()`) — don't remove that.

Log tags: `TOSS BELL TRADE "SLAMMER won" "bouncer hop" "WHOOPEE boom" "rubber saved"
force-settle "MATCH end" "RUN end"`, plus 150-frame heartbeats with mode/unsettled/pending
counters (how the wedged-chip stall was diagnosed).

**Use it for balance, not just crashes.** Captures-per-slam over a full AI-vs-AI run is the
primary metric; target band **0.4–0.6**. It caught three balance breaks this session: 1.18 after
thickening chips, 0.15 after solid-body collision, 0.12 after the anti-clipping pass.

Also keep: `mark()` sessionStorage breadcrumbs + "Previous run DIED at ___" banner (the only way
to debug iOS webview process death, which throws no JS error), `window.onerror` banner,
`webglcontextlost` tap-to-restart, version badge, `window.__state()`, `window.__slamAt(x,z,p)`.

## 9. Tuning

All feel lives in `TUNE` at the top of the sim section. Key dials: `IMP_ANG_POW` 1.6 (flip-torque
falloff — the aiming skill), `RIPPLE` 0.02, `SETTLE_V/W` 1.1/3.2, `TIP` 18, `REST_DISC` 0.45,
`DRAG_AIR/FLUTTER` 0.72/14, `BOUNCE_Y/FRIC_XZ` 0.38/0.86, `ARENA_R/TAZO_R/TAZO_H` 3.6/0.5/0.18,
`POW_HZ` 1.4, `WHOOPEE_MS/_R` 450/1.7, `MECHA_R` 1.3, `RUBBER_SAVE` 0.45.

Two dials **not** in `TUNE` that matter as much: the lean-back band (±0.12 in `beginSettle`,
strongest capture-rate control) and `M.bellAt = 8 + round(potSize × 2.5)`.

## 10. Design framework

**Two item classes.** Stakes are *reactive* (hooks: on-hit, on-flip, on-neighbor-moved); tools
are *active* (hooks: drop, impact, aftermath). Maps onto Balatro's structure — slammers are the
persistent build, chips are the wagered currency — and keeps the code honest.

**A decision at every timescale.** Working: toss (~5 s), slam (~10 s: where/how hard/with what),
turn (~30 s: cash now vs shape the board), match (~3 min: ante under a demand, bell clock, walk
away). Thin or missing: run (no route choice, shallow store), meta (nothing), technique (no input
skill beyond aim + power).

**On strategy, honestly.** Real strategy lives in the *setup* — aim position (center flips, edge
slides), power as a variance dial, reclaiming your own stakes, effect chips as terrain, ante
composition, endgame counting. But once a chip is properly tumbling, which face lands is ~50/50
minus the solidity bias. The player controls *exposure*, not outcomes. Faithful to real pogs, and
it gives the poker-dice texture — but it's a deliberate fork (see §12A).

## 11. Gaps & caveats

- **Feel is unvalidated by a human.** All timing/physics numbers are first-pass, verified only
  for outcomes, headlessly. Nobody has played a full run on a phone.
- **Flips are stingier than the original target** since the solidity work (0.27–0.52 vs 0.4–0.6).
  The AI aims worse than a human will, so real play may be fine — needs hands-on confirmation.
- **The boss may be too hard** (mint + MAGNETO + MANHOLE); the AI needed rematches.
- **The toss adds ~4 s to match start** — consider a skip-on-hold over a 30-minute run.
- **No mid-match walk-away** — the push-your-luck mercy mechanic exists only at the ante screen.
- **Run loss is a total wipe**, deliberate but never playtested.
- Multi-contact resting poses unresolved (§5).

Unsettled from the original guide: slammer scarcity (are they tradeable? losable? wagering a
slammer would sharpen stakes a lot), run-loss severity (wipe vs protected page), ante escalation
on rematch.

## 12. Where depth comes from

Ordered roughly by depth-per-effort. Threads with tradeoffs, not a plan.

**A. The technique layer (biggest fork).** Make flips *aimed*: drag direction during aim tilts
the slammer, chips flip *away from the strike edge* — so a player could deliberately flip a chip
toward their side, or away from the CURSED VHS. Converts the core action from "generate favorable
chaos" to "make a shot". *Tradeoff:* reduces the slot-machine thrill, and exposes the AI's
dumbness. Prototype behind a flag; measure capture-rate variance.

**B. Make the Binder visible.** The collection is the emotional engine and has no screen.
Provenance is already stored and never shown. Plastic-sleeve page grid with empty pockets (loss
aversion made visible), tap-for-detail cards ("won off THE BIG COUSIN"), page-flip animation.
Cheap, high emotional yield — it makes wagering *hurt*, which is the point of for-keeps.

**C. Chips that interact with each other.** The solid-body sim can express much more:
slick/ice (near-zero friction, refuses to be herded); glass (shatters out of the run if flipped
twice in a match); grudge chip (extra flip resistance against the kid you won it from — uses
stored provenance); gacha capsule (spills two smaller chips into the pot mid-match);
decoy/bootleg (looks legendary in the ante preview, worthless — a lie the rival can tell too);
domino (passes its impulse to the nearest chip, chaining); anchor pairs (two chips that pull
together; staking one alone is a liability).

**D. Tools with real verbs**, not multipliers: yo-yo (recall mid-drop, abort a bad throw),
horseshoe (donut impulse — hits a ring, spares the center), feather slammer (slow fall, longer
aim window), double-decker (splits into two smaller impacts). Each is one `fx` key plus a hook.

**E. The remaining house rules** — four designed, none built: The Cheater (moves the stack after
you aim; some flips "don't count" — he exists but has no rule, just perfect aim); The Big Cousin
(slams twice per turn); The Collector (flipping your legendary removes it from the run entirely);
**The Principal** (final boss, confiscation timer — the bell system already exists, so this is
nearly free).

**F. Structure & meta** — branching court map (needs a 4th rival: easy kid with a boring binder
vs mean kid holding a legendary); mid-match walk-away; rival AI with intent (target priority,
slammer choice, ante bluffing); meta as *breadth not power* (encountered designs unlock into the
world pool so later runs get weirder; trophy shelf) keeping the wipe brutal; escalating rematches.

**G. Presentation** — slow-mo close-up on the last settling chip when a match hangs on it;
barks reacting to specific events; ante drama (his stake sliding in chip by chip); attract mode
on the title screen (the AI already plays itself — just point the camera at it).

**If picking three:** make the Binder visible (cheap, emotional engine), prototype aimed flips
behind a flag (biggest open question, gates how much every other mechanic matters), build The
Principal (bell exists; a confiscation-timer boss closes the run arc).
