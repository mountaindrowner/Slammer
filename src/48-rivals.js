/* ================================================================
   RIVALS — the whole arc, local to cosmic (vision §1).
   Every house rule is a data key with defined hooks:
     rule       -> capture-pipeline / turn hooks (resolved by key)
     outBoost   -> multiplier on HIS outgoing impulse
     inShield   -> multiplier on impulse INTO his staked chips
     tossRig    -> he always wins the coin toss
     bellMod    -> scales when the bell rings (shorter recess)
   No special-case logic anywhere else.
   ================================================================ */
var RIVALS = {
  /* ---- ACT 1: THE NEIGHBORHOOD ---- */
  milo: { key:'milo', venue:'driveway', name:'MILO', face:'face_milo', accent:'#8fd97a', turf:'THE SIDEWALK',
    ante:2, acc:0.45, powLo:0.45, powHi:0.75, slammer:'slammy', rule:null, need:null,
    throwStyle:{ edge:0.2, grip:0.12 },
    bust:{ skin:0xf2c99a, cap:0x3fae4e, jacket:0x4e6a3c, style:'cap' },
    binder:['feather','duck','star','skull','rubber','pizza'],
    demand:'"2-for-2. winner keeps \'em. no crying."',
    barks:{ hit:'juice box power!!', ouch:'hey!! that one\'s mine!!', win:'told ya!! TOLD YA!!', lose:'i\'m telling my mom.' } },
  cheater: { key:'cheater', venue:'schoolyard', name:'THE CHEATER', face:'face_cheater', accent:'#e0bd63', turf:'THE SCHOOLYARD',
    ante:3, acc:0.97, powLo:0.5, powHi:0.7, slammer:'drill', need:'rare',
    rule:'nudge', ruleName:'THE NUDGE', ruleDesc:'sometimes the pot scoots after you commit',
    throwStyle:{ edge:0.85, grip:0.65 },
    bust:{ skin:0xe2a875, cap:0x2b4bd4, jacket:0x3a3f52, style:'side' },
    binder:['gum','vhs','double','skull','alien','hypno','star'],
    demand:'"3-for-3, and at least one shiny. trust me."',
    barks:{ hit:'house always wins.', ouch:'that one didn\'t count.', win:'better luck never.', lose:'this game is RIGGED!!',
      rule:'"what? i didn\'t touch nothin\'."' } },
  tomboy: { key:'tomboy', venue:'lot', name:'TOMBOY', face:'face_tomboy', accent:'#ff8a5e', turf:'THE VACANT LOT',
    ante:3, acc:0.62, powLo:0.62, powHi:0.98, slammer:'slammy', rule:null, need:null,
    throwStyle:{ edge:0.75, grip:0.35 },
    bust:{ skin:0xe8b488, cap:0xd44a2c, jacket:0x8a4a6e, style:'back' },
    binder:['star','cat','rubber','skull','duck','feather','pizza'],
    demand:'"3-for-3. i throw harder than you. that\'s not trash talk, that\'s physics."',
    barks:{ hit:'EAT DIRT!!', ouch:'lucky bounce. do it again, i dare you.', win:'physics, baby.', lose:'best of... whatever. REMATCH.' } },
  richkid: { key:'richkid', venue:'culdesac', name:'THE RICH KID', face:'face_richkid', accent:'#7fd9c0', turf:'THE CUL-DE-SAC',
    ante:3, acc:0.75, powLo:0.75, powHi:1.0, slammer:'metal', need:'best',
    rule:'mint', ruleName:'MINT CONDITION', ruleDesc:'his tazos resist flips · metal slammer',
    outBoost:1.35, inShield:0.65,
    throwStyle:{ edge:0.25, grip:0.35 },
    bust:{ skin:0xf2c99a, cap:0xe0bd4e, jacket:0x6d2f3c, style:'shades' },
    binder:['mecha','magnet','manhole','duck','vhs','hypno','alien','whoopee'],
    demand:'"3-for-3, and bring your BEST. i only play mint."',
    barks:{ hit:'daddy can buy more anyway.', ouch:'careful!! that\'s MINT!!', win:'peasant.', lose:'impossible. IMPOSSIBLE.' } },
  /* ---- ACT 2: ACROSS TOWN ---- */
  principal: { key:'principal', venue:'hall', name:'THE PRINCIPAL', face:'face_principal', accent:'#c9a06a', turf:'DETENTION HALL',
    ante:3, acc:0.8, powLo:0.55, powHi:0.82, slammer:'slammy', need:'rare',
    rule:'confiscate', ruleName:'CONFISCATED', ruleDesc:'at the bell HE keeps the whole pot · short recess',
    bellMod:0.6,
    throwStyle:{ edge:0.3, grip:0.5 },
    bust:{ skin:0xdfae84, cap:0x4a3c30, jacket:0x4a4034, style:'tie', tie:0x6e2c2c },
    binder:['vhs','hypno','manhole','skull','gum','double','star'],
    demand:'"3-for-3. recess is SHORT today. and whatever\'s on my desk at the bell stays on my desk."',
    barks:{ hit:'detention.', ouch:'that is a write-up, young man.', win:'see me after class.', lose:'this goes on MY permanent record...',
      rule:'"school property now. all of it."' } },
  joystick: { key:'joystick', venue:'arcade', name:'JOYSTICK', face:'face_joystick', accent:'#b14aed', turf:'THE ARCADE',
    ante:3, acc:0.75, powLo:0.6, powHi:0.9, slammer:'bouncer', need:null,
    rule:'combo', ruleName:'COMBO METER', ruleDesc:'his capture streaks hit harder — break the chain',
    throwStyle:{ edge:0.5, grip:0.75 },
    bust:{ skin:0xe8c49a, cap:0xb14aed, jacket:0x24387c, style:'cap' },
    binder:['mecha','rubber','double','whoopee','hypno','star','pizza'],
    demand:'"3-for-3. insert chips. the machine ALWAYS gets a combo."',
    barks:{ hit:'COMBO!!', ouch:'C-C-CHAIN BREAK!!', win:'NEW HIGH SCORE.', lose:'CONTINUE? 10... 9... 8...' } },
  knuckles: { key:'knuckles', venue:'backroom', name:'KNUCKLES', face:'face_knuckles', accent:'#e0863d', turf:'THE BACKROOM',
    ante:4, acc:0.7, powLo:0.75, powHi:1.0, slammer:'metal', need:'best',
    rule:'juice', ruleName:'THE JUICE', ruleDesc:'every chip you flip costs you $1 — house cut',
    throwStyle:{ edge:0.35, grip:0.4 },
    bust:{ skin:0xd8a078, cap:0x1c1826, jacket:0x241c28, style:'tie', tie:0x8a6e2c },
    binder:['manhole','manhole','gum','magnet','skull','mecha','duck','star'],
    demand:'"4-for-4, and the house takes its juice. nothing personal, kid."',
    barks:{ hit:'nothing personal.', ouch:'you\'re makin\' a mistake here.', win:'pleasure doin\' business.', lose:'you don\'t walk away from— hey. HEY!',
      rule:'"house cut. them\'s the rules."' } },
  /* ---- ACT 3: THE BIG TIME ---- */
  mayor: { key:'mayor', venue:'cityhall', name:'THE MAYOR', face:'face_mayor', accent:'#7fa8ff', turf:'CITY HALL STEPS',
    ante:4, acc:0.8, powLo:0.6, powHi:0.85, slammer:'slammy', need:'rare',
    rule:'veto', ruleName:'THE VETO', ruleDesc:'your first flip each match gets overturned',
    throwStyle:{ edge:0.4, grip:0.55 },
    bust:{ skin:0xf0be8e, cap:0x9aa4b2, jacket:0x3a2c5e, style:'tie', tie:0xc0202c },
    binder:['double','vhs','hypno','magnet','star','manhole','mecha','smiley'],
    demand:'"4-for-4, and i\'ll need a signature. right here. don\'t read it."',
    barks:{ hit:'for the CITY!', ouch:'i\'ll form a committee about that.', win:'re-elected!', lose:'i demand a RECOUNT!!',
      rule:'"vetoed. next item on the agenda."' } },
  president: { key:'president', venue:'oval', name:'THE PRESIDENT', face:'face_president', accent:'#e0bd4e', turf:'THE OVAL COURT',
    ante:4, acc:0.86, powLo:0.7, powHi:0.92, slammer:'metal', need:'best',
    rule:'executive', ruleName:'EXECUTIVE ORDER', ruleDesc:'always slams first · his chips resist flips',
    tossRig:true, inShield:0.88,
    throwStyle:{ edge:0.6, grip:0.7 },
    bust:{ skin:0xf0c29a, cap:0xd8d2e0, jacket:0x1c2a4c, style:'tie', tie:0xc0202c },
    binder:['mecha','manhole','magnet','double','vhs','star','gum','hypno'],
    demand:'"4-for-4. i don\'t lose coin tosses. it\'s classified why."',
    barks:{ hit:'executive action.', ouch:'my lawyers will hear about this.', win:'god bless this court.', lose:'i hereby resign— wait. NO WAIT.',
      rule:'"executive privilege. look it up."' } },
  /* ---- ACT 4: THE COSMIC COURT ---- */
  zib: { key:'zib', venue:'crop', name:'ZIB', face:'face_zib', accent:'#7ed957', turf:'THE CROP CIRCLE',
    ante:4, acc:0.8, powLo:0.65, powHi:0.9, slammer:'drill', need:null,
    rule:'beam', ruleName:'TRACTOR BEAM', ruleDesc:'his flipped chips sometimes beam back to the pot',
    throwStyle:{ edge:0.7, grip:0.5 },
    bust:{ skin:0x7ed957, cap:0x4ab83a, jacket:0x2c3a6e, style:'alien' },
    binder:['zorbo','saucer','moonrock','alien','hypno','rubber','feather','star'],
    demand:'"FOUR OF YOUR EARTH CHIPS. we have studied your customs. prepare to be flipped."',
    barks:{ hit:'ZORP ZORP.', ouch:'IMPOSSIBLE. RECALIBRATING.', win:'YOUR CHIPS WILL BE STUDIED.', lose:'THIS PLANET IS DEFECTIVE.',
      rule:'BEAM ACTIVE. NICE TRY, EARTH CHILD.' } },
  zorp: { key:'zorp', venue:'mothership', name:'ZORP', face:'face_zorp', accent:'#9ade6a', turf:'THE MOTHERSHIP RAMP',
    ante:4, acc:0.62, powLo:0.75, powHi:1.0, slammer:'drill', rule:null, need:null,
    throwStyle:{ edge:0.4, grip:0.35 },
    bust:{ skin:0x9ade6a, cap:0x3a9a4a, jacket:0x3c2c5e, style:'alien' },
    binder:['moonrock','moonrock','saucer','zorbo','gum','manhole','whoopee','skull'],
    demand:'"4-for-4. the EGG watches. do not touch the egg. DO NOT."',
    barks:{ hit:'FOR THE BROOD.', ouch:'THE EGG SAW THAT.', win:'THE BROOD FEASTS.', lose:'THE EGG IS DISAPPOINTED IN US BOTH.' } },
  overlord: { key:'overlord', venue:'throne', name:'THE OVERLORD', face:'face_overlord', accent:'#f5b93d', turf:'THE THRONE RING',
    ante:5, acc:0.8, powLo:0.7, powHi:0.92, slammer:'metal', need:'best',
    rule:'crown', ruleName:'THE CROWN', ruleDesc:'his chips return to the pot until you flip his CROWN',
    throwStyle:{ edge:0.6, grip:0.6 },
    bust:{ skin:0x9a5ae0, cap:0xe0bd4e, jacket:0x3c1c4c, style:'alien', crown:true },
    binder:['crown','mecha','moonrock','saucer','magnet','manhole','zorbo','vhs','double'],
    demand:'"5-for-5, peasant. the crown does not leave the throne. the crown IS the throne."',
    barks:{ hit:'KNEEL.', ouch:'...GUARDS?', win:'ALL OF IT WAS ALWAYS MINE.', lose:'a crown... on a CHILD?!',
      rule:'THE CROWN HOLDS. NOTHING LEAVES.' } },
  engine: { key:'engine', venue:'machine', name:'THE ENGINE', face:'face_engine', accent:'#ff4b3d', turf:'THE FINAL COURT',
    ante:5, acc:0.92, powLo:0.8, powHi:1.0, slammer:'metal', need:'best',
    rule:'engine', ruleName:'PERPETUAL MOTION', ruleDesc:'always slams first · armored chips · IT REBUILDS THE STACK',
    tossRig:true, inShield:0.75,
    throwStyle:{ edge:0.75, grip:0.85 },
    bust:{ skin:0x8fa3ba, cap:0xff4b3d, jacket:0x2c3444, style:'machine' },
    binder:['mecha','mecha','manhole','magnet','moonrock','saucer','double','gum','star','hypno'],
    demand:'"FIVE UNITS. THE ENGINE DOES NOT PLAY. THE ENGINE RESOLVES."',
    barks:{ hit:'RESOLVED.', ouch:'DAMAGE: SUPERFICIAL.', win:'GAME OVER. INSERT CHILDHOOD.', lose:'IMPOSSIBLE. IMPOSSIBLE. IMPOSSIB—',
      rule:'RESETTING BOARD STATE.' } }
};

