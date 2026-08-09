/* ================================================================
   RIVALS — the court, in order. Last one owns the court.
   ================================================================ */
var RIVALS = [
  { key:'milo', name:'MILO', face:'face_milo', accent:'#8fd97a', turf:'THE SIDEWALK',
    ante:2, acc:0.45, powLo:0.45, powHi:0.75, slammer:'slammy', rule:null, need:null,
    bust:{ skin:0xf2c99a, cap:0x3fae4e, jacket:0x4e6a3c, style:'cap' },
    binder:['feather','duck','star','skull','rubber','pizza'],
    demand:'"2-for-2. winner keeps \'em. no crying."',
    barks:{ hit:'juice box power!!', ouch:'hey!! that one\'s mine!!', win:'told ya!! TOLD YA!!', lose:'i\'m telling my mom.' } },
  { key:'cheater', name:'THE CHEATER', face:'face_cheater', accent:'#e0bd63', turf:'THE SCHOOLYARD',
    ante:3, acc:0.97, powLo:0.5, powHi:0.7, slammer:'drill', rule:null, need:'rare',
    bust:{ skin:0xe2a875, cap:0x2b4bd4, jacket:0x3a3f52, style:'side' },
    binder:['gum','vhs','double','skull','alien','hypno','star'],
    demand:'"3-for-3, and at least one shiny. trust me."',
    barks:{ hit:'house always wins.', ouch:'that one didn\'t count.', win:'better luck never.', lose:'this game is RIGGED!!' } },
  { key:'richkid', name:'THE RICH KID', face:'face_richkid', accent:'#7fd9c0', turf:'THE CUL-DE-SAC',
    ante:3, acc:0.75, powLo:0.75, powHi:1.0, slammer:'metal', rule:'mint', need:'best',
    ruleName:'MINT CONDITION', ruleDesc:'his tazos resist flips · metal slammer',
    bust:{ skin:0xf2c99a, cap:0xe0bd4e, jacket:0x6d2f3c, style:'shades' },
    binder:['mecha','magnet','manhole','duck','vhs','hypno','alien','whoopee'],
    demand:'"3-for-3, and bring your BEST. i only play mint."',
    barks:{ hit:'daddy can buy more anyway.', ouch:'careful!! that\'s MINT!!', win:'peasant.', lose:'impossible. IMPOSSIBLE.' } }
];

var START_BINDER = ['smiley','pizza','alien','star','skull','cat','hypno','rubber','whoopee','feather'];

/* ---- slammers: the tools. Chips are what you wager; slammers are how you hit. ---- */
var SLAMMERS = {
  slammy:  { name:'SLAMMY',    desc:'the trusty one',                 radius:1,   imp:1,    ang:1 },
  bouncer: { name:'BOUNCER',   desc:'hops for a second hit',          radius:0.9, imp:0.85, ang:0.9, fx:'bounce' },
  drill:   { name:'THE DRILL', desc:'tight spiral, big flips',        radius:0.7, imp:0.9,  ang:1.6 },
  metal:   { name:'MINTY',     desc:'daddy bought it — raw power',    radius:1.1, imp:1.3,  ang:0.95 }
};
var RANK = { common:1, rare:2, legendary:3 };
function rank(key){ return RANK[DESIGNS[key].rarity] || 0; }

/* ---- the court: run structure ---- */
var NODES = [
  { t:'match', r:0 },
  { t:'match', r:1 },
  { t:'store' },
  { t:'match', r:2 }
];

