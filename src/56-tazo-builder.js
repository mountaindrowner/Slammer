/* ================================================================
   TAZO BUILDER — grid string -> canvas texture -> cylinder mesh
   ================================================================ */
var texCache = {}, urlCache = {};
function roundRectPath(c, x, y, w, h, r){
  r = Math.min(r, w/2, h/2);
  c.beginPath(); c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
function drawLayer(c, S, L){
  var s = S / 100;
  c.save();
  switch (L.t){
    case 'dot':
      c.fillStyle = L.col; c.beginPath(); c.arc(L.x*s, L.y*s, L.r*s, 0, 6.2832); c.fill(); break;
    case 'ring':
      c.strokeStyle = L.col; c.lineWidth = L.w*s;
      c.beginPath(); c.arc(L.x*s, L.y*s, L.r*s, 0, 6.2832); c.stroke(); break;
    case 'ell':
      c.translate(L.x*s, L.y*s); c.rotate(L.rot || 0);
      c.fillStyle = L.col; c.beginPath(); c.ellipse(0, 0, L.rx*s, L.ry*s, 0, 0, 6.2832); c.fill(); break;
    case 'arc':
      c.strokeStyle = L.col; c.lineWidth = L.w*s; c.lineCap = 'round';
      c.beginPath(); c.arc(L.x*s, L.y*s, L.r*s, L.a0, L.a1); c.stroke(); break;
    case 'line':
      c.strokeStyle = L.col; c.lineWidth = L.w*s; c.lineCap = 'round';
      c.beginPath(); c.moveTo(L.x0*s, L.y0*s); c.lineTo(L.x1*s, L.y1*s); c.stroke(); break;
    case 'rect':
      c.translate((L.x + L.w/2)*s, (L.y + L.h/2)*s); c.rotate(L.rot || 0);
      roundRectPath(c, -L.w/2*s, -L.h/2*s, L.w*s, L.h*s, (L.rr || 0)*s);
      c.fillStyle = L.col; c.fill();
      if (L.str){ c.strokeStyle = L.str; c.lineWidth = (L.sw || 2)*s; c.stroke(); } break;
    case 'poly':
      c.beginPath();
      L.pts.forEach(function(p, i){ i ? c.lineTo(p[0]*s, p[1]*s) : c.moveTo(p[0]*s, p[1]*s); });
      c.closePath();
      if (L.col){ c.fillStyle = L.col; c.fill(); }
      if (L.str){ c.strokeStyle = L.str; c.lineWidth = (L.sw || 2)*s; c.stroke(); } break;
    case 'star':
      c.translate(L.x*s, L.y*s); c.rotate(L.rot || 0); c.beginPath();
      for (var i = 0; i < L.n*2; i++){
        var r = (i % 2 ? L.r2 : L.r1)*s, a = i * Math.PI / L.n - Math.PI/2;
        i ? c.lineTo(Math.cos(a)*r, Math.sin(a)*r) : c.moveTo(Math.cos(a)*r, Math.sin(a)*r);
      }
      c.closePath(); c.fillStyle = L.col; c.fill(); break;
    case 'wedge':
      c.fillStyle = L.col; c.beginPath(); c.moveTo(L.x*s, L.y*s);
      c.arc(L.x*s, L.y*s, L.r*s, L.a0, L.a1); c.closePath(); c.fill(); break;
  }
  c.restore();
}
function paintDesign(key){
  if (texCache[key]) return texCache[key];
  var d = DESIGNS[key], S = 256, cv = document.createElement('canvas');
  cv.width = cv.height = S;
  var c = cv.getContext('2d');
  var g = c.createRadialGradient(S*0.42, S*0.38, S*0.08, S/2, S/2, S*0.64);
  g.addColorStop(0, d.bg[0]); g.addColorStop(1, d.bg[1]);
  c.fillStyle = g; c.fillRect(0, 0, S, S);
  (d.art || []).forEach(function(L){ drawLayer(c, S, L); });
  /* printed-cap finish: paper grain, worn edge, gloss crescent */
  for (var i = 0; i < 260; i++){
    c.fillStyle = 'rgba(' + (Math.random() < 0.5 ? '0,0,0' : '255,255,255') + ',' + (0.02 + Math.random()*0.05).toFixed(3) + ')';
    c.fillRect(Math.random()*S, Math.random()*S, 2, 2);
  }
  if (d.rarity !== 'face'){
    c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = S*0.07;
    c.beginPath(); c.arc(S/2, S/2, S*0.485, 0, 6.2832); c.stroke();
    /* embossed inset ring: the face sits recessed in a solid puck */
    c.strokeStyle = 'rgba(0,0,0,0.32)'; c.lineWidth = S*0.014;
    c.beginPath(); c.arc(S/2, S/2, S*0.425, 0, 6.2832); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.14)'; c.lineWidth = S*0.01;
    c.beginPath(); c.arc(S/2, S/2, S*0.443, 0, 6.2832); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.2)'; c.lineWidth = S*0.045; c.lineCap = 'round';
    c.beginPath(); c.arc(S/2, S/2, S*0.4, -2.5, -1.35); c.stroke();
  }
  var tex = new THREE.CanvasTexture(cv);
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  texCache[key] = tex;
  cvCache[key] = cv;
  urlCache[key] = cv.toDataURL();
  return tex;
}
var cvCache = {};
function designURL(key){ paintDesign(key); return urlCache[key]; }
function shade(hex, f){
  var n = parseInt(hex.slice(1), 16);
  var r = Math.min(255, Math.round(((n >> 16) & 255) * f));
  var g = Math.min(255, Math.round(((n >> 8) & 255) * f));
  var b = Math.min(255, Math.round((n & 255) * f));
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}
/* rim: casino-chip edge spots + laminated layers + chamfer shading */
var rimCache = {};
function paintRim(key){
  if (rimCache[key]) return rimCache[key];
  var d = DESIGNS[key], W = 512, H = 64;
  var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  var c = cv.getContext('2d');
  c.fillStyle = shade(d.bg[1], 0.72); c.fillRect(0, 0, W, H);
  c.fillStyle = shade(d.bg[0], 1.12);
  for (var i = 0; i < 8; i++) c.fillRect(i * 64 + 18, 0, 28, H);
  c.fillStyle = 'rgba(0,0,0,0.22)';
  [15, 27, 39, 51].forEach(function(y){ c.fillRect(0, y, W, 2); });
  for (var j = 0; j < 260; j++){
    c.fillStyle = 'rgba(' + (Math.random() < 0.5 ? '0,0,0' : '255,255,255') + ',' + (0.02 + Math.random()*0.05).toFixed(3) + ')';
    c.fillRect(Math.random()*W, Math.random()*H, 2, 2);
  }
  var gt = c.createLinearGradient(0, 0, 0, 12);
  gt.addColorStop(0, 'rgba(255,246,230,0.3)'); gt.addColorStop(1, 'rgba(255,246,230,0)');
  c.fillStyle = gt; c.fillRect(0, 0, W, 12);
  var gb = c.createLinearGradient(0, H, 0, H - 14);
  gb.addColorStop(0, 'rgba(0,0,0,0.5)'); gb.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = gb; c.fillRect(0, H - 14, W, 14);
  var tex = new THREE.CanvasTexture(cv);
  tex.wrapS = THREE.RepeatWrapping; tex.repeat.set(2, 1);
  tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
  rimCache[key] = tex;
  return tex;
}
function makeDisc(key, radius, height){
  var geo = new THREE.CylinderGeometry(radius, radius, height, 28);
  var face = new THREE.MeshPhongMaterial({ map: paintDesign(key), shininess: 42, specular: 0x554433 });
  var back = new THREE.MeshPhongMaterial({ map: paintDesign('back'), shininess: 42, specular: 0x554433 });
  var rim = new THREE.MeshPhongMaterial({ map: paintRim(key), shininess: 26, specular: 0x40352a });
  return new THREE.Mesh(geo, [rim, face, back]);
}

