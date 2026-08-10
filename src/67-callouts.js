/* ================================================================
   CALLOUTS — named technique, shouted. Half real 90s playground lore,
   half ours. One per slam, highest rarity wins, evaluated only once
   the table is still. Triggers trace to player-steered inputs
   (attitude, power, placement) — never pure luck.
   ================================================================ */
var CALLOUTS = [
  { key: 'WHAMMIE',      rank: 1, test: function(s, left){ return left === 0 && s.caps >= 1; } },
  { key: 'CLEAN SWEEP',  rank: 2, test: function(s, left){ return left === 0 && s.caps >= 3; } },
  { key: 'THE GOOGLIE',  rank: 3, test: function(s){ return s.spinFlip && s.caps >= 1; } },
  { key: "RAZOR'S EDGE", rank: 4, test: function(s){ return s.att && s.att.tilt >= 0.85 && s.caps >= 1; } },
  { key: 'KINI KUNG FU', rank: 5, test: function(s){ return s.att && s.att.grip && s.pow >= 0.96; } },
  { key: 'BOOMERANG',    rank: 6, test: function(s){ return s.boomerang; } },
  { key: 'THE THWACK',   rank: 7, test: function(s){ return s.att && s.att.grip && s.caps >= 3; } },
  { key: 'FLIPZILLA',    rank: 8, test: function(s){ return s.caps >= 6; } }
];
function evalCallout(){
  if (!slamStats) return null;
  var s = slamStats, left = alive().length, best = null;
  CALLOUTS.forEach(function(c){
    if (c.test(s, left) && (!best || c.rank > best.rank)) best = c;
  });
  slamStats = null;
  return best;
}
function sfxCallout(rank){
  tone(160 + rank * 30, 0.12, 'square', 0.1, 90);
  setTimeout(function(){ tone(480 + rank * 90, 0.14, 'square', 0.08, 700 + rank * 120); }, 90);
}
function showCallout(c, side){
  var d = el('callout');
  d.textContent = c.key;
  d.className = 'show' + (side === 'rival' ? ' foe' : '');
  sfxCallout(c.rank);
  clearTimeout(showCallout._t);
  showCallout._t = setTimeout(function(){ d.className = ''; }, 1150);
  tlog('  CALLOUT ' + c.key + (c.rank >= 5 ? ' [style bonus]' : ''));
}
