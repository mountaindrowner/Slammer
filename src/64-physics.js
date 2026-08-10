/* ================================================================
   SLAM + PHYSICS SIM
   ================================================================ */
/* the power curve: golf-swing shape — fast ramp, peak, fast falloff, sloppy sag */
function powerCurve(t){
  var T1 = TUNE.POW_RISE;
  if (t <= T1){ var k = t / T1; return 0.12 + 0.88 * (k * k * (3 - 2 * k)); }
  var f = (t - T1) / TUNE.POW_FALL;
  if (f < 1) return 1 - 0.68 * f;
  return Math.max(0.24, 0.32 - (f - 1) * 0.05);
}
function gripAt(t){ return t >= TUNE.POW_RISE - TUNE.GRIP_LO && t <= TUNE.POW_RISE + TUNE.GRIP_HI; }
function sloppyAt(t){ return clamp((t - (TUNE.POW_RISE + TUNE.POW_FALL * 0.6)) / TUNE.POW_FALL, 0, 1); }

/* att = { dx, dz (attitude dir), tilt 0..1, grip, scatter } — Throw v2 */
function doSlam(side, x, z, pow, att){
  att = att || { dx: 0, dz: 1, tilt: 0, grip: false, scatter: 0 };
  if (att.scatter){ x += rnd(-att.scatter, att.scatter); z += rnd(-att.scatter, att.scatter); }
  var r = clamp(Math.sqrt(x*x + z*z), 0, TUNE.ARENA_R - 0.5);
  var a = Math.atan2(z, x);
  x = Math.cos(a) * r; z = Math.sin(a) * r;
  var key = side === 'you' ? run.slammer : M.rival.slammer;
  var spec = SLAMMERS[key] || SLAMMERS.slammy;
  var mesh = makeDisc(key, 0.72, 0.24);
  mesh.position.set(x, 6, z);
  /* attitude: tip the leading edge down toward the drive direction */
  if (att.tilt > 0.02){
    _wobAx.set(att.dz, 0, -att.dx).normalize();
    mesh.quaternion.setFromAxisAngle(_wobAx, att.tilt * TUNE.TILT_MAX);
  }
  scene.add(mesh);
  slammer = { mesh: mesh, side: side, pow: pow, spec: spec, att: att,
    design: DESIGNS[key], bR: 0.72, bH: 0.24, m: 3,
    vy: -(TUNE.DROP_VY + pow * TUNE.DROP_VY_POW),
    hit: false, hopped: false, hopping: false, phase: 'drop',
    shadow: makeShadow(0.72) };
  reticle.visible = false;
  ghost.visible = false;
  if (att.perfect) sfxReentry();
  mode = 'drop';
  slamClock = 0;
  M.settleLogged = false;
  slamStats = { side: side, pow: pow, att: att, caps: 0, boomerang: false, spinFlip: false };
  M.slams++;
  tlog('SLAM ' + side + ' @(' + x.toFixed(1) + ',' + z.toFixed(1) + ') pow=' + pow.toFixed(2) +
    ' tilt=' + att.tilt.toFixed(2) + (att.perfect ? ' WHITEHOT' : (att.grip ? ' GRIP' : '')));
}

