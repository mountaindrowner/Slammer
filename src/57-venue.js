/* ================================================================
   VENUES — parameterized backdrops built to the corner-store standard.
   Two billboard cylinders (sky + horizon = 2 draw calls, parallax from
   real depth, no fog), toggleable midground props, tinted lamp.
   applyVenue(key) repaints the world between matches. The streetlight
   itself never changes — it follows you all the way to space.
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

/* far ring (sky) + near ring (horizon) — maps assigned by applyVenue */
var skyRing = new THREE.Mesh(
  new THREE.CylinderGeometry(58, 58, 34, 24, 1, true),
  new THREE.MeshBasicMaterial({ side: THREE.BackSide }));
skyRing.position.y = 12;
scene.add(skyRing);
var houseRing = new THREE.Mesh(
  new THREE.CylinderGeometry(26, 26, 15, 24, 1, true),
  new THREE.MeshBasicMaterial({ side: THREE.BackSide, transparent: true, depthWrite: false }));
houseRing.position.y = 5.2;
scene.add(houseRing);

/* ---------- sky painters ---------- */
var SKY_PAINT = {
  dusk: function(c, w, h){
    var g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#05040a'); g.addColorStop(0.55, '#131024');
    g.addColorStop(0.78, '#2a1836'); g.addColorStop(0.9, '#3d1f2e'); g.addColorStop(1, '#0d0a15');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    for (var i = 0; i < 90; i++){
      c.fillStyle = 'rgba(255,255,255,' + rnd(0.06, 0.4).toFixed(2) + ')';
      c.fillRect(rnd(0, w), rnd(0, h * 0.5), 1.5, 1.5);
    }
    c.fillStyle = '#0a0712';
    var x = 0;
    while (x < w){ var bw = rnd(30, 90), bh = rnd(12, 40); c.fillRect(x, h - bh, bw + 1, bh); x += bw; }
  },
  night: function(c, w, h){
    var g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#03030c'); g.addColorStop(0.7, '#0c1024'); g.addColorStop(1, '#0a0a18');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    for (var i = 0; i < 150; i++){
      c.fillStyle = 'rgba(255,255,255,' + rnd(0.08, 0.5).toFixed(2) + ')';
      c.fillRect(rnd(0, w), rnd(0, h * 0.7), 1.5, 1.5);
    }
    /* the moon, mostly shadow */
    c.fillStyle = '#e8e4d8'; c.beginPath(); c.arc(760, 52, 17, 0, 6.3); c.fill();
    c.fillStyle = '#0a0c1c'; c.beginPath(); c.arc(752, 47, 15, 0, 6.3); c.fill();
  },
  space: function(c, w, h){
    c.fillStyle = '#020208'; c.fillRect(0, 0, w, h);
    for (var i = 0; i < 240; i++){
      c.fillStyle = 'rgba(255,255,255,' + rnd(0.1, 0.7).toFixed(2) + ')';
      c.fillRect(rnd(0, w), rnd(0, h), rnd(1, 2.2), rnd(1, 2.2));
    }
    /* nebula wisps */
    var n1 = c.createRadialGradient(300, 90, 8, 300, 90, 130);
    n1.addColorStop(0, 'rgba(154,90,224,0.16)'); n1.addColorStop(1, 'rgba(154,90,224,0)');
    c.fillStyle = n1; c.fillRect(0, 0, w, h);
    var n2 = c.createRadialGradient(700, 150, 8, 700, 150, 110);
    n2.addColorStop(0, 'rgba(63,191,168,0.13)'); n2.addColorStop(1, 'rgba(63,191,168,0)');
    c.fillStyle = n2; c.fillRect(0, 0, w, h);
    /* the ringed planet */
    c.fillStyle = '#c78a4e'; c.beginPath(); c.arc(520, 70, 20, 0, 6.3); c.fill();
    c.fillStyle = 'rgba(90,50,20,0.5)'; c.beginPath(); c.arc(514, 64, 17, 0, 6.3); c.fill();
    c.strokeStyle = '#e0bd8e'; c.lineWidth = 3;
    c.beginPath(); c.ellipse(520, 72, 34, 9, -0.3, 0, 6.3); c.stroke();
  },
  inside: function(c, w, h){
    var g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#08060c'); g.addColorStop(0.6, '#100c16'); g.addColorStop(1, '#0c0a12');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    /* ceiling beams, barely there */
    c.strokeStyle = 'rgba(60,54,80,0.35)'; c.lineWidth = 6;
    for (var x = 40; x < w; x += 160){ c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 30, h * 0.35); c.stroke(); }
  }
};