var START_BINDER = ['smiley','pizza','alien','star','skull','cat','hypno','rubber','whoopee','feather'];

/* ---- Starter Stacks: the binder page you walk out the door with ---- */
var STACKS = {
  sandlot: { name: 'SANDLOT', unlocked: true,
    desc: 'the honest page. a little of everything.',
    binder: START_BINDER, pouch: ['slammy', 'bouncer'] },
  heavy: { name: 'CURBSIDE', unlock: 'Win a run',
    desc: 'manholes and muscle. nothing moves unless you move it.',
    binder: ['manhole','manhole','skull','star','gum','smiley','duck','pizza'],
    pouch: ['slammy', 'metal'] },
  chaos: { name: 'FIRECRACKER', unlock: 'Own 5 rares in one Binder',
    desc: 'whoopees and bad ideas. light the fuse.',
    binder: ['whoopee','whoopee','rubber','vhs','feather','cat','alien','hypno'],
    pouch: ['slammy', 'drill'] }
};
function stackUnlocked(key){
  if (STACKS[key].unlocked) return true;
  try{ return !!JSON.parse(localStorage.getItem('slam_unlocks') || '{}')[key]; }catch(e){ return false; }
}
function unlockStack(key){
  try{
    var u = JSON.parse(localStorage.getItem('slam_unlocks') || '{}');
    if (!u[key]){ u[key] = true; localStorage.setItem('slam_unlocks', JSON.stringify(u)); return true; }
  }catch(e){}
  return false;
}