var pendingImps = [], simStuckT = 0, stillFrames = 0, slamClock = 0, slamStats = null;
var STILL_N = AUTO ? 5 : 15;   /* settle rule: consecutive still frames before the tally */
function slamImpactAt(px, pz, pow, side, spec, mult, att){
  simStuckT = 0;
  var tilt = (att && att.tilt) || 0;
  var grip = !!(att && att.grip);
  /* edge attitude concentrates the impact; grip sharpens everything */
  var R = (TUNE.IMP_R_BASE + pow * TUNE.IMP_R_POW) * (spec.radius || 1) * (1 - TUNE.EDGE_R * tilt);
  /* house rule + slammer hooks: outgoing impulse */
  var outMult = mult * (spec.imp || 1) * (grip ? TUNE.GRIP_F : 1);
  if (M.rival.rule === 'mint' && side === 'rival') outMult *= 1.35;
  M.pot.forEach(function(t){
    if (t.captured) return;
    var d = hdist(t.mesh.position.x, t.mesh.position.z, px, pz);
    if (d > R) return;
    /* house rule + chip weight hooks: incoming impulse */
    var inMult = 1;
    if (M.rival.rule === 'mint' && t.stakedBy === 'rival') inMult *= 0.65;
    var ph = t.design.phys || {};
    inMult *= (ph.imp || 1);
    var fall = 1 - d / R;
    var str = (TUNE.IMP_S_BASE + pow * TUNE.IMP_S_POW) * outMult * inMult;
    var dx = t.mesh.position.x - px, dz = t.mesh.position.z - pz;
    var dl = Math.max(0.2, Math.sqrt(dx*dx + dz*dz));
    var pushX = dx / dl, pushZ = dz / dl;
    /* attitude: edge-leading strikes bite in a lane along the drive direction —
       aligned chips get driven forward and flipped away from the strike edge */
    var lane = 1;
    if (tilt > 0.02 && att){
      var c = Math.max(0, (dx * att.dx + dz * att.dz) / dl);
      lane = Math.pow(c, TUNE.EDGE_LANE);
      var bend = tilt * 0.7;
      pushX = pushX * (1 - bend) + att.dx * bend;
      pushZ = pushZ * (1 - bend) + att.dz * bend;
      var pl = Math.sqrt(pushX * pushX + pushZ * pushZ) || 1;
      pushX /= pl; pushZ /= pl;
    }
    var laneF = (1 - tilt) + tilt * lane * TUNE.EDGE_F;
    var laneT = (1 - tilt) + tilt * lane * TUNE.EDGE_T;
    var base = str * fall * laneF;
    /* flip torque falls off harder than push: center hits flip, edge hits slide */
    var angK = str * Math.pow(fall, TUNE.IMP_ANG_POW) * (spec.ang || 1) * (ph.ang || 1)
      * laneT * (grip ? TUNE.GRIP_T : 1);
    var vx = pushX * base * 0.55 + rnd(-0.4, 0.4);
    var vz = pushZ * base * 0.55 + rnd(-0.4, 0.4);
    var vy = base * (0.72 + Math.random() * 0.45);
    /* edge strikes flip chips over a readable axis (forward, away from the
       strike); flat strikes tumble randomly — this is the aimed-flips layer */
    _axis.set(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).normalize();
    if (tilt > 0.02 && att){
      _cn.set(att.dz, 0, -att.dx);
      _axis.multiplyScalar(1 - tilt * 0.75).addScaledVector(_cn, tilt * 0.75).normalize();
    }
    _axis.multiplyScalar(angK * 2.6 + rnd(0, 2.6));
    var ax = _axis.x, ay = _axis.y, az = _axis.z;
    /* shockwave ripple: impulse arrives later the farther out the disc sits */
    pendingImps.push({ delay: d * TUNE.RIPPLE, fn: (function(t2, vx2, vy2, vz2, ax2, ay2, az2){
      return function(){
        if (t2.captured) return;
        t2.settling = null; t2.settled = false; t2.disturbed = true;
        t2.vel.x += vx2; t2.vel.y += vy2; t2.vel.z += vz2;
        t2.angVel.x += ax2; t2.angVel.y += ay2; t2.angVel.z += az2;
      };
    })(t, vx, vy, vz, ax, ay, az) });
  });
  mode = 'sim';
}
function slamImpact(){
  tlog('  impact');
  var s = slammer, pow = s.pow;
  sfxThud(pow);
  camShake = 0.22 + 0.3 * pow;
  camPunch = 0.7 + 0.9 * pow;
  lampFlare = 1.4 + pow;
  flashImpact(pow);
  shockwave(s.mesh.position.x, s.mesh.position.z, (TUNE.IMP_R_BASE + pow * TUNE.IMP_R_POW) * (s.spec.radius || 1));
  /* re-entry payoff: the burn detonates into embers on contact */
  burnFlame.visible = false;
  if (s.att && s.att.grip){
    emberBurst(s.mesh.position.x, s.mesh.position.y, s.mesh.position.z,
      s.att.perfect ? 40 : 14, s.att.perfect ? 7 : 4);
    if (s.att.perfect){ camShake += 0.18; lampFlare += 0.8; sfxSizzle(); }
  }
  if (!AUTO){ timeScale = 0.07; tsHold = 0.1; }  /* hitstop */
  slamImpactAt(s.mesh.position.x, s.mesh.position.z, pow, s.side, s.spec, 1, s.att);
  if (s.spec.fx === 'bounce' && !s.hopped){
    s.hopped = true; s.hopping = true;
    s.phase = 'hop';
    s.vy = 5.4;
    s.hvx = rnd(-1.5, 1.5); s.hvz = rnd(-1.5, 1.5);
    tlog('  bouncer hop');
  } else {
    launchSlammerBody(s);
  }
}
/* the settle rule: the slammer is a citizen of the sim — after impact it
   rebounds, tumbles, and settles under the same physics as the chips */
