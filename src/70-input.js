/* ================================================================
   INPUT — pointerdown = aim + power bar; release = slam
   ================================================================ */
var raycaster = new THREE.Raycaster();
var groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
var _ndc = new THREE.Vector2(), _hit = new THREE.Vector3();
function pointerToGround(ev){
  var rect = el('gl').getBoundingClientRect();
  _ndc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
  _ndc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(_ndc, camera);
  return raycaster.ray.intersectPlane(groundPlane, _hit) ? _hit : null;
}
/* Throw v2 gesture — three deliberate phases, one skill each:
   1. TILT  (drag from your touch point to tip the slammer; tap = flat)
   2. AIM   (drag the target ring where you want it)
   3. POWER (hold; release at the peak of the curve)
   Touch-friendly: each phase is its own press-and-release. */
var throwAtt = null, tiltAnchor = { x: 0, z: 0 };
function setHint(txt){ el('hint').textContent = txt; }
function ghostAt(x, y, z, att){
  ghost.visible = true;
  ghost.position.set(x, y, z);
  if (att && att.tilt > 0.02){
    _wobAx.set(att.dz, 0, -att.dx).normalize();
    ghost.quaternion.setFromAxisAngle(_wobAx, att.tilt * TUNE.TILT_MAX);
  } else {
    ghost.quaternion.set(0, 0, 0, 1);
  }
}
function resetThrow(){
  throwAtt = null;
  ghost.visible = false;
  el('powwrap').style.visibility = 'hidden';
  el('powfill').classList.remove('grip');
}
el('gl').addEventListener('pointerdown', function(ev){
  audioInit();
  if (!M || M.turn !== 'you') return;
  var p = pointerToGround(ev);
  if (!p) return;
  if (mode === 'idle'){
    /* phase 1: tilt dial — drag away from the touch point to tip */
    mode = 'tilt';
    tiltAnchor.x = p.x; tiltAnchor.z = p.z;
    throwAtt = { dx: 0, dz: 1, tilt: 0, grip: false, scatter: 0 };
    setHint('TILT — drag to tip the slammer · tap = flat');
  } else if (mode === 'aimloc'){
    aimPos.x = p.x; aimPos.z = p.z;
    reticle.material.color.set(0x7fd9c0);
    reticle.visible = true;
  } else if (mode === 'power'){
    /* phase 3: the curve starts on press */
    aimT = 0;
    el('powwrap').style.visibility = 'visible';
  }
});
el('gl').addEventListener('pointermove', function(ev){
  if (mode !== 'tilt' && mode !== 'aimloc') return;
  var p = pointerToGround(ev);
  if (!p) return;
  if (mode === 'tilt'){
    var dx = p.x - tiltAnchor.x, dz = p.z - tiltAnchor.z;
    var d = Math.sqrt(dx * dx + dz * dz);
    if (d > 0.1){
      throwAtt.dx = dx / d; throwAtt.dz = dz / d;
      throwAtt.tilt = clamp(d / 1.6, 0, 1);
    } else {
      throwAtt.tilt = 0;
    }
  } else {
    aimPos.x = p.x; aimPos.z = p.z;
  }
});
window.addEventListener('pointerup', function(){
  if (!M || M.turn !== 'you') return;
  if (mode === 'tilt'){
    if (throwAtt.tilt < 0.08) throwAtt.tilt = 0;
    mode = 'aimloc';
    aimPos.x = 0; aimPos.z = 0;
    reticle.material.color.set(0x7fd9c0);
    reticle.visible = true;
    setHint('AIM — drag the target ring, let go to lock');
  } else if (mode === 'aimloc'){
    mode = 'power';
    aimT = -1;   /* curve waits for the phase-3 press */
    setHint('POWER — press and hold · release at the peak');
  } else if (mode === 'power' && aimT >= 0){
    el('powwrap').style.visibility = 'hidden';
    el('powfill').classList.remove('grip');
    var att = throwAtt || { dx: 0, dz: 1, tilt: 0 };
    att.grip = gripAt(aimT);
    att.perfect = Math.abs(aimT - TUNE.POW_RISE) <= TUNE.PERFECT_WIN;
    var slop = sloppyAt(aimT);
    att.scatter = TUNE.SCATTER * (att.grip ? 0.3 : 1) + slop * TUNE.SCATTER_SLOPPY;
    var p = powerCurve(aimT);
    if (att.perfect){
      popupAt3D(new THREE.Vector3(aimPos.x, 0.5, aimPos.z), 'WHITE HOT!!', '#ff8a30');
      sfxGrip();
    } else if (att.grip){
      popupAt3D(new THREE.Vector3(aimPos.x, 0.5, aimPos.z), 'TOURNAMENT GRIP!', '#f5b93d');
      sfxGrip();
    }
    resetThrow();
    doSlam('you', aimPos.x, aimPos.z, clamp(p, 0.08, 1), att);
  }
});

