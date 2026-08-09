/* ================================================================
   TUNING — physics constants (this IS the game feel)
   ================================================================ */
var TUNE = {
  GRAV: 26,            // gravity
  DROP_VY: 7,          // slammer initial downward speed (+ power * DROP_VY_POW)
  DROP_VY_POW: 9,
  IMP_R_BASE: 2.4,     // impact radius = base + power * scale  (2.4 - 4.0)
  IMP_R_POW: 1.6,
  IMP_S_BASE: 4.5,     // impulse strength = (base + power*scale) * (1 - d/r) falloff
  IMP_S_POW: 9.5,
  BOUNCE_Y: 0.38,      // floor bounce restitution
  FRIC_XZ: 0.86,       // horizontal damping per floor contact
  ANG_DAMP_AIR: 0.995,
  ANG_DAMP_GND: 0.92,
  SETTLE_V: 1.1,       // speed threshold -> begin wobble-down
  SETTLE_W: 3.2,       // angular threshold
  DRAG_AIR: 0.72,      // per-second air drag on velocity (cardboard, not steel)
  FLUTTER: 14,         // random tumble torque while spinning airborne
  REST_DISC: 0.45,     // disc-vs-disc restitution
  IMP_ANG_POW: 1.6,    // flip torque falloff exponent (center hits flip, edge hits slide)
  RIPPLE: 0.02,        // impact shockwave delay per unit distance (s)
  TIP: 18,             // gravity torque tipping a leaning chip flat (rad/s^2 at full lean)
  /* --- Throw v2: the three-layer skill (attitude / power curve / grip) --- */
  POW_RISE: 0.85,      // seconds to the power curve's peak (golf-swing ramp)
  POW_FALL: 0.6,       // seconds from peak down to the sloppy sag
  GRIP_LO: 0.10,       // Tournament Grip band: seconds before the peak...
  GRIP_HI: 0.06,       // ...and after it
  GRIP_F: 1.1,         // grip: force bonus
  GRIP_T: 1.15,        // grip: flip-torque bonus
  TILT_MAX: 1.1,       // max slammer tilt in radians (~63 deg, edge-leading)
  TILT_SPEED: 9,       // world-units/s of drag speed for full tilt
  EDGE_LANE: 2.2,      // alignment exponent: how narrow the edge strike lane is
  EDGE_R: 0.35,        // radius shrink at full edge (x(1 - EDGE_R*tilt))
  EDGE_F: 1.5,         // force multiplier for chips in the lane at full edge
  EDGE_T: 1.8,         // flip-torque multiplier in the lane at full edge
  SCATTER: 0.2,        // base aim scatter (world units); grip cuts it, sloppy adds
  SCATTER_SLOPPY: 0.55,// extra scatter when released past the falloff
  WHOOPEE_MS: 450,     // detonation delay (the beat sells the joke)
  WHOOPEE_R: 1.7,
  MECHA_R: 1.3,
  RUBBER_SAVE: 0.45,   // chance a flipped rubber tazo re-flips back
  ARENA_R: 3.6,
  TAZO_R: 0.5,
  TAZO_H: 0.18
};