function launchSlammerBody(s){
  s.hopping = false;
  s.phase = 'sim';
  /* an edge-first slam drives through: the slammer carries forward momentum
     and rolls; a flat slam rebounds straight up */
  var att = s.att || {}, tilt = att.tilt || 0;
  var drive = tilt * (2 + s.pow * 3);
  s.vel = new THREE.Vector3(
    rnd(-1.2, 1.2) * (1 - tilt) + (att.dx || 0) * drive,
    (2.4 + s.pow * 2.6) * (1 - tilt * 0.45),
    rnd(-1.2, 1.2) * (1 - tilt) + (att.dz || 0) * drive);
  s.angVel = new THREE.Vector3(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).normalize()
    .multiplyScalar((3 + s.pow * 6) * (1 + tilt * 0.5));
  s.settled = false; s.settling = null; s.disturbed = true;
}
function slamRestY(s){
  var top = 0;
  M.pot.forEach(function(t){
    if (t.captured) return;
    if (hdist(t.mesh.position.x, t.mesh.position.z, s.mesh.position.x, s.mesh.position.z)
        < 0.72 + TUNE.TAZO_R * 0.9){
      top = Math.max(top, t.mesh.position.y + TUNE.TAZO_H / 2);
    }
  });
  return Math.max(0.13, top + 0.13);
}

/* support height: the lowest point of a tilted disc is on its rim,
   so the rest height depends on orientation — this is what stops rims
   knifing through the floor */