/* ---- slammers: the tools. Chips are what you wager; slammers are how you hit. ---- */
var SLAMMERS = {
  slammy:  { name:'SLAMMY',    desc:'the trusty one',                 radius:1,   imp:1,    ang:1 },
  bouncer: { name:'BOUNCER',   desc:'hops for a second hit',          radius:0.9, imp:0.85, ang:0.9, fx:'bounce' },
  drill:   { name:'THE DRILL', desc:'tight spiral, big flips',        radius:0.7, imp:0.9,  ang:1.6 },
  metal:   { name:'MINTY',     desc:'daddy bought it — raw power',    radius:1.1, imp:1.3,  ang:0.95 }
};
var RANK = { common:1, rare:2, legendary:3 };
function rank(key){ return RANK[DESIGNS[key].rarity] || 0; }

/* ---- THE COURT: four acts, layered; a layer with 2 opts is a fork
   you pick on the map. Node knobs (field/layout/wincon) ride here. ---- */
var ACTS = ['THE NEIGHBORHOOD', 'ACROSS TOWN', 'THE BIG TIME', 'THE COSMIC COURT'];
var COURT = [
  { act:0, opts:[ { t:'match', r:'milo' } ] },
  { act:0, opts:[ { t:'match', r:'cheater', layout:'scatter' }, { t:'match', r:'tomboy', wincon:'sudden' } ] },
  { act:0, opts:[ { t:'store' } ] },
  { act:0, opts:[ { t:'match', r:'richkid', layout:'multi' } ] },
  { act:1, opts:[ { t:'match', r:'principal' }, { t:'match', r:'joystick', layout:'orbit' } ] },
  { act:1, opts:[ { t:'store' } ] },
  { act:1, opts:[ { t:'match', r:'knuckles', field:'drain', wincon:'heist' } ] },
  { act:2, opts:[ { t:'match', r:'mayor', field:'wind', wincon:'kotc', bellMod:0.55 } ] },
  { act:2, opts:[ { t:'store' } ] },
  { act:2, opts:[ { t:'match', r:'president', layout:'multi' } ] },
  { act:3, opts:[ { t:'match', r:'zib', field:'lowg' }, { t:'match', r:'zorp', wincon:'egg', bellMod:0.45 } ] },
  { act:3, opts:[ { t:'store' } ] },
  { act:3, opts:[ { t:'match', r:'overlord', layout:'orbit' } ] },
  { act:3, opts:[ { t:'match', r:'engine', field:'ice', bellMod:0.8 } ] }
];
function stageNode(i){
  var layer = COURT[i];
  return layer.opts[Math.min((run && run.path[i]) || 0, layer.opts.length - 1)];
}
function curNode(){ return stageNode(run.stage); }
