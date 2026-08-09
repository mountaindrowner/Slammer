/* ================================================================
   MAIN LOOP
   ================================================================ */
var last = null, frameN = 0;
function loop(ts){
  nextFrame(loop);
  if (last === null) last = ts;
  var rdt = Math.min(0.033, (ts - last) / 1000);
  last = ts;
  /* slow-mo: hold during hitstop, then ease back to full speed */
  if (tsHold > 0) tsHold -= rdt;
  else timeScale += (1 - timeScale) * Math.min(1, rdt * 5);
  /* the approach: slammer dropping past the point of no return */
  if (!AUTO && mode === 'drop' && slammer && !slammer.hit && slammer.mesh.position.y < 2.4){
    timeScale = Math.max(0.3, timeScale - rdt * 6);
  }
  var dt = rdt * timeScale;
  frameN++;
  if (frameN % 60 === 0) mark('frame:' + mode);
  if (AUTO && frameN % 150 === 0 && M){
    tlog('hb f' + frameN + ' mode=' + mode + ' dt=' + dt.toFixed(4) +
      ' unsettled=' + alive().filter(function(t){ return !t.settled; }).length +
      ' anims=' + animCount + ' booms=' + pendingBooms +
      ' slamY=' + (slammer ? slammer.mesh.position.y.toFixed(2) : '-'));
  }

  /* coin toss sim */
  if (mode === 'coin' && coin){
    coinState.t += dt;
    if (!coin.settled) stepTazo(coin, dt);
    if (coin.shadow) syncShadow(coin.shadow, coin.mesh.position);
    if (coinState.t > 5 && !coin.settled){
      coin.settling = null; coin.vel.set(0, 0, 0); coin.angVel.set(0, 0, 0);
      coin.mesh.rotation.set(0, rnd(0, 6.28), 0);
      coin.mesh.position.y = TUNE.TAZO_H / 2;
      coin.faceUp = true; coin.settled = true;
    }
    if (coin.settled) resolveToss();
  }

  /* aim + power bar */
  if (mode === 'aim'){
    aimT += rdt;
    power = 1 - Math.abs((aimT * TUNE.POW_HZ) % 2 - 1);
    el('powfill').style.width = (power * 100).toFixed(0) + '%';
    reticle.position.set(aimPos.x, 0.03, aimPos.z);
    var sc = 0.8 + power * 0.5;
    reticle.scale.set(sc, sc, sc);
  }

  /* rival telegraphs: reticle wanders to target, then slams */
  if (mode === 'rival' && rivalPlan){
    rivalPlan.t += dt;
    var k = Math.min(1, rivalPlan.t / rivalPlan.dur);
    var wob = (1 - k) * 0.5;
    reticle.position.set(
      rivalPlan.sx + (rivalPlan.tx - rivalPlan.sx) * k + Math.sin(rivalPlan.t * 9) * wob,
      0.03,
      rivalPlan.sz + (rivalPlan.tz - rivalPlan.sz) * k + Math.cos(rivalPlan.t * 7) * wob);
    reticle.scale.set(1, 1, 1);
    if (k >= 1){
      var rp = rivalPlan; rivalPlan = null;
      doSlam('rival', rp.tx, rp.tz, rp.pow);
    }
  }

  /* slammer drop */
  if (mode === 'drop' && slammer){
    var s = slammer;
    if (!s.hit){
      s.vy -= TUNE.GRAV * dt * 0.6;
      s.mesh.position.y += s.vy * dt;
      /* impact on the top of whatever is under the slammer, not the floor */
      var impactY = slamRestY(s);
      if (s.mesh.position.y <= impactY){
        s.mesh.position.y = impactY;
        s.hit = true; s.vy = 3.2;
        slamImpact();
      }
    }
  }
  /* slammer after impact: bouncer hop delivers a second hit, else fade out */
  if (slammer && slammer.hit){
    var sl = slammer;
    if (sl.hopping){
      sl.vy -= TUNE.GRAV * dt * 0.8;
      sl.mesh.position.y += sl.vy * dt;
      sl.mesh.position.x += sl.hvx * dt;
      sl.mesh.position.z += sl.hvz * dt;
      var hr = Math.sqrt(sl.mesh.position.x * sl.mesh.position.x + sl.mesh.position.z * sl.mesh.position.z);
      if (hr > TUNE.ARENA_R - 0.7){ sl.hvx *= -1; sl.hvz *= -1; }
      if (sl.vy < 0){
        var hy = slamRestY(sl);
        if (sl.mesh.position.y <= hy){
          sl.mesh.position.y = hy;
          sl.hopping = false; sl.vy = 3.2; sl.life = 0;
          sfxThud(sl.pow * 0.6);
          camShake = 0.25;
          shockwave(sl.mesh.position.x, sl.mesh.position.z, 1.5);
          slamImpactAt(sl.mesh.position.x, sl.mesh.position.z, sl.pow * 0.8, sl.side, sl.spec, 0.55);
          tlog('  hop impact');
        }
      }
    } else {
      sl.life += dt;
      sl.vy -= TUNE.GRAV * dt * 0.5;
      sl.mesh.position.y += sl.vy * dt;
      sl.mesh.rotation.z += dt * 2;
      if (sl.life > 0.7){
        dropShadow(sl);
        scene.remove(sl.mesh);
        slammer = null;
      }
    }
  }

  /* physics sim */
  if (mode === 'sim' && M){
    var busy = pendingImps.length > 0 || !!(slammer && slammer.hopping);
    /* anti-stall backstop: a wedged chip gets put to bed by hand */
    simStuckT += dt;
    if (simStuckT > 7){
      simStuckT = 0;
      M.pot.forEach(function(t){
        if (!t.captured && !t.settled && !t.settling){
          tlog('  force-settle ' + t.design.name);
          beginSettle(t);
        }
      });
    }
    for (var pi = pendingImps.length - 1; pi >= 0; pi--){
      pendingImps[pi].delay -= dt;
      if (pendingImps[pi].delay <= 0){ pendingImps[pi].fn(); pendingImps.splice(pi, 1); }
    }
    M.pot.forEach(function(t){
      if (t.captured || t.settled) return;
      busy = true;
      stepTazo(t, dt);
    });
    /* magnet chips drag the pot around while they move */
    M.pot.forEach(function(mg){
      if (mg.captured || mg.design.field !== 'magnet') return;
      if (mg.settled || mg.vel.length() < 1.2) return;
      M.pot.forEach(function(o){
        if (o === mg || o.captured) return;
        var d = hdist(o.mesh.position.x, o.mesh.position.z, mg.mesh.position.x, mg.mesh.position.z);
        if (d > 1.7 || d < 0.05) return;
        if (o.settled){
          if (d < 1.0) wakeChip(o);
          else return;
        }
        var pull = 9 * (1 - d / 1.7) * dt;
        o.vel.x += (mg.mesh.position.x - o.mesh.position.x) / d * pull;
        o.vel.z += (mg.mesh.position.z - o.mesh.position.z) / d * pull;
      });
    });
    collidePass();
    if (!busy && pendingBooms === 0){
      resolveSettled();
    }
  }

  /* rival bust leans into frame on his turn */
  if (M && M.bust){
    bustLean += (bustTarget - bustLean) * Math.min(1, rdt * 3.5);
    bustBob *= Math.pow(0.04, rdt);
    bustRecoil *= Math.pow(0.04, rdt);
    var bg = M.bust;
    bg.position.y = -3.2 + bustLean * 3.1 + Math.sin(ts * 0.0011) * 0.06 * bustLean
      + bustBob * 0.25 * Math.sin(ts * 0.02);
    bg.position.z = -(TUNE.ARENA_R + 2.5) + bustLean * 0.8 - bustRecoil * 0.5;
    bg.rotation.x = 0.14 * bustLean - bustRecoil * 0.18;
    bg.rotation.z = Math.sin(ts * 0.0009) * 0.03 * bustLean;
  }

  /* lamp flare after impact */
  lamp.intensity = 1.35 + lampFlare;
  lampFlare *= Math.pow(0.005, rdt);

  /* blob shadows track every airborne disc */
  if (M) M.pot.forEach(function(t){ if (t.shadow) syncShadow(t.shadow, t.mesh.position); });
  if (slammer && slammer.shadow) syncShadow(slammer.shadow, slammer.mesh.position);

  /* camera: follow the slam, punch on impact, sway for parallax */
  _camV.set(0, 0, -0.2);
  if (slammer){ _camV.x += slammer.mesh.position.x * 0.22; _camV.z += slammer.mesh.position.z * 0.22; }
  camT.lerp(_camV, 1 - Math.pow(0.005, rdt));
  camPunch *= Math.pow(0.04, rdt);
  if (camShake > 0.005) camShake *= Math.pow(0.02, rdt); else camShake = 0;
  placeCamera(ts);

  if (!AUTO || frameN % 20 === 0) renderer.render(scene, camera);
}
mark('loop-start');
nextFrame(loop);

/* ---------- boot ---------- */
/* film-grain tile (one static noise texture, jittered by CSS) */
(function(){
  var cv = document.createElement('canvas'); cv.width = cv.height = 160;
  var c = cv.getContext('2d');
  var img = c.createImageData(160, 160);
  for (var i = 0; i < img.data.length; i += 4){
    var v = 90 + Math.random() * 130;
    img.data[i] = img.data[i+1] = img.data[i+2] = v;
    img.data[i+3] = 255;
  }
  c.putImageData(img, 0, 0);
  var g = el('grain');
  g.style.backgroundImage = 'url(' + cv.toDataURL() + ')';
  g.style.mixBlendMode = 'overlay';
})();
el('courtprev').textContent = NODES.map(function(n){
  return n.t === 'store' ? 'CORNER STORE' : RIVALS[n.r].turf;
}).join(' → ');
mark('clean');
tlog('BOOT ok v' + VERSION);
if (AUTO){
  setTimeout(function(){ el('startbtn').click(); }, 200);
}
