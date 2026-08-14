/* ================================================================
   THREE SETUP — mobile-webview budget (see CLAUDE.md)
   ================================================================ */
mark('three-setup');
var renderer = new THREE.WebGLRenderer({ canvas: el('gl'), antialias: false, alpha: true });
renderer.setPixelRatio(1);
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(55, 1, 1, 80);
/* night rig: one hot tungsten spot over the court, cold dim bounce */
scene.add(new THREE.HemisphereLight(0x2e3a5c, 0x0a0710, 0.5));
var lamp = new THREE.SpotLight(0xffd9a8, 1.35, 0, 0.62, 0.55, 0);
lamp.position.set(2.4, 8.5, -1.8);
scene.add(lamp);
scene.add(lamp.target);
var fill = new THREE.DirectionalLight(0x3a4a74, 0.35);
fill.position.set(-5, 3, 4);
scene.add(fill);

/* floor: asphalt + chalk baked into one texture (no decal z-fights) */
var FLOOR_R = TUNE.ARENA_R + 2.4;
function makeFloorTexture(){
  var cv = document.createElement('canvas'); cv.width = cv.height = 512;
  var c = cv.getContext('2d');
  c.fillStyle = '#181223'; c.fillRect(0, 0, 512, 512);
  for (var i = 0; i < 1100; i++){
    c.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.14)';
    c.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }
  /* baked pool of lamplight, offset toward the streetlight */
  var pool = c.createRadialGradient(300, 218, 30, 300, 218, 250);
  pool.addColorStop(0, 'rgba(255,214,170,0.16)'); pool.addColorStop(1, 'rgba(255,214,170,0)');
  c.fillStyle = pool; c.fillRect(0, 0, 512, 512);
  var px = 256 / FLOOR_R; /* px per world unit */
  c.strokeStyle = 'rgba(240,235,250,0.16)'; c.lineWidth = 11;
  c.beginPath(); c.arc(258, 254, TUNE.ARENA_R * px + 2, 0, 6.3); c.stroke();
  c.strokeStyle = 'rgba(240,235,250,0.45)'; c.lineWidth = 5;
  c.beginPath(); c.arc(256, 256, TUNE.ARENA_R * px, 0, 6.3); c.stroke();
  /* chalk graffiti */
  c.strokeStyle = 'rgba(240,235,250,0.22)'; c.lineWidth = 4; c.lineCap = 'round';
  function X(x, y){ c.beginPath(); c.moveTo(x-9,y-9); c.lineTo(x+9,y+9); c.moveTo(x+9,y-9); c.lineTo(x-9,y+9); c.stroke(); }
  X(452, 150); X(72, 340); X(420, 420);
  c.strokeRect(30, 396, 36, 36); c.strokeRect(30, 432, 36, 36); c.strokeRect(66, 414, 36, 36);
  c.font = 'bold 30px "Comic Sans MS", cursive';
  c.fillStyle = 'rgba(240,235,250,0.28)';
  c.save(); c.translate(256, 52); c.rotate(-0.06); c.fillText('4 KEEPS', -62, 0); c.restore();
  return new THREE.CanvasTexture(cv);
}
var floor = new THREE.Mesh(
  new THREE.CircleGeometry(FLOOR_R, 40),
  new THREE.MeshLambertMaterial({ map: makeFloorTexture() }));
floor.rotation.x = -Math.PI/2;
scene.add(floor);
/* curb wall around the court */
var curb = new THREE.Mesh(
  new THREE.CylinderGeometry(TUNE.ARENA_R + 0.42, TUNE.ARENA_R + 0.42, 0.3, 40, 1, true),
  new THREE.MeshLambertMaterial({ color: 0x241d33, side: THREE.DoubleSide }));
curb.position.y = 0.15;
scene.add(curb);
/* sidewalk props — cheap primitives, parallax anchors for depth */
function prop(geo, color, x, y, z, ry){
  var m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: color }));
  m.position.set(x, y, z); m.rotation.y = ry || 0;
  scene.add(m); return m;
}
prop(new THREE.CylinderGeometry(0.3, 0.34, 0.72, 10), 0x9a3540, 5.0, 0.36, -1.2);   /* hydrant */
prop(new THREE.CylinderGeometry(0.15, 0.15, 0.2, 8), 0x9a3540, 5.0, 0.82, -1.2);
prop(new THREE.BoxGeometry(0.85, 0.85, 0.85), 0x2c4a72, -4.7, 0.43, 1.8, 0.5);      /* milk crate */
prop(new THREE.CylinderGeometry(0.15, 0.15, 0.42, 10), 0x9aa4b2, 4.35, 0.21, 2.75); /* soda can */
prop(new THREE.BoxGeometry(0.4, 0.07, 0.1), 0xd8d2e0, 2.6, 0.04, -4.2, 0.7);        /* chalk stick */
/* the streetlight itself — sells the single-source night */
prop(new THREE.CylinderGeometry(0.07, 0.09, 4.4, 8), 0x1c1826, 3.4, 2.2, -2.9);
prop(new THREE.BoxGeometry(1.4, 0.1, 0.32), 0x1c1826, 2.85, 4.42, -2.6, -0.5);
var bulb = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.26),
  new THREE.MeshBasicMaterial({ color: 0xffe2b0 }));