function supportY(q, R, H){
  _sn.set(0, 1, 0).applyQuaternion(q);
  var ay = Math.abs(_sn.y);
  return H / 2 * ay + R * Math.sqrt(Math.max(0, 1 - ay * ay));
}
function stepTazo(t, dt){
  if (t.settling){ stepSettling(t, dt); return; }
  var p = t.mesh.position, v = t.vel;
  v.y -= TUNE.GRAV * (t.design.phys ? (t.design.phys.grav || 1) : 1) * dt;
  p.x += v.x * dt; p.y += v.y * dt; p.z += v.z * dt;
  /* arena curb */
  var rr = Math.sqrt(p.x*p.x + p.z*p.z);
  var lim = TUNE.ARENA_R - t.bR * 0.6;
  if (rr > lim){
    var wx = p.x / rr, wz = p.z / rr;
    p.x = wx * lim; p.z = wz * lim;
    var dot = v.x * wx + v.z * wz;
    if (dot > 0){
      v.x -= 1.6 * dot * wx; v.z -= 1.6 * dot * wz; v.x *= 0.7; v.z *= 0.7;
      if (dot > 1.5){
        t.angVel.x += rnd(-dot, dot) * 0.4; t.angVel.z += rnd(-dot, dot) * 0.4;
        sfxClack(0.02 + dot * 0.01);
      }
    }
  }
  /* floor: contact at the disc's true lowest point */
  _sn.set(0, 1, 0).applyQuaternion(t.mesh.quaternion);
  var ny = _sn.y, ay = Math.abs(ny);
  var sinT = Math.sqrt(Math.max(0, 1 - ay * ay));
  var restY = t.bH / 2 * ay + t.bR * sinT;
  var onGround = false;
  if (p.y <= restY){
    p.y = restY; onGround = true;
    if (v.y < 0){
      var hit = -v.y;
      v.y = hit * TUNE.BOUNCE_Y;
      if (hit > 1.4){
        if (sinT > 0.05){
          /* tilted landing: trip over the rim contact point */
          _cn.set(ny * _sn.x, ny * ny - 1, ny * _sn.z).normalize();      /* downhill rim dir */
          _ra.copy(_cn).multiplyScalar(t.bR)
             .addScaledVector(_sn, -(ny >= 0 ? 1 : -1) * t.bH / 2);
          _tq.crossVectors(_ra, _upv.set(0, 1, 0));
          t.angVel.addScaledVector(_tq, hit * 0.85);
        }
        t.angVel.x += rnd(-1, 1) * hit * 0.22;
        t.angVel.z += rnd(-1, 1) * hit * 0.22;
        v.x += rnd(-1, 1) * hit * 0.09;
        v.z += rnd(-1, 1) * hit * 0.09;
        sfxTick(0.015 + hit * 0.008);
      }
      if (v.y < 0.9 && ay > 0.85) v.y = 0;   /* only rest flat-ish; leaning chips keep tipping */
    }
    v.x *= TUNE.FRIC_XZ; v.z *= TUNE.FRIC_XZ;
    t.angVel.multiplyScalar(TUNE.ANG_DAMP_GND);
    /* gravity tips a leaning chip down flat over its contact edge —
       but never pump spin past the settle threshold (a chip wedged
       against another would jitter forever) */
    if (sinT > 0.03 && t.angVel.length() < TUNE.SETTLE_W * 0.9){
      _tq.crossVectors(_sn, _upv.set(0, ny >= 0 ? 1 : -1, 0));
      if (_tq.lengthSq() > 0.0001){
        t.angVel.addScaledVector(_tq.normalize(), TUNE.TIP * sinT * dt);
      }
    }
  } else {
    /* cardboard in air: drag + flutter, not a cannonball */
    v.multiplyScalar(Math.pow(TUNE.DRAG_AIR, dt));
    t.angVel.multiplyScalar(TUNE.ANG_DAMP_AIR);
    if (t.angVel.length() > 3){
      t.angVel.x += rnd(-1, 1) * TUNE.FLUTTER * dt;
      t.angVel.z += rnd(-1, 1) * TUNE.FLUTTER * dt;
    }
  }
  /* straggler assist: after ~4 s of live sim, friction quietly wins */
  if (simStuckT > 4){
    v.multiplyScalar(Math.pow(0.2, dt));
    t.angVel.multiplyScalar(Math.pow(0.2, dt));
  }
  /* tumble */
  var w = t.angVel.length();
  if (w > 0.001){
    _axis.copy(t.angVel).multiplyScalar(1 / w);
    t.mesh.rotateOnWorldAxis(_axis, w * dt);
  }
  /* slow enough -> wobble down flat like a dying coin */
  if (onGround && v.length() < TUNE.SETTLE_V && w < TUNE.SETTLE_W){
    beginSettle(t);
  }
}
var _axis = new THREE.Vector3(), _up = new THREE.Vector3();
var _eul = new THREE.Euler(), _wobQ = new THREE.Quaternion(), _wobAx = new THREE.Vector3();
var _sn = new THREE.Vector3(), _cn = new THREE.Vector3(), _upv = new THREE.Vector3();
var _bu = new THREE.Vector3(), _bv = new THREE.Vector3();
var _ra = new THREE.Vector3(), _rb = new THREE.Vector3(), _tq = new THREE.Vector3();
var _vca = new THREE.Vector3(), _vcb = new THREE.Vector3();
function beginSettle(t){
  _up.set(0,1,0).applyQuaternion(t.mesh.quaternion);
  /* the flip rule, thick-puck edition: a decisive tilt flips; a lean falls
     back onto whichever face it was already lying on */
  if (_up.y < -0.12) t.faceUp = false;
  else if (_up.y > 0.12) t.faceUp = true;
  else t.faceUp = (t.faceUp !== false);
  var spin = t.angVel.length();
  t.settleSpin = spin;
  _eul.set(t.faceUp ? 0 : Math.PI, Math.atan2(_up.x, _up.z) + rnd(-0.4, 0.4), 0);
  t.settling = {
    k: 0,
    dur: 0.5 + Math.min(0.45, spin * 0.07),
    fromQ: t.mesh.quaternion.clone(),
    toQ: new THREE.Quaternion().setFromEuler(_eul),
    amp: Math.min(0.55, 0.14 + spin * 0.05),
    axisZ: Math.random() < 0.5,
    fromY: t.mesh.position.y
  };
  t.vel.set(0, 0, 0); t.angVel.set(0, 0, 0);
}
function stepSettling(t, dt){
  var s = t.settling;
  s.k += dt / s.dur;
  if (s.k >= 1){
    t.settling = null;
    t.mesh.quaternion.copy(s.toQ);
    finishSettle(t);
    return;
  }
  var e = 1 - Math.pow(1 - s.k, 2.2);
  t.mesh.quaternion.copy(s.fromQ).slerp(s.toQ, e);
  /* dying wobble on top of the slerp — the coin-clatter beat */
  var wob = s.amp * (1 - s.k) * Math.sin(s.k * 26);
  _wobAx.set(s.axisZ ? 0 : 1, 0, s.axisZ ? 1 : 0);
  t.mesh.quaternion.multiply(_wobQ.setFromAxisAngle(_wobAx, wob));
  /* pivot down on the rim contact — never through the floor; descend
     gently so the collision pass can hold it up on top of other chips */
  var fy = supportY(t.mesh.quaternion, t.bR, t.bH);
  t.mesh.position.y = Math.max(fy, t.mesh.position.y - 1.6 * dt);
}
function finishSettle(t){
  t.settled = true;
  if (!M) return;
  /* rest on top of any settled chip we still overlap (bead-consistent height) */
  var lift = 0;
  M.pot.forEach(function(o){
    if (o !== t && !o.captured && o.settled &&
        hdist(o.mesh.position.x, o.mesh.position.z, t.mesh.position.x, t.mesh.position.z) < (t.bR + o.bR) * 0.85 &&
        o.mesh.position.y >= lift + o.bH/2 - 0.001) lift = o.mesh.position.y + o.bH/2;
  });
  t.mesh.position.y = t.bH/2 + lift;
}