/* blob shadows — the cheap depth cue (no shadow maps in mobile webviews) */
var shadowTex = (function(){
  var cv = document.createElement('canvas'); cv.width = cv.height = 64;
  var c = cv.getContext('2d');
  var g = c.createRadialGradient(32, 32, 4, 32, 32, 30);
  g.addColorStop(0, 'rgba(5,0,15,0.55)'); g.addColorStop(1, 'rgba(5,0,15,0)');
  c.fillStyle = g; c.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(cv);
})();
var shadowN = 0;
function makeShadow(r){
  var m = new THREE.Mesh(
    new THREE.PlaneGeometry(r * 2.6, r * 2.6),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI/2;
  m.position.y = 0.012 + (shadowN++ % 24) * 0.0016; /* stagger so stacked shadows don't z-fight */
  scene.add(m);
  return m;
}
function syncShadow(sh, p){
  sh.position.x = p.x; sh.position.z = p.z;
  var h = Math.max(0, p.y), s = 1 + h * 0.16;
  sh.scale.set(s, s, 1);
  sh.material.opacity = clamp(1.1 / (1 + h * 0.7), 0.12, 1);
}
function dropShadow(o){ if (o.shadow){ scene.remove(o.shadow); o.shadow = null; } }

/* low-poly rival bust — leans into frame across the court on his turn */
var bustLean = 0, bustTarget = 0, bustBob = 0, bustRecoil = 0;
function makeBust(r){
  var g = new THREE.Group(), B = r.bust;
  function part(parent, w, h, d2, col, x, y, z, ry){
    var m = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d2),
      new THREE.MeshPhongMaterial({ color: col, flatShading: true, shininess: 14 }));
    m.position.set(x, y, z); if (ry) m.rotation.y = ry;
    parent.add(m); return m;
  }
  function glow(parent, w, h, d2, col, x, y, z){
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d2),
      new THREE.MeshBasicMaterial({ color: col }));
    m.position.set(x, y, z);
    parent.add(m); return m;
  }
  part(g, 2.0, 0.85, 0.8, B.jacket, 0, 0.42, 0);       /* shoulders */
  part(g, 1.0, 1.05, 0.95, B.skin, 0, 1.35, 0);        /* head */
  if (B.style !== 'machine'){
    part(g, 0.22, 0.3, 0.2, B.skin, 0, 1.2, 0.52);     /* nose */
    part(g, 0.42, 0.09, 0.06, B.style === 'alien' ? 0x0c1808 : 0x8d4a3a, 0, 0.98, 0.5);
  }
  if (B.style === 'shades'){
    part(g, 0.88, 0.24, 0.1, 0x14100c, 0, 1.5, 0.52);
    part(g, 0.94, 0.05, 0.06, 0xc8a838, 0, 1.63, 0.52);
    part(g, 1.12, 0.4, 1.05, B.cap, 0, 2.0, 0);        /* blond mop */
    part(g, 1.12, 0.3, 0.16, B.cap, 0, 1.82, 0.5);
  } else if (B.style === 'tie'){
    /* the suits: flat hair, collar, tie — school, mob, or state */
    part(g, 0.17, 0.2, 0.06, 0x1c140c, -0.24, 1.5, 0.52);
    part(g, 0.17, 0.2, 0.06, 0x1c140c, 0.24, 1.5, 0.52);
    part(g, 1.06, 0.28, 1.0, B.cap, 0, 1.96, 0);
    part(g, 0.52, 0.16, 0.12, 0xe9e2f0, 0, 0.8, 0.42);
    part(g, 0.2, 0.5, 0.08, B.tie || 0xc0202c, 0, 0.52, 0.44);
  } else if (B.style === 'alien'){
    /* big wraparound eyes, antennae — crown optional */
    part(g, 0.3, 0.42, 0.1, 0x0c1808, -0.26, 1.44, 0.5);
    part(g, 0.3, 0.42, 0.1, 0x0c1808, 0.26, 1.44, 0.5);
    part(g, 0.05, 0.5, 0.05, B.cap, -0.3, 2.05, 0);
    glow(g, 0.13, 0.13, 0.13, 0xd9ff5e, -0.3, 2.34, 0);
    part(g, 0.05, 0.5, 0.05, B.cap, 0.3, 2.05, 0);
    glow(g, 0.13, 0.13, 0.13, 0xd9ff5e, 0.3, 2.34, 0);
    if (B.crown){
      part(g, 1.08, 0.16, 1.0, 0xe0bd4e, 0, 1.94, 0);
      part(g, 0.16, 0.3, 0.16, 0xe0bd4e, -0.34, 2.1, 0);
      part(g, 0.16, 0.4, 0.16, 0xe0bd4e, 0, 2.14, 0);
      part(g, 0.16, 0.3, 0.16, 0xe0bd4e, 0.34, 2.1, 0);
    }
  } else if (B.style === 'machine'){
    /* the finale: eye bar, grille, antenna, shoulder stacks */
    glow(g, 0.72, 0.16, 0.08, 0xff4b3d, 0, 1.46, 0.5);
    part(g, 0.6, 0.12, 0.08, 0x3c4654, 0, 1.0, 0.5);
    part(g, 0.06, 0.5, 0.06, 0x55677d, 0, 2.1, 0);
    glow(g, 0.13, 0.13, 0.13, 0xff4b3d, 0, 2.4, 0);
    part(g, 0.26, 0.55, 0.26, 0x55677d, -0.85, 0.92, 0);
    part(g, 0.26, 0.55, 0.26, 0x55677d, 0.85, 0.92, 0);
  } else {
    part(g, 0.17, 0.2, 0.06, 0x1c140c, -0.24, 1.5, 0.52);
    part(g, 0.17, 0.2, 0.06, 0x1c140c, 0.24, 1.5, 0.52);
    var hat = new THREE.Group();
    part(hat, 1.08, 0.42, 1.02, B.cap, 0, 1.98, 0);    /* cap crown */
    part(hat, 0.9, 0.1, 0.6, B.cap, 0, 1.82, 0.72);    /* brim */
    if (B.style === 'side') hat.rotation.y = 1.05;
    if (B.style === 'back') hat.rotation.y = Math.PI;  /* worn backwards */
    g.add(hat);
  }
  g.scale.set(1.5, 1.5, 1.5);
  g.position.set(0, -3.2, -(TUNE.ARENA_R + 2.5));
  scene.add(g);
  return g;
}


