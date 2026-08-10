/* ================================================================
   MATCH SETUP
   ================================================================ */
function startMatch(){
  var r = curRival();
  mark('match-start');
  /* pull staked tazos out of the binders */
  var mine = anteSel.slice().sort(function(a,b){ return b - a; })
    .map(function(i){ return run.binder.splice(i, 1)[0]; });
  r.stake.forEach(function(k){ r.binder.splice(r.binder.indexOf(k), 1); });

  M = { rival: r, pot: [], yourCaps: [], rivalCaps: [], turn: 'you', slams: 0 };
  var stack = [];
  mine.forEach(function(e){ stack.push({ key: e.key, stakedBy: 'you', entry: e }); });
  r.stake.forEach(function(k){ stack.push({ key: k, stakedBy: 'rival', entry: { key: k, prov: null } }); });
  /* shuffle the stack */
  for (var i = stack.length - 1; i > 0; i--){
    var j = Math.floor(Math.random() * (i + 1)), t = stack[i]; stack[i] = stack[j]; stack[j] = t;
  }
  stack.forEach(function(s, i){
    var mesh = makeDisc(s.key, TUNE.TAZO_R, TUNE.TAZO_H);
    mesh.position.set(rnd(-0.05, 0.05), TUNE.TAZO_H/2 + i * TUNE.TAZO_H * 1.05, rnd(-0.05, 0.05));
    mesh.rotation.y = rnd(0, Math.PI * 2);
    scene.add(mesh);
    M.pot.push({
      key: s.key, design: DESIGNS[s.key], stakedBy: s.stakedBy, entry: s.entry,
      mesh: mesh, vel: new THREE.Vector3(), angVel: new THREE.Vector3(),
      bR: TUNE.TAZO_R, bH: TUNE.TAZO_H,
      settled: true, captured: null, disturbed: false,
      shadow: makeShadow(TUNE.TAZO_R)
    });
  });
  /* HUD */
  el('rportrait').src = designURL(r.face);
  el('rname').textContent = r.name;
  el('rname').style.color = r.accent;
  if (r.rule){
    el('rulechip').style.display = 'inline-block';
    el('rulechip').textContent = 'HOUSE RULE: ' + r.ruleName + ' — ' + r.ruleDesc;
  } else el('rulechip').style.display = 'none';
  el('rivalcaps').innerHTML = ''; el('yourcaps').innerHTML = '';
  M.bust = makeBust(r);
  bustLean = 0; bustTarget = 0; bustBob = 0; bustRecoil = 0;
  M.bellAt = 8 + Math.round(M.pot.length * 2.5);
  buildPouch();
  showScreen(null);
  tlog('MATCH start vs ' + r.name + ' pot=' + M.pot.length + ' bellAt=' + M.bellAt);
  startCoinToss();
}

/* ---------- the toss: a real chip, really flipped ---------- */
var coin = null, coinState = null;
function startCoinToss(){
  mode = 'menu';
  coinState = { caller: Math.random() < 0.5 ? 'you' : 'rival', call: null, t: 0 };
  banner('THE TOSS', 800);
  if (coinState.caller === 'you'){
    if (AUTO) setTimeout(function(){ chooseCall(Math.random() < 0.5 ? 'heads' : 'tails'); }, 120);
    else setTimeout(function(){ el('calltoss').classList.add('show'); }, 500);
  } else {
    var c = Math.random() < 0.5 ? 'heads' : 'tails';
    setTimeout(function(){
      bark('"' + c.toUpperCase() + '. obviously."');
      chooseCall(c);
    }, AUTO ? 100 : 900);
  }
}
function chooseCall(call){
  if (!coinState || coinState.call) return;
  el('calltoss').classList.remove('show');
  coinState.call = call;
  banner((coinState.caller === 'you' ? 'YOU CALL ' : M.rival.name + ' CALLS ') + call.toUpperCase(), 1000);
  setTimeout(flipCoin, AUTO ? 80 : 800);
}
function flipCoin(){
  if (!M) return;
  var mesh = makeDisc('coin', TUNE.TAZO_R, TUNE.TAZO_H);
  mesh.position.set(1.7, 4.2, 1.1);
  scene.add(mesh);
  coin = { key:'coin', design: DESIGNS.coin, mesh: mesh,
    vel: new THREE.Vector3(rnd(-0.5, 0.5), 1.5, rnd(-0.5, 0.5)),
    angVel: new THREE.Vector3(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).normalize().multiplyScalar(rnd(9, 14)),
    bR: TUNE.TAZO_R, bH: TUNE.TAZO_H,
    settled: false, settling: null, disturbed: true, captured: null,
    shadow: makeShadow(TUNE.TAZO_R) };
  sfxFlip();
  mode = 'coin';
}
function resolveToss(){
  mode = 'menu';
  var result = coin.faceUp ? 'HEADS' : 'TAILS';
  var winner = ((result === 'HEADS') === (coinState.call === 'heads'))
    ? coinState.caller
    : (coinState.caller === 'you' ? 'rival' : 'you');
  banner(result + '! ' + (winner === 'you' ? 'YOU SLAM FIRST' : M.rival.name + ' SLAMS FIRST'), 1300);
  tlog('TOSS ' + coinState.caller + ' called ' + coinState.call + ' -> ' + result + ' -> ' + winner + ' first');
  var cRef = coin; coin = null; coinState = null;
  setTimeout(function(){
    scene.remove(cRef.mesh); dropShadow(cRef);
    if (M) beginTurn(winner);
  }, AUTO ? 120 : 1100);
}

