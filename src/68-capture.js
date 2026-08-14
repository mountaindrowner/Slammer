/* ================================================================
   CAPTURE PIPELINE — every effect is a data key resolved here
   ================================================================ */
function isFlipped(t){
  if (!t.disturbed || t.captured) return false;
  if (t.design.effect === 'double') return true;   /* flipped however it lands */
  return t.faceUp === false;
}
function resolveSettled(){
  var flips = M.pot.filter(isFlipped);
  if (flips.length === 0){ maybeEndTurn(); return; }
  var q = flips.slice();
  while (q.length){
    var t = q.shift();
    if (t.captured) continue;
    captureTazo(t, M.turn, q);
  }
  maybeEndTurn();
}
function captureTazo(t, side, chainQ){
  /* -- rubber: chance to bounce back over -- */
  if (t.design.effect === 'rubber' && Math.random() < TUNE.RUBBER_SAVE){
    t.disturbed = false; t.faceUp = true;
    t.mesh.rotation.set(0, rnd(0, 6.28), 0);
    t.vel.set(0, 5, 0); t.angVel.set(0, 8, 0); t.settled = false;
    popupAt3D(t.mesh.position, 'BOING!', '#7fd9c0');
    sfxBoing();
    tlog('  rubber saved: ' + t.design.name);
    return;
  }
  t.captured = side;
  if (slamStats && side === slamStats.side){
    slamStats.caps++;
    if (t.settleSpin > 8) slamStats.spinFlip = true;
  }
  dropShadow(t);
  /* anything stacked on this chip loses its support and drops */
  M.pot.forEach(function(o){
    if (o.captured || o === t) return;
    if (o.mesh.position.y > t.mesh.position.y + TUNE.TAZO_H * 0.4 &&
        hdist(o.mesh.position.x, o.mesh.position.z, t.mesh.position.x, t.mesh.position.z) < TUNE.TAZO_R * 1.7){
      wakeChip(o);
    }
  });
  sfxFlip();
  popupAt3D(t.mesh.position, 'FLIPPED!', side === 'you' ? '#7fd9c0' : '#ff3d5e');
  (side === 'you' ? M.yourCaps : M.rivalCaps).push(t);
  addCapThumb(t, side);
  if (side === 'you' && t.stakedBy === 'rival'){ bark(M.rival.barks.ouch); bustRecoil = 1; }
  if (side === 'rival' && t.stakedBy === 'you'){ bark(M.rival.barks.hit); bustBob = 1; }
  tlog('  CAP ' + side + ' <- ' + t.design.name + ' (staked by ' + t.stakedBy + ')');

  var fx = t.design.effect;
  if (fx === 'whoopee'){
    /* detonate after the anticipation beat */
    pendingBooms++;
    var pos = t.mesh.position.clone();
    t.mesh.scale.set(1.35, 2.2, 1.35);
    setTimeout(function(){
      pendingBooms--;
      if (!M){ return; }
      popupAt3D(pos, 'PBBBBT!!', '#ff8fc7');
      sfxBoom();
      venueDogBark();   /* the dog loses its mind */
      camShake = 0.5;
      M.pot.forEach(function(o){
        if (o.captured) return;
        var d = hdist(o.mesh.position.x, o.mesh.position.z, pos.x, pos.z);
        if (d > TUNE.WHOOPEE_R) return;
        var base = 8 * (1 - d / TUNE.WHOOPEE_R) + 3;
        var dx = o.mesh.position.x - pos.x, dz = o.mesh.position.z - pos.z;
        var dl = Math.max(0.2, Math.sqrt(dx*dx + dz*dz));
        o.vel.x += (dx/dl) * base * 0.5; o.vel.z += (dz/dl) * base * 0.5;
        o.vel.y += base * 0.6;
        o.angVel.set(rnd(-1,1), rnd(-1,1), rnd(-1,1)).normalize().multiplyScalar(base * 2);
        o.settled = false; o.settling = null; o.disturbed = true;
      });
      animOut(t);
      if (mode === 'over') return;
      mode = 'sim';
      tlog('  WHOOPEE boom');
    }, AUTO ? 60 : TUNE.WHOOPEE_MS);
  } else {
    animOut(t);
  }
  if (fx === 'mecha' && chainQ){
    /* chain-flip adjacent on landing */
    M.pot.forEach(function(o){
      if (o.captured || o === t) return;
      if (hdist(o.mesh.position.x, o.mesh.position.z, t.mesh.position.x, t.mesh.position.z) < TUNE.MECHA_R){
        popupAt3D(o.mesh.position, 'CHAIN!', '#f5b93d');
        o.disturbed = true; o.faceUp = false; o.settled = true;
        chainQ.push(o);
      }
    });
  }
  if (fx === 'cursed'){
    /* flipping it flips one of YOUR pot tazos over to the other kid */
    var oth = side === 'you' ? 'rival' : 'you';
    var mine = M.pot.filter(function(o){ return !o.captured && o.stakedBy === side; });
    if (mine.length){
      var vict = mine[Math.floor(Math.random() * mine.length)];
      popupAt3D(vict.mesh.position, 'CURSED!', '#ff4b3d');
      vict.disturbed = true; vict.faceUp = false; vict.settled = true;
      if (chainQ){
        var qi = chainQ.indexOf(vict);
        if (qi >= 0) chainQ.splice(qi, 1);
      }
      captureTazo(vict, oth, chainQ);
    }
  }
}
function addCapThumb(t, side){
  var img = document.createElement('img');
  img.src = designURL(t.key);
  el(side === 'you' ? 'yourcaps' : 'rivalcaps').appendChild(img);
}
function animOut(t){
  animCount++;
  var start = t.mesh.position.clone();
  var dir = t.captured === 'you' ? 1 : -1;
  var end = new THREE.Vector3(rnd(-1.5, 1.5), 2.2, dir * (TUNE.ARENA_R + 3.5));
  var t0 = null;
  function step(ts){
    if (t0 === null) t0 = ts;
    var k = Math.min(1, (ts - t0) / (AUTO ? 90 : 450));
    t.mesh.position.lerpVectors(start, end, k);
    t.mesh.position.y = start.y + Math.sin(k * Math.PI) * 1.6;
    var sc = 1 - k * 0.5;
    t.mesh.scale.set(sc, sc, sc);
    if (k < 1) nextFrame(step);
    else {
      scene.remove(t.mesh);
      animCount--;
      maybeEndTurn();
    }
  }
  nextFrame(step);
}

