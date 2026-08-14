/* ================================================================
   VENUE — THE DRIVEWAY (the first venue, built to the corner-store
   standard). Surface: the chalk court on the asphalt. Midground:
   picket venueFence, parked car, sprinkler. Backdrop: the cul-de-sac at
   dusk, painted onto two billboard cylinders (2 draw calls, parallax
   from real depth, no fog — CLAUDE.md budget holds).
   Signature: THE DOG behind the venueFence — barks at whoopees.
   ================================================================ */
function venuePanoTex(w, h, paint){
  var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  paint(cv.getContext('2d'), w, h);
  var t = new THREE.CanvasTexture(cv);
  t.minFilter = THREE.LinearFilter; t.generateMipmaps = false;
  t.wrapS = THREE.RepeatWrapping;
  return t;
}
/* the ground beyond the court — unlit near-black so the world has a floor */
var venueGround = new THREE.Mesh(
  new THREE.CircleGeometry(45, 24),
  new THREE.MeshBasicMaterial({ color: 0x0a0712 }));
venueGround.rotation.x = -Math.PI / 2;
venueGround.position.y = -0.02;
scene.add(venueGround);

/* far ring: dusk sky, stars, distant rooftops */
var skyRing = new THREE.Mesh(
  new THREE.CylinderGeometry(58, 58, 34, 24, 1, true),
  new THREE.MeshBasicMaterial({ side: THREE.BackSide, map: venuePanoTex(1024, 256, function(c, w, h){
    var g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#05040a'); g.addColorStop(0.55, '#131024');
    g.addColorStop(0.78, '#2a1836'); g.addColorStop(0.9, '#3d1f2e'); g.addColorStop(1, '#0d0a15');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    for (var i = 0; i < 90; i++){
      c.fillStyle = 'rgba(255,255,255,' + rnd(0.06, 0.4).toFixed(2) + ')';
      c.fillRect(rnd(0, w), rnd(0, h * 0.5), 1.5, 1.5);
    }
    /* distant rooftop silhouettes, pre-darkened into the sky */
    c.fillStyle = '#0a0712';
    var x = 0;
    while (x < w){
      var bw = rnd(30, 90), bh = rnd(12, 40);
      c.fillRect(x, h - bh, bw + 1, bh);
      x += bw;
    }
  }) }));
skyRing.position.y = 12;
scene.add(skyRing);

/* near ring: the cul-de-sac — houses with lit windows, trees */
var houseRing = new THREE.Mesh(
  new THREE.CylinderGeometry(26, 26, 15, 24, 1, true),
  new THREE.MeshBasicMaterial({ side: THREE.BackSide, transparent: true, depthWrite: false,
    map: venuePanoTex(1024, 256, function(c, w, h){
    /* transparent above; houses along the bottom */
    var x = 0;
    while (x < w){
      var hw = rnd(70, 130), hh = rnd(60, 100), gap = rnd(18, 60);
      var hx = x, hy = h - hh;
      c.fillStyle = '#151021';
      c.fillRect(hx, hy, hw, hh);
      /* roof */
      c.beginPath();
      c.moveTo(hx - 6, hy); c.lineTo(hx + hw / 2, hy - rnd(18, 30)); c.lineTo(hx + hw + 6, hy);
      c.closePath(); c.fillStyle = '#100c19'; c.fill();
      /* lit windows */
      var rows = 2, cols = Math.max(2, Math.floor(hw / 34));
      for (var r = 0; r < rows; r++) for (var k = 0; k < cols; k++){
        if (Math.random() < 0.45) continue;
        c.fillStyle = Math.random() < 0.8 ? 'rgba(255,180,92,0.9)' : 'rgba(160,220,255,0.75)';
        c.fillRect(hx + 8 + k * (hw - 16) / cols, hy + 12 + r * (hh - 24) / rows, 10, 13);
      }
      x += hw + gap;
      /* a tree in some gaps */
      if (gap > 34 && Math.random() < 0.7){
        c.fillStyle = '#0c0a14';
        c.beginPath(); c.arc(x - gap / 2, h - rnd(50, 70), rnd(20, 30), 0, 6.3); c.fill();
        c.fillRect(x - gap / 2 - 3, h - 40, 6, 40);
      }
    }
  }) }));
houseRing.position.y = 5.2;
scene.add(houseRing);

/* picket venueFence: one baked plane behind the rival's side */
var venueFence = new THREE.Mesh(
  new THREE.PlaneGeometry(19, 1.5),
  new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false,
    map: venuePanoTex(512, 40, function(c, w, h){
    for (var x = 0; x < w; x += 14){
      c.fillStyle = '#241b2e';
      c.fillRect(x, 6, 9, h - 6);
      c.beginPath(); c.moveTo(x, 8); c.lineTo(x + 4.5, 0); c.lineTo(x + 9, 8); c.closePath(); c.fill();
    }
    c.fillStyle = '#1c1526';
    c.fillRect(0, 12, w, 4); c.fillRect(0, 26, w, 4);
  }) }));
venueFence.position.set(0, 0.72, -7.6);
scene.add(venueFence);

/* the parked car (low-poly, cheap) */
prop(new THREE.BoxGeometry(2.6, 0.55, 1.1), 0x1b2735, -6.8, 0.34, -3.4, 0.35);
prop(new THREE.BoxGeometry(1.4, 0.45, 1.0), 0x141c28, -6.9, 0.82, -3.4, 0.35);

/* the sprinkler (ticks quietly while you line up a shot) */
prop(new THREE.CylinderGeometry(0.07, 0.09, 0.22, 8), 0x2a3440, 5.4, 0.11, 2.6);

/* THE DOG — behind the venueFence, loses its mind at whoopees */
var venueDog = new THREE.Group();
(function(){
  function dpart(w, h, d, x, y, z){
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d),
      new THREE.MeshBasicMaterial({ color: 0x17121f }));
    m.position.set(x, y, z);
    venueDog.add(m);
  }
  dpart(0.55, 0.3, 0.24, 0, 0.44, 0);       /* body */
  dpart(0.26, 0.26, 0.22, 0.34, 0.62, 0);    /* head */
  dpart(0.1, 0.14, 0.08, 0.42, 0.82, 0);     /* ear */
  dpart(0.06, 0.22, 0.06, -0.32, 0.6, 0);    /* tail */
})();
venueDog.position.set(2.6, 0, -7.95);
scene.add(venueDog);
var dogBarkT = 0;
function venueDogBark(){
  dogBarkT = 1;
  sfxDog();
}
function sfxDog(){
  tone(700, 0.08, 'square', 0.09, 420);
  setTimeout(function(){ tone(760, 0.09, 'square', 0.09, 430); }, 170);
}