/* ---------- slammer pouch ---------- */
function buildPouch(){
  if (run.pouch.indexOf(run.slammer) < 0) run.slammer = run.pouch[0];
  var p = el('pouch'); p.innerHTML = '';
  run.pouch.forEach(function(k){
    var img = document.createElement('img');
    img.src = designURL(k);
    img.title = SLAMMERS[k].name + ' — ' + SLAMMERS[k].desc;
    if (k === run.slammer) img.className = 'sel';
    img.addEventListener('click', function(){
      if (!M || M.turn !== 'you' || ['idle','tilt','aimloc','power'].indexOf(mode) < 0) return;
      run.slammer = k;
      buildPouch();
    });
    p.appendChild(img);
  });
}

function beginTurn(side){
  if (!M) return;
  turnEnding = false;
  M.turn = side;
  M.pot.forEach(function(t){ if (!t.captured){ t.disturbed = false; } });
  bustTarget = side === 'rival' ? 1 : 0.55;
  var rem = M.bellAt - M.slams;
  var bellNote = rem <= 4 ? ' · BELL IN ' + rem : '';
  buildPouch();
  if (side === 'you'){
    mode = 'idle';
    resetThrow();
    el('turntext').textContent = 'YOUR TURN' + bellNote;
    el('hint').style.visibility = 'visible';
    setHint('TILT — drag to tip the slammer · tap = flat');
    banner('YOUR TURN');
    if (AUTO) setTimeout(autoPlayerSlam, 250);
  } else {
    mode = 'rival';
    el('turntext').textContent = M.rival.name + "'S TURN" + bellNote;
    el('hint').style.visibility = 'hidden';
    banner(M.rival.name + "'S TURN");
    var pick = aiPick(M.rival.acc);
    var pow = rnd(M.rival.powLo, M.rival.powHi);
    rivalPlan = {
      tx: pick.x, tz: pick.z, pow: pow,
      att: aiAttitude(M.rival, pick),
      t: 0, dur: AUTO ? 0.25 : 0.9,
      sx: rnd(-2.5, 2.5), sz: rnd(-2.5, 2.5)
    };
    reticle.material.color.set(0xff3d5e);
    reticle.visible = true;
  }
}

function aiPick(acc){
  var alive = M.pot.filter(function(t){ return !t.captured; });
  var best = alive[0], bs = -1;
  alive.forEach(function(t){
    var s = Math.random() * 0.6;
    alive.forEach(function(o){
      if (o !== t && hdist(o.mesh.position.x, o.mesh.position.z, t.mesh.position.x, t.mesh.position.z) < 1.3) s++;
    });
    if (s > bs){ bs = s; best = t; }
  });
  var spread = (1 - acc) * 1.9;
  return {
    x: clamp(best.mesh.position.x + rnd(-spread, spread), -TUNE.ARENA_R + 0.6, TUNE.ARENA_R - 0.6),
    z: clamp(best.mesh.position.z + rnd(-spread, spread), -TUNE.ARENA_R + 0.6, TUNE.ARENA_R - 0.6)
  };
}
/* rivals (and the autotest player) throw through the same input space:
   attitude + power + grip, with per-rival style */
function aiAttitude(r, pick){
  var style = (r && r.throwStyle) || { edge: 0.5, grip: 0.5 };
  var att = { dx: 0, dz: 1, tilt: 0, grip: Math.random() < style.grip, scatter: 0 };
  att.perfect = att.grip && Math.random() < 0.3;
  if (Math.random() < style.edge){
    /* edge throw: drive from the aim point through the nearest other chip */
    var best = null, bd = 1e9;
    M.pot.forEach(function(t){
      if (t.captured) return;
      var d = hdist(t.mesh.position.x, t.mesh.position.z, pick.x, pick.z);
      if (d > 0.25 && d < bd){ bd = d; best = t; }
    });
    var dx = best ? best.mesh.position.x - pick.x : rnd(-1, 1);
    var dz = best ? best.mesh.position.z - pick.z : rnd(-1, 1);
    var dl = Math.sqrt(dx * dx + dz * dz) || 1;
    att.dx = dx / dl; att.dz = dz / dl;
    att.tilt = rnd(0.55, 1);
  }
  return att;
}
function autoPlayerSlam(){
  if (!M || M.turn !== 'you' || mode !== 'idle') return;
  run.slammer = run.pouch[Math.floor(Math.random() * run.pouch.length)];
  var p = aiPick(0.82);
  /* harness throw driver: cover the whole input space — flat and edge,
     gripped and sloppy */
  var att = aiAttitude({ throwStyle: { edge: 0.5, grip: 0.55 } }, p);
  att.scatter = att.grip ? 0.06 : rnd(0.1, 0.4);
  doSlam('you', p.x, p.z, rnd(0.55, 0.95), att);
}