/* ---------- turn / match end ---------- */
function alive(){ return M.pot.filter(function(t){ return !t.captured; }); }
function allSettled(){
  return alive().every(function(t){ return t.settled; });
}
function maybeEndTurn(){
  if (!M || mode === 'over' || turnEnding) return;
  if (slammer && slammer.phase !== 'fade') return;   /* the table isn't still yet */
  if (pendingBooms > 0 || animCount > 0 || pendingImps.length > 0) return;
  if (!allSettled()) return;
  if (M.pot.some(isFlipped)) return;  /* still work to do */
  /* the table is still — name the technique */
  var co = evalCallout();
  if (co) showCallout(co, M.turn);
  turnEnding = true;
  setTimeout(function(){
    if (!M) return;
    if (alive().length === 0){ endMatch(); return; }
    if (M.slams >= M.bellAt){ ringBell(); return; }
    beginTurn(M.turn === 'you' ? 'rival' : 'you');
  }, AUTO ? 80 : (co ? 1050 : 550));
}

/* the bell: recess ends, unclaimed pot goes home to its stakers */
function sfxBell(){
  tone(1318, 0.6, 'triangle', 0.1);
  setTimeout(function(){ tone(1046, 0.7, 'triangle', 0.09); }, 180);
}
function ringBell(){
  mode = 'over';
  M.bellRang = true;
  sfxBell();
  banner('THE BELL RINGS!', 1400);
  tlog('BELL at slams=' + M.slams);
  var r = M.rival;
  alive().forEach(function(t){
    if (t.stakedBy === 'you') run.binder.push(t.entry);
    else r.binder.push(t.key);
    scene.remove(t.mesh); dropShadow(t);
    t.captured = 'bell';
  });
  setTimeout(endMatch, AUTO ? 120 : 1200);
}

