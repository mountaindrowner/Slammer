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
  capSeq = 0;   /* chain captures leave the table one at a time */
  var q = flips.slice();
  while (q.length){
    var t = q.shift();
    if (t.captured) continue;
    captureTazo(t, M.turn, q);
  }
  maybeEndTurn();
}
/* the drain ate it: nobody's chip now, removed from the run */
function sinkChip(t){
  t.captured = 'drain';
  dropShadow(t);
  popupAt3D(t.mesh.position, 'GLUG.', '#7fa8ff');
  tone(220, 0.3, 'sine', 0.09, 60);
  tlog('  DRAIN ate ' + t.design.name + ' (staked by ' + t.stakedBy + ')');
  animCount++;
  var t0 = null, sy = t.mesh.position.y;
  function step(ts){
    if (t0 === null) t0 = ts;
    var k = Math.min(1, (ts - t0) / (AUTO ? 80 : 500));
    t.mesh.position.y = sy - k * 0.5;
    var sc = Math.max(0.05, 1 - k * 0.9);
    t.mesh.scale.set(sc, sc, sc);
    t.mesh.rotation.y += 0.18;
    if (k < 1) nextFrame(step);
    else {
      scene.remove(t.mesh);
      animCount--;
      maybeEndTurn();
    }
  }
  nextFrame(step);
}
/* a flip gets overturned: the chip pops back into the pot, face up */
function returnToPot(t, txt, color){
  t.disturbed = false; t.faceUp = true;
  t.settled = false; t.settling = null;
  t.mesh.rotation.set(0, rnd(0, 6.28), 0);
  t.vel.set(rnd(-1.5, 1.5), 5.5, rnd(-1.5, 1.5));
  t.angVel.set(0, 9, 0);
  popupAt3D(t.mesh.position, txt, color);
  sfxBoing();
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
  /* -- house rules that overturn your flip, resolved before it's real:
     veto (once a match) · tractor beam (20%) · the crown (until it falls) -- */
  if (side === 'you' && M.rival.rule === 'veto' && !M.vetoUsed){
    M.vetoUsed = true;
    returnToPot(t, 'VETOED!', '#7fa8ff');
    bark(M.rival.barks.rule);
    tlog('  veto returned ' + t.design.name);
    return;
  }
  if (side === 'you' && M.rival.rule === 'beam' && t.stakedBy === 'rival' && Math.random() < 0.2){
    returnToPot(t, 'BEAMED UP!', '#d9ff5e');
    bark(M.rival.barks.rule);
    tlog('  beam returned ' + t.design.name);
    return;
  }
  if (side === 'you' && M.rival.rule === 'crown' && t.stakedBy === 'rival' &&
      M.crownLive && !M.crownDone && !t.crown){
    returnToPot(t, 'THE CROWN HOLDS', '#f5b93d');
    if (!M.crownBarked){ M.crownBarked = true; bark(M.rival.barks.rule); }
    tlog('  crown returned ' + t.design.name);
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

  /* wincon: bounty — the marked chip decides the match */
  if (t.bounty && M && !M.bountyDone){
    M.bountyDone = side;
    banner('BOUNTY!', 1400);
    tlog('  BOUNTY taken by ' + side);
  }
  /* wincon egg: ANYONE flipping the egg hands ZORP the match */
  if (t.egg && M && !M.bountyDone){
    M.bountyDone = 'rival';
    banner(side === 'rival' ? 'HE TOOK THE EGG!!' : 'YOU TOUCHED THE EGG!!', 1600);
    tlog('  EGG flipped by ' + side + ' -> rival wins');
  }
  /* wincon sudden: first blood takes the whole match */
  if (M && M.wincon === 'sudden' && !M.bountyDone){
    M.bountyDone = side;
    banner('SUDDEN DEATH!', 1400);
    tlog('  SUDDEN first cap by ' + side);
  }
  /* rule crown: flipping the crown chip breaks his hold on the pot */
  if (t.crown && M && !M.crownDone && side === 'you'){
    M.crownDone = true;
    banner('THE CROWN FALLS!', 1500);
    bark(M.rival.barks.ouch);
    tlog('  CROWN falls');
  }
  /* rule juice: the house takes $1 off every chip you flip */
  if (side === 'you' && M.rival.rule === 'juice' && run.money > 0){
    run.money = Math.max(0, run.money - 1);
    popupAt3D(t.mesh.position, '-$1 JUICE', '#e0863d');
    tlog('  juice -$1 -> $' + run.money);
  }

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
var capSeq = 0;
function animOut(t){
  animCount++;   /* held BEFORE any stagger so the turn can't slip out early */
  var delay = AUTO ? 0 : (capSeq++) * 150;
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
  if (delay) setTimeout(function(){ sfxFlip(); nextFrame(step); }, delay);
  else nextFrame(step);
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
  /* rule engine: at half pot, IT REBUILDS THE STACK — once */
  if (M.rival.rule === 'engine' && !M.rebuilt && alive().length >= 2 &&
      alive().length <= Math.ceil((M.pot0 || M.pot.length) / 2)){
    M.rebuilt = true;
    banner('IT REBUILDS THE STACK', 1600);
    bark(M.rival.barks.rule);
    camShake = 0.5;
    sfxBoom();
    shockwave(0, 0, 2);
    alive().forEach(function(t, i){
      t.settled = true; t.settling = null; t.disturbed = false; t.faceUp = true;
      t.mesh.rotation.set(0, rnd(0, 6.28), 0);
      t.mesh.position.set(rnd(-0.05, 0.05), TUNE.TAZO_H / 2 + i * TUNE.TAZO_H * 1.05, rnd(-0.05, 0.05));
    });
    tlog('  ENGINE rebuilt stack n=' + alive().length);
  }
  /* the table is still — name the technique */
  var co = evalCallout();
  if (co) showCallout(co, M.turn);
  turnEnding = true;
  setTimeout(function(){
    if (!M) return;
    if (M.bountyDone || alive().length === 0){ endMatch(); return; }
    if (M.slams >= M.bellAt){ ringBell(); return; }
    /* rule combo: did his capturing streak survive the turn? */
    if (M.turn === 'rival')
      M.comboN = M.rivalCaps.length > (M.comboBase || 0) ? (M.comboN || 0) + 1 : 0;
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
  /* bell-time wincons, judged before the pot goes home */
  if (M.wincon === 'kotc' && !M.bountyDone){
    var best = null, bd = 1e9;
    alive().forEach(function(t){
      var d = hdist(t.mesh.position.x, t.mesh.position.z, 0, 0);
      if (d < bd){ bd = d; best = t; }
    });
    if (best){
      M.bountyDone = best.stakedBy === 'you' ? 'you' : 'rival';
      banner(M.bountyDone === 'you' ? 'YOUR CHIP HOLDS THE COURT!' : 'HIS CHIP HOLDS THE COURT', 1500);
      tlog('  KOTC nearest=' + best.design.name + ' -> ' + M.bountyDone);
    }
  }
  if (M.wincon === 'egg' && !M.bountyDone && alive().some(function(t){ return t.egg; })){
    M.bountyDone = 'you';
    banner('THE EGG SURVIVES!!', 1500);
    tlog('  EGG survives -> you win');
  }
  M.bellSaved = 0;
  alive().forEach(function(t){
    if (t.guard && !t.egg){
      /* house props go home with the house */
      scene.remove(t.mesh); dropShadow(t);
      t.captured = 'bell';
      return;
    }
    if (r.rule === 'confiscate'){
      /* rule confiscate: whatever's on his desk at the bell stays there */
      r.binder.push(t.key);
      M.confiscated = (M.confiscated || 0) + 1;
      if (t.stakedBy === 'you') (M.confKeys = M.confKeys || []).push(t.key);
    } else if (t.stakedBy === 'you'){
      t.entry.wear = (t.entry.wear || 0) + 1;   /* SURVIVOR wear: staked and lived */
      binderAdd(t.entry);
      M.bellSaved++;
    }
    else r.binder.push(t.key);
    scene.remove(t.mesh); dropShadow(t);
    t.captured = 'bell';
  });
  if (M.confiscated){
    bark(r.barks.rule);
    tlog('  confiscated ' + M.confiscated);
  }
  setTimeout(endMatch, AUTO ? 120 : 1200);
}

function endMatch(){
  mode = 'over';
  mark('match-end');
  var y = M.yourCaps.length, rv = M.rivalCaps.length;
  var r = M.rival;
  var res = y > rv ? 'win' : (rv > y ? 'lose' : 'draw');
  /* bounty overrides the count — and the untouched pot goes home */
  if (M.bountyDone){
    res = M.bountyDone === 'you' ? 'win' : 'lose';
    alive().forEach(function(t){
      if (t.guard){ /* house props vanish with the house */ }
      else if (t.stakedBy === 'you') binderAdd(t.entry);
      else r.binder.push(t.key);
      scene.remove(t.mesh); dropShadow(t);
      t.captured = 'bounty';
    });
  }
  tlog('MATCH end: you=' + y + ' rival=' + rv + ' -> ' + res);

  /* for keeps: migrate everything captured */
  var gained = [], lost = [];
  M.yourCaps.forEach(function(t){
    if (t.egg) return;   /* you touched it — ZORP snatches it right back */
    var prov = t.stakedBy === 'rival' ? r.name : t.entry.prov;
    var wear = t.stakedBy === 'you' ? (t.entry.wear || 0) + 1 : 0;  /* reclaimed = survived */
    binderAdd({ key: t.key, prov: prov, finish: t.stakedBy === 'you' ? t.entry.finish : null, wear: wear });
    gained.push(t.key);
  });
  M.rivalCaps.forEach(function(t){
    if (!t.guard) r.binder.push(t.key);   /* re-flipped house props just vanish */
    if (t.stakedBy === 'you') lost.push(t.key);
  });
  if (M.confKeys) M.confKeys.forEach(function(k){ lost.push(k); });

  /* ---------- Lunch Money: itemized, earned, honest (vision §3) ---------- */
  var rlines = [];
  if (res === 'win') rlines.push(['WIN', 4]);
  if (y > 0) rlines.push(['CAPTURES ×' + y, y]);
  if (res === 'win' && rv === 0 && y > 0) rlines.push(['CLEAN SWEEP', 3]);
  if (res === 'win' && M.anteRankYou < M.anteRankRival) rlines.push(['UNDERDOG', 2]);
  if (M.bellSaved) rlines.push(['BELL SAVE ×' + M.bellSaved, M.bellSaved]);
  if (M.styleBonus) rlines.push(['STYLE', M.styleBonus]);
  var earned = 0;
  rlines.forEach(function(l){ earned += l[1]; });
  run.money += earned;
  run.stats.matches++;
  if (res === 'win') run.stats.wins++;
  run.stats.caps += y;
  run.stats.lost += lost.length;
  run.stats.earned += earned;
  run.lastScore = { y: y, rv: rv, name: r.name };
  tlog('MONEY +' + earned + ' -> ' + run.money +
    ' [' + rlines.map(function(l){ return l[0] + ':' + l[1]; }).join(' ') + ']');
  var rc = el('receipt'); rc.innerHTML = '';
  el('receiptcard').style.display = rlines.length ? 'block' : 'none';
  rlines.push(['LUNCH MONEY — now $' + run.money, earned]);
  rlines.forEach(function(l, i){
    setTimeout(function(){
      var d = document.createElement('div');
      d.className = 'rline' + (i === rlines.length - 1 ? ' total' : '');
      d.innerHTML = '<span>' + l[0] + '</span><span>+$' + l[1] + '</span>';
      rc.appendChild(d);
      sfxCash();
    }, AUTO ? 10 : 300 + i * 340);
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
  el('resbtn').textContent = res === 'win' ? (run.stage >= COURT.length - 1 ? 'TAKE THE COURT' : 'BACK TO THE STREET') : 'RUN IT BACK';
  showScreen('result');
  if (AUTO) setTimeout(function(){ el('resbtn').click(); }, 150);
}

function onResultContinue(){
  var res = M.result, r = M.rival;
  if (res === 'win') run.beaten.push(r.name);
  M.pot.forEach(function(t){ scene.remove(t.mesh); dropShadow(t); });
  if (M.bust) scene.remove(M.bust);
  if (M.fieldMeshes) M.fieldMeshes.forEach(function(m){ scene.remove(m); });
  pendingImps.length = 0;
  M = null;
  if (res === 'win'){
    run.stage++;
    if (run.stage >= COURT.length){ endRun(true); return; }
    showMap();
  } else {
    /* rematch if the binder can cover it */
    if (run.binder.length === 0 || r.binder.length === 0){
      if (r.binder.length === 0){ run.stage++;  /* he's cleaned out — counts */
        if (run.stage >= COURT.length){ endRun(true); return; }
        showMap(); return;
      }
      endRun(false, 'cleaned'); return;
    }
    openAnte();
  }
}

/* the run's build, named by what the binder became */
function buildName(){
  var n = { heavy: 0, boom: 0, fx: 0, finish: 0, alien: 0, rare: 0 };
  run.binder.forEach(function(e){
    var d = DESIGNS[e.key];
    if (d.phys && (d.phys.imp || 1) < 1) n.heavy++;
    if (e.key === 'whoopee') n.boom++;
    if (d.effect) n.fx++;
    if (e.finish) n.finish++;
    if (['zorbo', 'saucer', 'moonrock'].indexOf(e.key) >= 0) n.alien++;
    if (rank(e.key) >= 2) n.rare++;
  });
  if (run.binder.some(function(e){ return e.key === 'crown'; })) return 'THE CROWN JEWELS';
  if (n.alien >= 3) return 'THE AREA 51 PAGE';
  if (n.boom >= 2) return 'THE LOUD PAGE';
  if (n.heavy >= 3) return 'THE PAPERWEIGHT MOB';
  if (n.finish >= 4) return 'THE SHOWCASE';
  if (n.fx >= 4) return 'THE TRICK DECK';
  if (run.binder.length >= 5 && n.rare >= run.binder.length * 0.6) return 'THE PREMIUM PAGE';
  if (run.binder.length >= 18) return 'THE HOARD';
  if (run.binder.length <= 4) return 'THE SURVIVORS';
  return 'THE HONEST PAGE';
}
function endRun(won, why){
  mode = 'menu';
  mark('run-end');
  el('runendtitle').textContent = won ? 'KING OF THE COURT' : (why === 'walk' ? 'WALKED HOME' : 'CLEANED OUT');
  el('runendtitle').style.color = won ? 'var(--pop)' : 'var(--pink)';
  el('runendsub').textContent = won
    ? 'you own the whole court — every court. binder: ' + run.binder.length + ' tazos.'
    : (why === 'walk' ? 'you kept your binder. the court keeps talking.' : 'they took everything. even the binder rings.');
  el('runendroute').textContent = '"' + buildName() + '" — beat ' +
    (run.beaten.length ? run.beaten.join(' → ') : 'nobody. rough day.');
  var st = run.stats, ls = run.lastScore;
  el('runendstats').textContent = st.matches + ' matches · ' + st.caps + ' chips flipped · ' +
    st.lost + ' lost for keeps · $' + st.earned + ' lunch money earned' +
    (ls ? ' · last word: ' + (won ? 'YOU TOOK IT ' + ls.y + '–' + ls.rv
      : ls.name + ' TOOK IT ' + ls.rv + '–' + ls.y) : '');
  var b = el('runendbinder'); b.innerHTML = '';
  run.binder.forEach(function(e){
    var img = document.createElement('img'); img.src = designURL(e.key);
    img.title = DESIGNS[e.key].name + (e.prov ? ' — won off ' + e.prov : '');
    b.appendChild(img);
  });
  /* meta unlocks: breadth, not power */
  if (won && unlockStack('heavy')) el('runendsub').textContent += ' — NEW STARTER STACK: CURBSIDE.';
  var rares = run.binder.filter(function(e){ return rank(e.key) >= 2; }).length;
  if (rares >= 5 && unlockStack('chaos')) el('runendsub').textContent += ' — NEW STARTER STACK: FIRECRACKER.';
  showScreen('runend');
  tlog('RUN end: ' + (won ? 'WON' : 'LOST(' + (why||'') + ')') + ' binder=' + run.binder.length + ' $' + run.money);
  if (AUTO){
    document.title = 'TESTDONE ' + (won ? 'WON' : 'LOST') + ' binder=' + run.binder.length;
    tlog('TESTDONE');
  }
}

