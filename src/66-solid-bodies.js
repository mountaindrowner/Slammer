/* ================================================================
   SOLID BODIES — each disc is a rigid ring of beads (center + 8 rim
   spheres of radius h). Bead-vs-bead contact gives true 3D collision
   for any orientation: flat stacks, edge hits, tumbling clashes.
   ================================================================ */
function computeBeads(body){
  var K = 8, holder = body.holder;
  if (!holder.beads){
    holder.beads = [];
    for (var i = 0; i <= K; i++) holder.beads.push(new THREE.Vector3());
  }
  var p = body.mesh.position;
  _sn.set(0, 1, 0).applyQuaternion(body.mesh.quaternion);
  _bu.set(Math.abs(_sn.y) < 0.99 ? 0 : 1, Math.abs(_sn.y) < 0.99 ? 1 : 0, 0);
  _bu.crossVectors(_sn, _bu).normalize();
  _bv.crossVectors(_sn, _bu);
  holder.beads[0].copy(p);
  var rr = body.R - body.h;
  for (var k = 1; k <= K; k++){
    var a = (k - 1) * Math.PI * 2 / K;
    holder.beads[k].copy(p)
      .addScaledVector(_bu, Math.cos(a) * rr)
      .addScaledVector(_bv, Math.sin(a) * rr);
  }
}
function wakeChip(t){
  if (t.settled || t.settling){ t.settled = false; t.settling = null; t.disturbed = true; }
}
function collidePass(){
  var bodies = [];
  M.pot.forEach(function(t){
    if (t.captured) return;
    bodies.push({ holder: t, mesh: t.mesh, R: t.bR, h: t.bH / 2, m: 1, chip: t });
  });
  if (slammer){
    /* while live in the sim the slammer is a heavy mobile body;
       during drop/hop it's a solid obstacle chips bounce off */
    var slMobile = slammer.phase === 'sim' && slammer.vel && !slammer.settled;
    bodies.push({ holder: slammer, mesh: slammer.mesh, R: 0.72, h: 0.12, m: 3,
      chip: slMobile ? slammer : null });
  }
  bodies.forEach(computeBeads);
  for (var i = 0; i < bodies.length; i++) for (var j = i + 1; j < bodies.length; j++){
    var A = bodies[i], B = bodies[j];
    if (A.chip && B.chip && A.chip.settled && B.chip.settled) continue;
    var pdx = B.mesh.position.x - A.mesh.position.x;
    var pdy = B.mesh.position.y - A.mesh.position.y;
    var pdz = B.mesh.position.z - A.mesh.position.z;
    var reach = A.R + B.R + 0.06;
    if (pdx*pdx + pdy*pdy + pdz*pdz > reach * reach) continue;
    collideBodies(A, B);
  }
}
function collideBodies(A, B){
  var bA = A.holder.beads, bB = B.holder.beads;
  var minD = A.h + B.h, minD2 = minD * minD;
  for (var i = 0; i < bA.length; i++) for (var j = 0; j < bB.length; j++){
    var pa = bA[i], pb = bB[j];
    var dx = pb.x - pa.x, dy = pb.y - pa.y, dz = pb.z - pa.z;
    var d2 = dx*dx + dy*dy + dz*dz;
    if (d2 >= minD2) continue;
    var d = Math.sqrt(d2);
    var nx, ny, nz;
    if (d < 0.001){ nx = 0; ny = 1; nz = 0; d = 0.001; }
    else { nx = dx / d; ny = dy / d; nz = dz / d; }
    var overlap = minD - d;
    /* positional separation, mass-weighted: light bodies give way first */
    var mvA = A.chip && !A.chip.settled;
    var mvB = B.chip && !B.chip.settled;
    var wA = mvA ? (mvB ? B.m / (A.m + B.m) : 1) : 0;
    var wB = mvB ? (mvA ? A.m / (A.m + B.m) : 1) : 0;
    if (wA){
      A.mesh.position.x -= nx * overlap * wA;
      A.mesh.position.y -= ny * overlap * wA;
      A.mesh.position.z -= nz * overlap * wA;
    }
    if (wB){
      B.mesh.position.x += nx * overlap * wB;
      B.mesh.position.y += ny * overlap * wB;
      B.mesh.position.z += nz * overlap * wB;
    }
    if (A.chip && B.chip){
      /* chip vs chip: momentum + spin exchange at the contact point */
      var ta = A.chip, tb = B.chip;
      _ra.set(pa.x - A.mesh.position.x, pa.y - A.mesh.position.y, pa.z - A.mesh.position.z);
      _rb.set(pb.x - B.mesh.position.x, pb.y - B.mesh.position.y, pb.z - B.mesh.position.z);
      _vca.crossVectors(ta.angVel, _ra).add(ta.vel);
      _vcb.crossVectors(tb.angVel, _rb).add(tb.vel);
      var rel = (_vca.x - _vcb.x) * nx + (_vca.y - _vcb.y) * ny + (_vca.z - _vcb.z) * nz;
      if (rel > 0.05){
        /* gum wad: chips touching it stop dead */
        if (ta.design.field === 'sticky' || tb.design.field === 'sticky'){
          if (!ta.settled && !ta.settling){ ta.vel.multiplyScalar(0.12); ta.angVel.multiplyScalar(0.25); }
          if (!tb.settled && !tb.settling){ tb.vel.multiplyScalar(0.12); tb.angVel.multiplyScalar(0.25); }
          if (rel > 1.2) sfxTick(0.035);
          continue;
        }
        var jimp = rel * (1 + TUNE.REST_DISC) * 0.5;
        if (jimp > 1.1){ wakeChip(ta); wakeChip(tb); sfxClack(0.02 + jimp * 0.012); }
        _cn.set(nx, ny, nz);
        /* mass-weighted momentum exchange: the slammer bats chips, not vice versa */
        var jA = jimp * 2 * B.m / (A.m + B.m);
        var jB = jimp * 2 * A.m / (A.m + B.m);
        if (!ta.settled && !ta.settling){
          ta.vel.addScaledVector(_cn, -jA);
          _tq.crossVectors(_ra, _cn);
          ta.angVel.addScaledVector(_tq, -jA * 1.6);
        }
        if (!tb.settled && !tb.settling){
          tb.vel.addScaledVector(_cn, jB);
          _tq.crossVectors(_rb, _cn);
          tb.angVel.addScaledVector(_tq, jB * 1.6);
        }
      }
    } else {
      /* chip vs slammer body: the chip bounces off the solid slammer */
      var C = A.chip ? A : B, sgn = A.chip ? 1 : -1, tc = C.chip;
      if (!tc.settled && !tc.settling){
        var vn = (tc.vel.x * nx + tc.vel.y * ny + tc.vel.z * nz) * sgn;
        if (vn > 0.05){
          tc.vel.x -= nx * vn * 1.45 * sgn;
          tc.vel.y -= ny * vn * 1.45 * sgn;
          tc.vel.z -= nz * vn * 1.45 * sgn;
          tc.angVel.x += rnd(-vn, vn) * 0.3;
          tc.angVel.z += rnd(-vn, vn) * 0.3;
          if (vn > 1.4) sfxClack(0.02 + vn * 0.01);
        }
      }
    }
  }
}