function endMatch(){
  mode = 'over';
  mark('match-end');
  var y = M.yourCaps.length, rv = M.rivalCaps.length;
  var r = M.rival;
  var res = y > rv ? 'win' : (rv > y ? 'lose' : 'draw');
  tlog('MATCH end: you=' + y + ' rival=' + rv + ' -> ' + res);

  /* for keeps: migrate everything captured */
  var gained = [], lost = [];
  M.yourCaps.forEach(function(t){
    var prov = t.stakedBy === 'rival' ? r.name : t.entry.prov;
    run.binder.push({ key: t.key, prov: prov });
    gained.push(t.key);
  });
  M.rivalCaps.forEach(function(t){
    r.binder.push(t.key);
    if (t.stakedBy === 'you') lost.push(t.key);
  });

  if (res === 'win'){ sfxWin(); } else if (res === 'lose'){ sfxLose(); }

  /* his slammer is part of the spoils */
  var slamNote = '';
  if (res === 'win' && r.slammer !== 'slammy' && run.pouch.indexOf(r.slammer) < 0){
    run.pouch.push(r.slammer);
    slamNote = ' — and his ' + SLAMMERS[r.slammer].name + ' is yours now.';
    tlog('SLAMMER won: ' + r.slammer);
  }
  el('restitle').textContent = res === 'win' ? 'CLEANED HIM OUT!' : (res === 'lose' ? 'SLAMMED...' : 'DEAD EVEN');
  el('restitle').style.color = res === 'win' ? 'var(--pop)' : (res === 'lose' ? 'var(--pink)' : 'var(--cyan)');
  el('resbark').textContent = r.name + ': ' + (res === 'win' ? r.barks.lose : r.barks.win) +
    (M.bellRang ? ' (the bell saved the rest)' : '') + slamNote;
  el('gainhead').textContent = gained.length ? 'INTO YOUR BINDER (' + gained.length + ')' : 'YOU TOOK NOTHING';
  el('losthead').textContent = lost.length ? 'GONE FOR KEEPS (' + lost.length + ')' : '';
  var gl_ = el('gainlist'); gl_.innerHTML = '';
  gained.forEach(function(k){
    var img = document.createElement('img'); img.src = designURL(k); gl_.appendChild(img);
  });
  var ll = el('lostlist'); ll.innerHTML = '';
  lost.forEach(function(k){
    var img = document.createElement('img'); img.src = designURL(k); img.className = 'lostimg'; ll.appendChild(img);
  });
  M.result = res;
  el('resbtn').textContent = res === 'win' ? (run.stage >= NODES.length - 1 ? 'TAKE THE COURT' : 'BACK TO THE STREET') : 'RUN IT BACK';
  showScreen('result');
  if (AUTO) setTimeout(function(){ el('resbtn').click(); }, 150);
}

function onResultContinue(){
  var res = M.result, r = M.rival;
  M.pot.forEach(function(t){ scene.remove(t.mesh); dropShadow(t); });
  if (M.bust) scene.remove(M.bust);
  pendingImps.length = 0;
  M = null;
  if (res === 'win'){
    run.stage++;
    if (run.stage >= NODES.length){ endRun(true); return; }
    showMap();
  } else {
    /* rematch if the binder can cover it */
    if (run.binder.length === 0 || r.binder.length === 0){
      if (r.binder.length === 0){ run.stage++;  /* he's cleaned out — counts */
        if (run.stage >= NODES.length){ endRun(true); return; }
        showMap(); return;
      }
      endRun(false, 'cleaned'); return;
    }
    openAnte();
  }
}

function endRun(won, why){
  mode = 'menu';
  mark('run-end');
  el('runendtitle').textContent = won ? 'KING OF THE COURT' : (why === 'walk' ? 'WALKED HOME' : 'CLEANED OUT');
  el('runendtitle').style.color = won ? 'var(--pop)' : 'var(--pink)';
  el('runendsub').textContent = won
    ? 'you own the neighborhood. binder: ' + run.binder.length + ' tazos.'
    : (why === 'walk' ? 'you kept your binder. the court keeps talking.' : 'they took everything. even the binder rings.');
  var b = el('runendbinder'); b.innerHTML = '';
  run.binder.forEach(function(e){
    var img = document.createElement('img'); img.src = designURL(e.key);
    img.title = DESIGNS[e.key].name + (e.prov ? ' — won off ' + e.prov : '');
    b.appendChild(img);
  });
  showScreen('runend');
  tlog('RUN end: ' + (won ? 'WON' : 'LOST(' + (why||'') + ')') + ' binder=' + run.binder.length);
  if (AUTO){
    document.title = 'TESTDONE ' + (won ? 'WON' : 'LOST') + ' binder=' + run.binder.length;
    tlog('TESTDONE');
  }
}

