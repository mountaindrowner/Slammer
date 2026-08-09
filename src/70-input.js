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
el('gl').addEventListener('pointerdown', function(ev){
  audioInit();
  if (!M || M.turn !== 'you' || mode !== 'idle') return;
  var p = pointerToGround(ev);
  if (!p) return;
  mode = 'aim'; aimT = 0;
  aimPos.x = p.x; aimPos.z = p.z;
  reticle.material.color.set(0x7fd9c0);
  reticle.visible = true;
  el('powwrap').style.visibility = 'visible';
});
el('gl').addEventListener('pointermove', function(ev){
  if (mode !== 'aim') return;
  var p = pointerToGround(ev);
  if (p){ aimPos.x = p.x; aimPos.z = p.z; }
});
window.addEventListener('pointerup', function(){
  if (mode !== 'aim') return;
  el('powwrap').style.visibility = 'hidden';
  doSlam('you', aimPos.x, aimPos.z, clamp(power, 0.08, 1));
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