/* ---------- horizon painters (transparent above, world along the bottom) ---------- */
var HOR_PAINT = {
  houses: function(c, w, h){
    var x = 0;
    while (x < w){
      var hw = rnd(70, 130), hh = rnd(60, 100), gap = rnd(18, 60);
      var hx = x, hy = h - hh;
      c.fillStyle = '#151021'; c.fillRect(hx, hy, hw, hh);
      c.beginPath();
      c.moveTo(hx - 6, hy); c.lineTo(hx + hw / 2, hy - rnd(18, 30)); c.lineTo(hx + hw + 6, hy);
      c.closePath(); c.fillStyle = '#100c19'; c.fill();
      var rows = 2, cols = Math.max(2, Math.floor(hw / 34));
      for (var r = 0; r < rows; r++) for (var k = 0; k < cols; k++){
        if (Math.random() < 0.45) continue;
        c.fillStyle = Math.random() < 0.8 ? 'rgba(255,180,92,0.9)' : 'rgba(160,220,255,0.75)';
        c.fillRect(hx + 8 + k * (hw - 16) / cols, hy + 12 + r * (hh - 24) / rows, 10, 13);
      }
      x += hw + gap;
      if (gap > 34 && Math.random() < 0.7){
        c.fillStyle = '#0c0a14';
        c.beginPath(); c.arc(x - gap / 2, h - rnd(50, 70), rnd(20, 30), 0, 6.3); c.fill();
        c.fillRect(x - gap / 2 - 3, h - 40, 6, 40);
      }
    }
  },
  school: function(c, w, h){
    /* one long brick building — the whole horizon is school */
    c.fillStyle = '#1a1119'; c.fillRect(0, h - 92, w, 92);
    c.fillStyle = '#120b12'; c.fillRect(0, h - 100, w, 10);
    for (var x = 20; x < w; x += 60){
      for (var r = 0; r < 2; r++){
        c.fillStyle = Math.random() < 0.3 ? 'rgba(220,240,200,0.8)' : '#0d080d';
        c.fillRect(x, h - 80 + r * 34, 26, 22);
      }
    }
    /* the doors + the flagpole */
    c.fillStyle = '#0d080d'; c.fillRect(480, h - 54, 46, 54);
    c.strokeStyle = '#8d94a2'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(200, h); c.lineTo(200, h - 148); c.stroke();
    c.fillStyle = '#c23a56'; c.fillRect(200, h - 148, 26, 14);
  },
  lot: function(c, w, h){
    /* plank fences, weeds, dead tires, one proud billboard */
    for (var x = 0; x < w; x += 13){
      if (Math.random() < 0.12) continue;   /* missing planks */
      c.fillStyle = '#221a2c'; c.fillRect(x, h - rnd(48, 58), 10, 60);
    }
    c.fillStyle = '#161020'; c.fillRect(0, h - 30, w, 4);
    for (var i = 0; i < 26; i++){
      c.strokeStyle = 'rgba(60,90,50,0.7)'; c.lineWidth = 2;
      var wx = rnd(0, w), wh = rnd(10, 26);
      c.beginPath(); c.moveTo(wx, h); c.lineTo(wx + rnd(-6, 6), h - wh); c.stroke();
    }
    c.strokeStyle = '#1c1826'; c.lineWidth = 5;
    c.beginPath(); c.arc(150, h - 12, 14, 0, 6.3); c.stroke();
    c.beginPath(); c.arc(168, h - 10, 14, 0, 6.3); c.stroke();
    /* billboard */
    c.fillStyle = '#241b30'; c.fillRect(700, h - 150, 150, 74);
    c.fillStyle = '#3d2e50'; c.fillRect(708, h - 142, 134, 58);
    c.font = 'bold 30px "Comic Sans MS", cursive'; c.fillStyle = '#e0bd63';
    c.fillText('SODA!', 730, h - 100);
    c.fillStyle = '#1c1826'; c.fillRect(760, h - 76, 10, 76);
  },
  hall: function(c, w, h){
    /* detention hall: lockers forever, one clock, the trophy case */
    c.fillStyle = '#141018'; c.fillRect(0, h - 110, w, 110);
    for (var x = 0; x < w; x += 27){
      c.fillStyle = '#232c3a'; c.fillRect(x + 2, h - 104, 23, 88);
      c.fillStyle = '#1a2130';
      c.fillRect(x + 6, h - 96, 15, 3); c.fillRect(x + 6, h - 89, 15, 3);
      c.fillStyle = '#0f141e'; c.beginPath(); c.arc(x + 13, h - 62, 3, 0, 6.3); c.fill();
    }
    c.fillStyle = '#0d0a10'; c.fillRect(0, h - 16, w, 16);
    /* clock */
    c.fillStyle = '#d8d2e0'; c.beginPath(); c.arc(370, h - 130, 13, 0, 6.3); c.fill();
    c.strokeStyle = '#161020'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(370, h - 130); c.lineTo(370, h - 140); c.moveTo(370, h - 130); c.lineTo(377, h - 128); c.stroke();
    /* trophy case, faintly gold */
    c.fillStyle = 'rgba(224,189,78,0.18)'; c.fillRect(600, h - 100, 90, 80);
    c.strokeStyle = '#2c2434'; c.lineWidth = 4; c.strokeRect(600, h - 100, 90, 80);
    c.fillStyle = 'rgba(224,189,78,0.8)';
    c.fillRect(618, h - 62, 8, 16); c.fillRect(644, h - 70, 10, 24); c.fillRect(670, h - 58, 7, 12);
  },
  arcade: function(c, w, h){
    /* cabinet row, every screen a different fever dream */
    c.fillStyle = '#0e0a16'; c.fillRect(0, h - 100, w, 100);
    var cols = ['#3fbfa8', '#e0568f', '#b14aed', '#e0bd4e', '#5a8fff'];
    var i = 0;
    for (var x = 10; x < w - 60; x += 74){
      var ch = rnd(72, 92);
      c.fillStyle = '#1a1426'; c.fillRect(x, h - ch, 58, ch);
      c.fillStyle = '#241b36'; c.fillRect(x - 3, h - ch - 8, 64, 12);
      c.fillStyle = cols[i++ % cols.length];
      c.globalAlpha = 0.85; c.fillRect(x + 9, h - ch + 14, 40, 26); c.globalAlpha = 1;
      c.fillStyle = '#100c1c'; c.fillRect(x + 9, h - ch + 48, 40, 10);
    }
    /* neon zigzag over everything */
    c.strokeStyle = 'rgba(177,74,237,0.8)'; c.lineWidth = 4; c.beginPath();
    for (var zx = 0; zx <= w; zx += 64) c.lineTo(zx, h - 106 + (zx / 64 % 2 ? 10 : -10));
    c.stroke();
  },
  felt: function(c, w, h){
    /* the backroom: wood panel, crates, one pink neon promise */
    c.fillStyle = '#171009'; c.fillRect(0, h - 110, w, 110);
    c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 2;
    for (var y = h - 96; y < h; y += 18){ c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    for (var x = 0; x < w; x += 90){ c.beginPath(); c.moveTo(x, h - 110); c.lineTo(x, h); c.stroke(); }
    c.fillStyle = '#1e1610';
    c.fillRect(120, h - 60, 52, 60); c.fillRect(150, h - 96, 44, 40);
    c.fillRect(820, h - 54, 60, 54);
    /* neon: CHIPS */
    c.strokeStyle = '#f06fa8'; c.lineWidth = 3;
    c.strokeRect(470, h - 128, 120, 44);
    c.font = 'bold 28px "Comic Sans MS", cursive';
    c.fillStyle = '#f06fa8'; c.fillText('CHIP$', 488, h - 96);
    c.fillStyle = 'rgba(240,111,168,0.12)'; c.fillRect(455, h - 138, 150, 138);
  },
  cityhall: function(c, w, h){
    /* civic centered: columns, dome, steps — repeated twice around */
    for (var o = 0; o < 2; o++){
      var cx = 100 + o * 512;
      c.fillStyle = '#191426'; c.fillRect(cx, h - 96, 320, 96);
      for (var i = 0; i < 6; i++){
        c.fillStyle = '#262040'; c.fillRect(cx + 22 + i * 50, h - 84, 18, 70);
      }
      c.beginPath(); c.moveTo(cx - 10, h - 96); c.lineTo(cx + 160, h - 136); c.lineTo(cx + 330, h - 96);
      c.closePath(); c.fillStyle = '#221c36'; c.fill();
      c.beginPath(); c.arc(cx + 160, h - 136, 34, Math.PI, 0); c.closePath();
      c.fillStyle = '#2c2444'; c.fill();
      c.fillStyle = 'rgba(255,240,208,0.7)'; c.fillRect(cx + 152, h - 168, 4, 18);
      c.fillStyle = '#141020';
      c.fillRect(cx - 14, h - 14, 348, 6); c.fillRect(cx - 8, h - 24, 336, 5);
    }
  },
  oval: function(c, w, h){
    /* the oval court: white fence, the obelisk, many flags */
    c.fillStyle = '#0e1408'; c.fillRect(0, h - 60, w, 60);
    for (var x = 0; x < w; x += 16){
      c.fillStyle = 'rgba(216,210,224,0.6)'; c.fillRect(x, h - 44, 5, 30);
    }
    c.fillStyle = 'rgba(216,210,224,0.5)'; c.fillRect(0, h - 46, w, 4);
    c.fillStyle = '#c9ccd4';
    c.beginPath(); c.moveTo(500, h - 190); c.lineTo(510, h - 40); c.lineTo(478, h - 40); c.lineTo(488, h - 190);
    c.closePath(); c.fill();
    c.fillStyle = '#8d94a2';
    c.beginPath(); c.moveTo(488, h - 190); c.lineTo(494, h - 208); c.lineTo(500, h - 190); c.closePath(); c.fill();
    for (var f = 0; f < 5; f++){
      var fx = 120 + f * 190;
      c.strokeStyle = '#8d94a2'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(fx, h - 40); c.lineTo(fx, h - 110); c.stroke();
      c.fillStyle = f % 2 ? '#c0202c' : '#2b4bd4'; c.fillRect(fx, h - 110, 20, 11);
    }
  },
  crop: function(c, w, h){
    /* corn to the horizon, one saucer working late */
    c.fillStyle = '#0a1206'; c.fillRect(0, h - 40, w, 40);
    for (var x = 0; x < w; x += 9){
      var sh = rnd(36, 82);
      c.strokeStyle = 'rgba(30,52,20,0.9)'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(x, h); c.lineTo(x + rnd(-4, 4), h - sh); c.stroke();
      c.strokeStyle = 'rgba(44,70,28,0.8)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x, h - sh * 0.6); c.lineTo(x + 7, h - sh * 0.75); c.stroke();
    }
    /* the saucer + its beam */
    c.fillStyle = 'rgba(217,255,94,0.1)';
    c.beginPath(); c.moveTo(285, h - 132); c.lineTo(345, h - 132); c.lineTo(380, h); c.lineTo(250, h);
    c.closePath(); c.fill();
    c.fillStyle = '#8fa3ba'; c.beginPath(); c.ellipse(315, h - 138, 44, 12, 0, 0, 6.3); c.fill();
    c.fillStyle = '#bcd0e2'; c.beginPath(); c.ellipse(315, h - 148, 20, 11, 0, 0, 6.3); c.fill();
    c.fillStyle = '#ffd23f';
    c.beginPath(); c.arc(288, h - 136, 3, 0, 6.3); c.fill();
    c.beginPath(); c.arc(315, h - 132, 3, 0, 6.3); c.fill();
    c.beginPath(); c.arc(342, h - 136, 3, 0, 6.3); c.fill();
  },
  mothership: function(c, w, h){
    /* inside the hull: plates, portholes, running lights */
    c.fillStyle = '#1c2430'; c.fillRect(0, h - 120, w, 120);
    c.strokeStyle = 'rgba(10,14,20,0.9)'; c.lineWidth = 4;
    for (var x = -60; x < w; x += 128){
      c.beginPath(); c.arc(x + 64, h + 60, 150, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
    }
    c.beginPath(); c.moveTo(0, h - 120); c.lineTo(w, h - 120); c.stroke();
    for (var p = 30; p < w; p += 70){
      c.fillStyle = 'rgba(127,217,192,0.85)';
      c.beginPath(); c.arc(p, h - 84, 7, 0, 6.3); c.fill();
      c.strokeStyle = '#2c3a4c'; c.lineWidth = 3;
      c.beginPath(); c.arc(p, h - 84, 9, 0, 6.3); c.stroke();
    }
    for (var q = 0; q < w; q += 34){
      c.fillStyle = q % 68 ? 'rgba(255,75,61,0.8)' : 'rgba(224,189,78,0.8)';
      c.fillRect(q, h - 34, 6, 4);
    }
    c.strokeStyle = '#2c3a4c'; c.lineWidth = 6;
    for (var s = 80; s < w; s += 256){
      c.beginPath(); c.moveTo(s, h); c.lineTo(s + 40, h - 120); c.stroke();
    }
  },
  throne: function(c, w, h){
    /* the throne ring: alien columns, banners, rocks that forgot gravity */
    for (var i = 0; i < 7; i++){
      var cx = 40 + i * 150;
      c.fillStyle = '#241033';
      c.beginPath(); c.moveTo(cx, h); c.lineTo(cx + 10, h - 150); c.lineTo(cx + 34, h - 150); c.lineTo(cx + 44, h);
      c.closePath(); c.fill();
      c.fillStyle = 'rgba(245,185,61,0.85)';
      c.beginPath(); c.arc(cx + 22, h - 120, 4, 0, 6.3); c.fill();
      c.beginPath(); c.arc(cx + 22, h - 92, 3, 0, 6.3); c.fill();
      if (i % 2){
        c.fillStyle = '#4c1030';
        c.beginPath(); c.moveTo(cx + 8, h - 148); c.lineTo(cx + 36, h - 148); c.lineTo(cx + 22, h - 96);
        c.closePath(); c.fill();
      }
    }
    c.fillStyle = '#1a0b28';
    [[130, 190, 26], [420, 170, 18], [700, 200, 30], [900, 165, 15]].forEach(function(rk){
      c.beginPath(); c.ellipse(rk[0], h - rk[1], rk[2], rk[2] * 0.7, 0.3, 0, 6.3); c.fill();
    });
  },
  machine: function(c, w, h){
    /* THE ENGINE's guts: gears, pipes, gauges, warnings */
    c.fillStyle = '#12161c'; c.fillRect(0, h - 110, w, 110);
    function gear(gx, gy, gr){
      c.strokeStyle = '#39434f'; c.lineWidth = 9;
      c.beginPath(); c.arc(gx, gy, gr, 0, 6.3); c.stroke();
      for (var t = 0; t < 8; t++){
        var a = t * Math.PI / 4;
        c.fillStyle = '#39434f';
        c.fillRect(gx + Math.cos(a) * (gr + 6) - 4, gy + Math.sin(a) * (gr + 6) - 4, 9, 9);
      }
      c.fillStyle = '#1c2230'; c.beginPath(); c.arc(gx, gy, gr * 0.4, 0, 6.3); c.fill();
    }
    gear(120, h - 60, 34); gear(190, h - 96, 22); gear(520, h - 70, 40); gear(840, h - 58, 28);
    /* pipes */
    c.strokeStyle = '#2c3440'; c.lineWidth = 12;
    c.beginPath(); c.moveTo(240, h - 30); c.lineTo(460, h - 30); c.lineTo(460, h - 90); c.lineTo(700, h - 90); c.stroke();
    c.strokeStyle = '#39434f'; c.lineWidth = 3;
    [280, 340, 400].forEach(function(px){ c.beginPath(); c.moveTo(px, h - 40); c.lineTo(px, h - 20); c.stroke(); });
    /* gauges + warning strip */
    [660, 940].forEach(function(gx){
      c.fillStyle = '#c9ccd4'; c.beginPath(); c.arc(gx, h - 44, 11, 0, 6.3); c.fill();
      c.strokeStyle = '#c0202c'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(gx, h - 44); c.lineTo(gx + 7, h - 52); c.stroke();
    });
    for (var wx = 0; wx < w; wx += 46){
      c.fillStyle = wx % 92 ? 'rgba(255,75,61,0.9)' : 'rgba(30,20,20,0.9)';
      c.fillRect(wx, h - 112, 23, 6);
    }
  }
};

/* ---------- midground props (toggleable) ---------- */
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
var venueCar = [
  prop(new THREE.BoxGeometry(2.6, 0.55, 1.1), 0x1b2735, -6.8, 0.34, -3.4, 0.35),
  prop(new THREE.BoxGeometry(1.4, 0.45, 1.0), 0x141c28, -6.9, 0.82, -3.4, 0.35)
];

/* the sprinkler (ticks quietly while you line up a shot) */
var venueSprinkler = prop(new THREE.CylinderGeometry(0.07, 0.09, 0.22, 8), 0x2a3440, 5.4, 0.11, 2.6);

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
  if (!venueDog.visible) return;
  dogBarkT = 1;
  sfxDog();
}
function sfxDog(){
  tone(700, 0.08, 'square', 0.09, 420);
  setTimeout(function(){ tone(760, 0.09, 'square', 0.09, 430); }, 170);
}

/* ---------- the venue table ---------- */
var VENUE_DEFS = {
  driveway:   { sky:'dusk',   hor:'houses',     lamp:0xffd9a8, ground:0x0a0712, fence:1, car:1, dog:1, spr:1, clutter:1 },
  schoolyard: { sky:'dusk',   hor:'school',     lamp:0xfff2c8, ground:0x0a0712, fence:1, clutter:1 },
  lot:        { sky:'dusk',   hor:'lot',        lamp:0xffc890, ground:0x0b0810, fence:1, car:1, dog:1, clutter:1 },
  culdesac:   { sky:'night',  hor:'houses',     lamp:0xd8e8ff, ground:0x0a0712, fence:1, car:1, spr:1, clutter:1 },
  hall:       { sky:'inside', hor:'hall',       lamp:0xe8f4d8, ground:0x0c0a10 },
  arcade:     { sky:'inside', hor:'arcade',     lamp:0xc06af0, ground:0x0c0a14 },
  backroom:   { sky:'inside', hor:'felt',       lamp:0xff9a50, ground:0x0a1210 },
  cityhall:   { sky:'night',  hor:'cityhall',   lamp:0xfff0d0, ground:0x0b0a12, clutter:1 },
  oval:       { sky:'night',  hor:'oval',       lamp:0xe8f0ff, ground:0x0b0a12 },
  crop:       { sky:'night',  hor:'crop',       lamp:0x9adf6a, ground:0x081006, fence:1 },
  mothership: { sky:'space',  hor:'mothership', lamp:0x7fd9c0, ground:0x05040c },
  throne:     { sky:'space',  hor:'throne',     lamp:0xf5b93d, ground:0x0a0512 },
  machine:    { sky:'space',  hor:'machine',    lamp:0xff4b3d, ground:0x0c0508 }
};
var venueKey = null;
function applyVenue(key){
  var v = VENUE_DEFS[key] || VENUE_DEFS.driveway;
  if (venueKey === key) return;
  venueKey = key;
  var os = skyRing.material.map;
  skyRing.material.map = venuePanoTex(1024, 256, SKY_PAINT[v.sky]);
  skyRing.material.needsUpdate = true;
  if (os) os.dispose();
  var oh = houseRing.material.map;
  houseRing.material.map = venuePanoTex(1024, 256, HOR_PAINT[v.hor]);
  houseRing.material.needsUpdate = true;
  if (oh) oh.dispose();
  venueFence.visible = !!v.fence;
  venueCar.forEach(function(m){ m.visible = !!v.car; });
  venueSprinkler.visible = !!v.spr;
  venueDog.visible = !!v.dog;
  courtClutter.forEach(function(m){ m.visible = !!v.clutter; });
  lamp.color.setHex(v.lamp);
  venueGround.material.color.setHex(v.ground);
  mark('venue:' + key);
}
applyVenue('driveway');