/* ---------- buttons ---------- */
el('startbtn').addEventListener('click', function(){
  audioInit();
  newRun();
  showMap();
});
el('slambtn').addEventListener('click', function(){ startMatch(); });
el('walkbtn').addEventListener('click', function(){ endRun(false, 'walk'); });
el('resbtn').addEventListener('click', onResultContinue);
el('runendbtn').addEventListener('click', function(){
  newRun(); showMap();
});
el('gobtn').addEventListener('click', function(){
  var n = NODES[run.stage];
  if (n.t === 'store') openStore(); else openAnte();
});
el('leavebtn').addEventListener('click', function(){
  run.stage++;
  showMap();
});
el('tradebtn').addEventListener('click', doTrade);
el('callheads').addEventListener('click', function(){ audioInit(); chooseCall('heads'); });
el('calltails').addEventListener('click', function(){ audioInit(); chooseCall('tails'); });

/* ---------- impact drama: slow-mo, flash, flare, shockwave ---------- */
var timeScale = 1, tsHold = 0, lampFlare = 0;
function flashImpact(p){
  var f = el('flash');
  f.style.transition = 'none';
  f.style.opacity = String(0.16 + 0.28 * p);
  setTimeout(function(){
    f.style.transition = 'opacity 0.4s ease-out';
    f.style.opacity = '0';
  }, 30);
}
function shockwave(x, z, r){
  var m = new THREE.Mesh(
    new THREE.RingGeometry(0.55, 0.78, 26),
    new THREE.MeshBasicMaterial({ color: 0xffe2b0, transparent: true, opacity: 0.75, depthWrite: false }));
  m.rotation.x = -Math.PI/2; m.position.set(x, 0.03, z);
  scene.add(m);
  var t0 = null;
  function st(ts2){
    if (t0 === null) t0 = ts2;
    var k = Math.min(1, (ts2 - t0) / (AUTO ? 90 : 420));
    var s = 0.4 + k * r * 1.5;
    m.scale.set(s, s, 1);
    m.material.opacity = 0.75 * (1 - k);
    if (k < 1) nextFrame(st); else scene.remove(m);
  }
  nextFrame(st);
}

/* frame driver: headless chromium only fires rAF once under virtual time,
   so autotest mode drives frames with timers instead */
function nextFrame(cb){
  if (AUTO) setTimeout(function(){ cb(performance.now()); }, 16);
  else requestAnimationFrame(cb);
}

/* debug/test hooks */
window.__state = function(){
  return {
    mode: mode,
    turn: M ? M.turn : null,
    pot: M ? alive().length : 0,
    yourCaps: M ? M.yourCaps.length : 0,
    rivalCaps: M ? M.rivalCaps.length : 0,
    binder: run ? run.binder.length : 0,
    stage: run ? run.stage : 0,
    pouch: run ? run.pouch.length : 0
  };
};
window.__slamAt = function(x, z, p){ if (M && mode === 'idle' && M.turn === 'you') doSlam('you', x, z, p); };