bulb.position.set(2.45, 4.36, -2.35); bulb.rotation.y = -0.5;
scene.add(bulb);

/* aim reticle */
var reticle = new THREE.Mesh(
  new THREE.RingGeometry(0.5, 0.62, 24),
  new THREE.MeshBasicMaterial({ color: 0x7fd9c0, transparent: true, opacity: 0.9, depthWrite: false }));
reticle.rotation.x = -Math.PI/2; reticle.position.y = 0.03; reticle.visible = false;
scene.add(reticle);
/* attitude ghost: previews the slammer's tilt above the reticle during aim */
var ghost = new THREE.Mesh(
  new THREE.CylinderGeometry(0.5, 0.5, 0.07, 20),
  new THREE.MeshBasicMaterial({ color: 0xf5b93d, transparent: true, opacity: 0.3, depthWrite: false }));
ghost.visible = false;
scene.add(ghost);

/* ---------- viewport + camera rig ----------
   Close play, wide world (vision §9): the camera frames the live pot
   cluster, not the arena; the world lives in the backdrop. A user
   gesture layer (pinch dolly / twist yaw / drag pan) composes on top
   of the cinematic sway/follow/punch/shake. Pitch is clamped. */
var camShake = 0, camPunch = 0, camBaseD = 14;
var CAM_EL = 36 * Math.PI / 180;
var camT = new THREE.Vector3(0, 0, 0), _camV = new THREE.Vector3();
var camAspect = { vHalf: 0.48, hHalf: 0.24 };
var uYaw = 0, uZoom = 1, uPanX = 0, uPanZ = 0;   /* the user layer */
var camHoming = false, rivalHomeAt = 0;
function sizeNow(){
  var w = el('gl').clientWidth || window.innerWidth;
  var h = el('gl').clientHeight || window.innerHeight;
  var cw = renderer.domElement.width, ch = renderer.domElement.height;
  if (Math.abs(w - cw) <= 1 && Math.abs(h - ch) <= 1) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / Math.max(1, h);
  camera.updateProjectionMatrix();
  fitCamera();
}
function fitCamera(){
  camAspect.vHalf = camera.fov * Math.PI / 360;
  camAspect.hHalf = Math.atan(Math.tan(camAspect.vHalf) * camera.aspect);
}
/* the live cluster: every uncaptured chip, the slammer, the toss coin */
function clusterFit(){
  var pts = [];
  if (M) M.pot.forEach(function(t){ if (!t.captured) pts.push(t.mesh.position); });
  if (slammer) pts.push(slammer.mesh.position);
  if (coin) pts.push(coin.mesh.position);
  if (!pts.length) return { x: 0, z: 0, r: 4.2 };
  var cx = 0, cz = 0;
  pts.forEach(function(p){ cx += p.x; cz += p.z; });
  cx /= pts.length; cz /= pts.length;
  var r = 1.6;
  pts.forEach(function(p){ r = Math.max(r, hdist(p.x, p.z, cx, cz) + 1.1); });
  return { x: cx, z: cz, r: Math.min(r, 4.8) };
}
function placeCamera(tms){
  var az = Math.sin(tms * 0.00022) * 0.05 + uYaw;
  var d = camBaseD * uZoom - camPunch;
  var tx = camT.x + uPanX, tz = camT.z + uPanZ;
  camera.position.set(
    tx + d * Math.cos(CAM_EL) * Math.sin(az),
    d * Math.sin(CAM_EL),
    tz + d * Math.cos(CAM_EL) * Math.cos(az));
  camera.position.x += rnd(-camShake, camShake) * 0.35;
  camera.position.y += rnd(-camShake, camShake) * 0.35;
  camera.lookAt(tx, 0.15, tz);
}
var rszTimer = null;
window.addEventListener('resize', function(){
  clearTimeout(rszTimer); rszTimer = setTimeout(sizeNow, 150);
});
[250, 750, 1500, 3000].forEach(function(ms){ setTimeout(sizeNow, ms); });
sizeNow();
el('gl').addEventListener('webglcontextlost', function(ev){
  ev.preventDefault(); mark('ctx-lost');
  showErr('Graphics context lost — tap to restart.');
  window.addEventListener('pointerdown', function(){ location.reload(); }, { once: true });
});

