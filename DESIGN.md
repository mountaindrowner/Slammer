# SLAMMERS — gameplay loop design

Working design doc. Vocabulary: **Binder** (collection), **Pot** (staked chips), **House Rules**
(boss modifiers), **the Court** (run structure). See CLAUDE.md for engineering rules.

## The two item classes

- **Stakes** (chips in the pot) are *reactive* — they do things when physics happens TO them.
  Implemented as data keys on the design: `effect` (capture pipeline: rubber, double, whoopee,
  cursed, mecha), `phys` (weight class: feather, manhole), `field` (magnet, sticky).
- **Tools** (slammers) are *active* — they change what your throw does. Registry in `SLAMMERS`:
  radius/impulse/flip-torque multipliers plus an `fx` key (bouncer's double hit). Slammers are
  the persistent build: chips churn constantly (they're the health bar), slammers stay.

Design rule: stakes hook physics events (on-hit, on-flip, on-neighbor-moved); tools hook the
throw (drop, impact, aftermath). Both stay data keys — no special-case logic outside the hooks.

## The loop, layer by layer

- **The Toss (~5 sec, match open).** True 50/50 coin flip — a real chip, really flipped by the
  physics sim and read by the same settle logic as captures. Caller alternates randomly between
  player and rival; winner slams first.
- **The Slam (~10 sec).** Decisions: where (cash a cluster / herd / reclaim your own stake /
  avoid traps), how hard (variance dial), and with what (slammer pouch, chosen per throw like a
  golf club). Center hits flip, edge hits slide (`IMP_ANG_POW`).
- **The Turn (~30 sec).** Board persists between slams; alternation is a conversation. Stake
  variants make the board itself the strategy (gum creates clusters, magnets drag them, manholes
  anchor, feathers scatter).
- **The Match (~3 min).** Ante with rival *demands* (count + requirements: "at least one rare",
  "your best comes too") — difficulty scales through forced risk, not bigger numbers. Alternate
  slams until the pot empties or **the bell rings** (`bellAt` slams): unclaimed chips go home to
  their stakers. Win by capture majority; what you flip you keep either way.
- **The Run (~30 min).** The court map: sidewalk → schoolyard → corner store → cul-de-sac boss.
  The store trades chips for slammers and variant chips (kid-logic rates). Beat a kid and his
  slammer joins your pouch — spoils build identity. Run ends when the boss falls or your binder
  can't cover an ante.
- **The Meta (future).** Keep the wipe brutal; persistence is breadth not power — encountered
  designs unlock into the world pool, trophy shelf records court wins.

## Current balance targets

- Capture rate: 0.4–0.6 per slam across an AI-vs-AI run (headless harness, `?auto=1`).
- Solid chips resist flips: settle lean-back band (`beginSettle`, ±0.12) means only decisive
  rotation flips; flips are earned via airborne tumble.
- Anti-stall: tip torque never pumps past `SETTLE_W`; 7s sim backstop force-settles wedges.

## Backlog (rough priority)

1. Aimed flips: drag direction tilts the slammer; chips flip away from the strike edge
   (technique layer — makes flip direction readable).
2. Branching court map (needs a 4th rival) + walk-away mid-match (forfeit the pot).
3. More stakes: slick ice chip (no friction), glass chip (shatters if flipped twice), decoy,
   gacha capsule, grudge chip (bonus vs the kid you won it from).
4. More tools: yo-yo (recall mid-drop), horseshoe (donut impulse), feather slammer (slow fall,
   longer aim window).
5. Meta unlocks + trophy shelf; provenance lines in a real binder screen with page flips.