/* ================================================================
   FINISHES (vision §8) — instance data on the binder entry, resolved
   to material tweaks / texture variants here. 11 total:
   HOLO, STATIC, SURVIVOR (wear), METAL, GLOW, MAGIC MOTION, POP-UP,
   WET INK, X-RAY, INFINITY, MISPRINT.
   ================================================================ */
var finishTexCache = {};
function finishTex(key, kind){
  var ck = key + ':' + kind;
  if (finishTexCache[ck]) return finishTexCache[ck];
  paintDesign(key);                      /* ensure the base canvas exists */
  var base = cvCache[key], S = base.width;
  var cv = document.createElement('canvas'); cv.width = cv.height = S;
  var c = cv.getContext('2d');
  if (kind === 'xray'){
    /* the back tells the truth, in negative */
    c.drawImage(base, 0, 0);
    c.globalCompositeOperation = 'difference';
    c.fillStyle = '#fff'; c.fillRect(0, 0, S, S);
  } else if (kind === 'wetink'){
    /* pulled from the press too soon */
    c.drawImage(base, 0, 0);
    c.globalAlpha = 0.4;
    c.drawImage(base, 7, 5);
    c.globalAlpha = 0.22;
    c.drawImage(base, -5, 9);
  } else if (kind === 'misprint'){
    /* the plates never lined up */
    c.drawImage(base, 0, 0);
    c.globalCompositeOperation = 'screen';
    c.globalAlpha = 0.5;
    c.drawImage(base, 6, 2);
    c.globalAlpha = 0.35;
    c.drawImage(base, -6, -2);
  } else if (kind === 'motion'){
    /* frame B of the lenticular: the world, mirrored */
    c.translate(S, 0); c.scale(-1, 1);
    c.drawImage(base, 0, 0);
  }
  var t = new THREE.CanvasTexture(cv);
  t.minFilter = THREE.LinearFilter; t.generateMipmaps = false;
  finishTexCache[ck] = t;
  return t;
}
/* pot-chip hook: applied once at match setup (materials are per-disc) */
function applyFinish(t){
  var f = t.finish, m = t.mesh.material;
  if (!f) return;
  if (f === 'metal'){
    m[1].shininess = 95; m[1].specular = new THREE.Color(0xdfe8f2);
    m[0].shininess = 80; m[0].specular = new THREE.Color(0xbcc8d4);
  } else if (f === 'glow'){
    m[1].emissive = new THREE.Color(0x1c4a34);
  } else if (f === 'xray'){
    m[2].map = finishTex(t.key, 'xray'); m[2].needsUpdate = true;
  } else if (f === 'wetink'){
    m[1].map = finishTex(t.key, 'wetink'); m[1].needsUpdate = true;
  } else if (f === 'misprint'){
    m[1].map = finishTex(t.key, 'misprint'); m[1].needsUpdate = true;
  } else if (f === 'motion'){
    t.motionA = m[1].map;
    t.motionB = finishTex(t.key, 'motion');
  } else if (f === 'popup'){
    /* the art floats off the cap — child plane, real parallax */
    var pp = new THREE.Mesh(
      new THREE.CircleGeometry(t.bR * 0.62, 20),
      new THREE.MeshBasicMaterial({ map: paintDesign(t.key), transparent: true,
        opacity: 0.95, depthWrite: false }));
    pp.rotation.x = -Math.PI / 2;
    pp.position.y = t.bH / 2 + 0.05;
    t.mesh.add(pp);
  } else if (f === 'infinity'){
    m[1].emissive = new THREE.Color(0x30104a);   /* pulsed in the loop */
    var ir = new THREE.Mesh(
      new THREE.RingGeometry(t.bR * 0.72, t.bR * 0.82, 22),
      new THREE.MeshBasicMaterial({ color: 0xb14aed, transparent: true, opacity: 0.7,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    ir.rotation.x = -Math.PI / 2;
    ir.position.y = t.bH / 2 + 0.015;
    t.mesh.add(ir);
  }
  /* holo + static resolve in the main loop / settle pipeline */
}

/* ---------- finishes (vision §8): STATIC + HOLO support ---------- */
var staticTex = (function(){
  var cv = document.createElement('canvas'); cv.width = cv.height = 64;
  var c = cv.getContext('2d');
  var img = c.createImageData(64, 64);
  for (var i = 0; i < img.data.length; i += 4){
    var v = 40 + Math.random() * 190;
    img.data[i] = img.data[i+1] = img.data[i+2] = v;
    img.data[i+3] = 255;
  }
  c.putImageData(img, 0, 0);
  var t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.minFilter = THREE.NearestFilter; t.magFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  return t;
})();
/* the face is snow until the chip comes to rest — ties into the settle rule */
function staticize(t){
  if (!t.realMap) t.realMap = t.mesh.material[1].map;
  t.mesh.material[1].map = staticTex;
  t.mesh.material[1].needsUpdate = true;
}
function destaticize(t){
  if (t.realMap && t.mesh.material[1].map !== t.realMap){
    t.mesh.material[1].map = t.realMap;
    t.mesh.material[1].needsUpdate = true;
  }
}
