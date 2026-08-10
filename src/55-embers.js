/* ================================================================
   BURN FX — Tournament Grip re-entry. A gripped throw comes down hot;
   a perfect release burns up in the atmosphere. Zero assets: one
   ember point-pool, one flame cone, emissive heat on the slammer.
   ================================================================ */
var EMBER_N = 64;
var emberGeo = new THREE.BufferGeometry();
var emberPos = new Float32Array(EMBER_N * 3);
var emberVel = [], emberLife = new Float32Array(EMBER_N);
for (var _ei = 0; _ei < EMBER_N; _ei++){
  emberPos[_ei * 3 + 1] = -50;
  emberVel.push(new THREE.Vector3());
}
emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPos, 3));
var emberTex = (function(){
  var cv = document.createElement('canvas'); cv.width = cv.height = 32;
  var c = cv.getContext('2d');
  var g = c.createRadialGradient(16, 16, 1, 16, 16, 15);
  g.addColorStop(0, 'rgba(255,240,200,1)');
  g.addColorStop(0.4, 'rgba(255,150,50,0.8)');
  g.addColorStop(1, 'rgba(255,80,20,0)');
  c.fillStyle = g; c.fillRect(0, 0, 32, 32);
  var t = new THREE.CanvasTexture(cv);
  t.minFilter = THREE.LinearFilter; t.generateMipmaps = false;
  return t;
})();
var embers = new THREE.Points(emberGeo, new THREE.PointsMaterial({
  map: emberTex, size: 0.26, transparent: true, depthWrite: false,
  blending: THREE.AdditiveBlending, color: 0xffb060, sizeAttenuation: true }));
embers.frustumCulled = false;
scene.add(embers);
var emberCursor = 0;
function spawnEmber(x, y, z, spread, vy){
  var i = emberCursor; emberCursor = (emberCursor + 1) % EMBER_N;
  emberPos[i * 3] = x + rnd(-spread, spread);
  emberPos[i * 3 + 1] = y + rnd(-spread, spread);
  emberPos[i * 3 + 2] = z + rnd(-spread, spread);
  emberVel[i].set(rnd(-1.2, 1.2), vy + rnd(-0.5, 1.5), rnd(-1.2, 1.2));
  emberLife[i] = rnd(0.35, 0.7);
}
function emberBurst(x, y, z, n, speed){
  for (var k = 0; k < n; k++){
    var i = emberCursor; emberCursor = (emberCursor + 1) % EMBER_N;
    var a = rnd(0, 6.28);
    emberPos[i * 3] = x;
    emberPos[i * 3 + 1] = y + 0.1;
    emberPos[i * 3 + 2] = z;
    emberVel[i].set(Math.cos(a) * rnd(1, speed), rnd(1, speed * 0.8), Math.sin(a) * rnd(1, speed));
    emberLife[i] = rnd(0.3, 0.8);
  }
}
function updateEmbers(dt){
  var any = false;
  for (var i = 0; i < EMBER_N; i++){
    if (emberLife[i] <= 0) continue;
    any = true;
    emberLife[i] -= dt;
    if (emberLife[i] <= 0){ emberPos[i * 3 + 1] = -50; continue; }
    emberVel[i].y -= 6 * dt;
    emberPos[i * 3] += emberVel[i].x * dt;
    emberPos[i * 3 + 1] += emberVel[i].y * dt;
    emberPos[i * 3 + 2] += emberVel[i].z * dt;
    if (emberPos[i * 3 + 1] < 0.03){ emberPos[i * 3 + 1] = 0.03; emberVel[i].y *= -0.3; }
  }
  if (any) emberGeo.attributes.position.needsUpdate = true;
}

/* the flame trail for a WHITE HOT drop — comet tail streaming up */
var burnFlame = new THREE.Mesh(
  new THREE.ConeGeometry(0.55, 1.9, 10, 1, true),
  new THREE.MeshBasicMaterial({ color: 0xff8a30, transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
burnFlame.visible = false;
scene.add(burnFlame);

/* emissive heat on the slammer's own materials */
function setBodyHeat(s, k){
  var mats = s.mesh.material;
  if (!mats || !mats.length) return;
  for (var i = 0; i < mats.length; i++){
    if (mats[i].emissive) mats[i].emissive.setRGB(k, k * 0.38, k * 0.08);
  }
}
function sfxReentry(){
  tone(70, 0.6, 'sawtooth', 0.12, 38);
  setTimeout(function(){ tone(1900 + Math.random() * 600, 0.03, 'square', 0.03); }, 120);
  setTimeout(function(){ tone(1600 + Math.random() * 600, 0.03, 'square', 0.03); }, 260);
  setTimeout(function(){ tone(2100 + Math.random() * 500, 0.03, 'square', 0.025); }, 400);
}
function sfxSizzle(){
  tone(1800, 0.25, 'sawtooth', 0.05, 280);
  tone(120, 0.3, 'sine', 0.12, 40);
}
