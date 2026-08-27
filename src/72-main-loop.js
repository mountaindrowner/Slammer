/* ================================================================
   MAIN LOOP
   ================================================================ */
var last = null, frameN = 0, sprinkT = 0;
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
  /* match point: the last live chip with the score in the balance
     settles in slow motion — everybody leans in */
  if (!AUTO && M && mode === 'sim'){
    var mpAlive = alive();
    if (mpAlive.length === 1 && !mpAlive[0].settled &&
        Math.abs(M.yourCaps.length - M.rivalCaps.length) <= 1){
      timeScale = Math.min(timeScale, 0.45);
    }
  }
  var dt = rdt * timeScale;
  frameN++;
  if (frameN % 60 === 0) mark('frame:' + mode);
  if (AUTO && frameN % 150 === 0 && M){
    tlog('hb f' + frameN + ' mode=' + mode + ' dt=' + dt.toFixed(4) +
      ' unsettled=' + alive().filter(function(t){ return !t.settled; }).length +
      ' anims=' + animCount + ' booms=' + pendingBooms +
      ' slam=' + (slammer ? (slammer.phase || '?') : '-'));
  }

  /* coin toss sim */
  if (mode === 'coin' && coin){
    coinState.t += dt;
    if (!coin.settled) stepTazo(coin, dt);
    if (coin.shadow) syncShadow(coin.shadow, coin.mesh.position);
    if (coinState.t > (M && M.field === 'lowg' ? 8 : 5) && !coin.settled){
      coin.settling = null; coin.vel.set(0, 0, 0); coin.angVel.set(0, 0, 0);
      coin.mesh.rotation.set(0, rnd(0, 6.28), 0);
      coin.mesh.position.y = TUNE.TAZO_H / 2;
      coin.faceUp = true; coin.settled = true;
    }
    if (coin.settled) resolveToss();
  }

  /* the three-phase throw: tilt dial → aim ring → power curve */
  if (mode === 'tilt' && throwAtt){
    /* the ghost slammer hovers over the court, tipping as you drag */
    ghostAt(0, 1.5, 0, throwAtt);
  } else if (mode === 'aimloc' && throwAtt){
    reticle.position.set(aimPos.x, 0.03, aimPos.z);
    reticle.scale.set(1, 1, 1);
    ghostAt(aimPos.x, 1.15, aimPos.z, throwAtt);
  } else if (mode === 'power' && throwAtt){
    reticle.position.set(aimPos.x, 0.03, aimPos.z);
    ghostAt(aimPos.x, 1.15, aimPos.z, throwAtt);
    if (aimT >= 0){
      aimT += rdt;
      power = powerCurve(aimT);
      var pf = el('powfill');
      pf.style.width = (power * 100).toFixed(0) + '%';
      pf.classList.toggle('grip', gripAt(aimT));
      var sc = 0.8 + power * 0.5;
      reticle.scale.set(sc, sc, sc);
    }
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
      doSlam('rival', rp.tx, rp.tz, rp.pow, rp.att);
    }
  }

  /* slammer drop */
  if (mode === 'drop' && slammer){
    var s = slammer;
    if (!s.hit){
      s.vy -= TUNE.GRAV * fieldGrav() * dt * 0.6;
      s.mesh.position.y += s.vy * dt;
      /* the grip burn: a clean release comes down hot; a perfect one
         burns up in the atmosphere */
      if (s.att && s.att.grip){
        s.heat = Math.min(s.att.perfect ? 1 : 0.5, (s.heat || 0) + rdt * 4);
        setBodyHeat(s, s.heat);
        spawnEmber(s.mesh.position.x, s.mesh.position.y + 0.1, s.mesh.position.z, 0.28, 2.2);
        if (s.att.perfect){
          spawnEmber(s.mesh.position.x, s.mesh.position.y + 0.5, s.mesh.position.z, 0.34, 3);
          burnFlame.visible = true;
          burnFlame.position.set(s.mesh.position.x, s.mesh.position.y + 0.95, s.mesh.position.z);
          burnFlame.rotation.y += rdt * 9;
          var flk = 1 + rnd(-0.14, 0.14);
          burnFlame.scale.set(flk, 1 + rnd(-0.18, 0.18), flk);
        }
      }
      /* impact on the top of whatever is under the slammer, not the floor */
      var impactY = slamRestY(s);
      if (s.mesh.position.y <= impactY){
        s.mesh.position.y = impactY;
        s.hit = true; s.vy = 3.2;
        slamImpact();
      }
    }
  }
  /* slammer after impact: hop (bouncer), then live physics, then fade.
     The settle rule: the slammer is a citizen of the sim — it tumbles and
     settles like everything else, and only fades once at rest. */
  if (slammer && slammer.hit){
    var sl = slammer;
    /* heat dies down after contact */
    if (sl.heat > 0.01){
      sl.heat *= Math.pow(0.08, rdt);
      setBodyHeat(sl, sl.heat);
    }
    if (sl.phase === 'hop'){
      sl.vy -= TUNE.GRAV * fieldGrav() * dt * 0.8;
      sl.mesh.position.y += sl.vy * dt;
      sl.mesh.position.x += sl.hvx * dt;
      sl.mesh.position.z += sl.hvz * dt;
      var hr = Math.sqrt(sl.mesh.position.x * sl.mesh.position.x + sl.mesh.position.z * sl.mesh.position.z);
      if (hr > TUNE.ARENA_R - 0.7){ sl.hvx *= -1; sl.hvz *= -1; }
      if (sl.vy < 0){
        var hy = slamRestY(sl);
        if (sl.mesh.position.y <= hy){
          sl.mesh.position.y = hy;
          sfxThud(sl.pow * 0.6);
          camShake = 0.25;
          shockwave(sl.mesh.position.x, sl.mesh.position.z, 1.5);
          slamImpactAt(sl.mesh.position.x, sl.mesh.position.z, sl.pow * 0.8, sl.side, sl.spec, 0.55, sl.att);
          launchSlammerBody(sl);
          tlog('  hop impact');
        }
      }
    } else if (sl.phase === 'sim'){
      if (!sl.settled) stepTazo(sl, dt);
      sl.apexY = Math.max(sl.apexY || 0, sl.mesh.position.y);
      if (sl.settled){
        /* boomerang: rebounded high and came back down on the stack */
        if (slamStats && sl.apexY > 1.7 && M){
          var bnd = 1e9;
          M.pot.forEach(function(t){
            if (t.captured) return;
            bnd = Math.min(bnd, hdist(t.mesh.position.x, t.mesh.position.z,
              sl.mesh.position.x, sl.mesh.position.z));
          });
          if (bnd < 1.1) slamStats.boomerang = true;
        }
        sl.phase = 'fade'; sl.fadeT = 0;
      }
    } else if (sl.phase === 'fade'){
      sl.fadeT += rdt;
      var fk = Math.min(1, sl.fadeT / (AUTO ? 0.1 : 0.5));
      var fs = Math.max(0.001, 1 - fk * fk);
      sl.mesh.scale.set(fs, fs, fs);
      if (fk >= 1){
        dropShadow(sl);
        scene.remove(sl.mesh);
        slammer = null;
      }
    }
  }

  /* layout orbit: settled chips ride the carousel through every live phase */
  if (M && M.layout === 'orbit' && mode !== 'over' && mode !== 'menu' && mode !== 'coin'){
    var oa = 0.25 * dt, oc = Math.cos(oa), os = Math.sin(oa);
    M.pot.forEach(function(t){
      if (t.captured || !t.settled) return;
      var op = t.mesh.position;
      var onx = op.x * oc - op.z * os, onz = op.x * os + op.z * oc;
      op.x = onx; op.z = onz;
      t.mesh.rotateOnWorldAxis(_upv.set(0, 1, 0), oa);
    });
  }

  /* physics sim */
  if (mode === 'sim' && M){
    slamClock += rdt;
    var busy = pendingImps.length > 0 ||
      !!(slammer && (slammer.phase === 'hop' || (slammer.phase === 'sim' && !slammer.settled)));
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
    /* anti-stall clock: counts only while the table is live */
    if (busy) simStuckT += dt; else simStuckT = 0;
    if (simStuckT > 7){
      simStuckT = 0;
      M.pot.forEach(function(t){
        if (!t.captured && !t.settled && !t.settling){
          tlog('  force-settle ' + t.design.name);
          beginSettle(t);
        }
      });
      if (slammer && slammer.phase === 'sim' && !slammer.settled && !slammer.settling){
        beginSettle(slammer);
      }
    }
    /* the settle rule: nothing resolves until the whole table has been
       still for N consecutive frames — captures aren't real until then */
    if (!busy && pendingBooms === 0){
      stillFrames++;
      if (stillFrames >= STILL_N){
        if (M && !M.settleLogged){
          M.settleLogged = true;
          tlog('  table still in ' + slamClock.toFixed(1) + 's');
        }
        resolveSettled();
      }
    } else {
      stillFrames = 0;
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

  updateEmbers(dt);

  /* finishes with a live tick: HOLO sheen, INFINITY pulse, MAGIC MOTION
     lenticular swap; STATIC snow crawls */
  if (M){
    var hueT = ts * 0.00025;
    M.pot.forEach(function(t){
      if (t.captured || !t.finish) return;
      if (t.finish === 'holo'){
        _sn.set(0, 1, 0).applyQuaternion(t.mesh.quaternion);
        t.mesh.material[1].emissive.setHSL((hueT + _sn.x * 0.25 + _sn.z * 0.15 + 1) % 1, 0.75, 0.15);
      } else if (t.finish === 'infinity'){
        t.mesh.material[1].emissive.setHSL(0.78, 0.7, 0.1 + 0.07 * Math.sin(ts * 0.004));
      } else if (t.finish === 'motion' && t.motionA){
        /* lenticular: the print flips as your viewpoint crosses it */
        _sn.set(1, 0, 0).applyQuaternion(t.mesh.quaternion);
        var mvx = camera.position.x - t.mesh.position.x;
        var mvz = camera.position.z - t.mesh.position.z;
        var want = (_sn.x * mvx + _sn.z * mvz) > 0 ? t.motionA : t.motionB;
        if (t.mesh.material[1].map !== want){
          t.mesh.material[1].map = want;
          t.mesh.material[1].needsUpdate = true;
        }
      }
    });
    if (frameN % 3 === 0) staticTex.offset.set(Math.random(), Math.random());
  }

  /* camera: frame the live cluster, drift to the aim, follow the slam */
  var cfit = clusterFit();
  _camV.set(cfit.x, 0, cfit.z);
  if ((mode === 'aimloc' || mode === 'power') && throwAtt){
    _camV.x += (aimPos.x - _camV.x) * 0.35;
    _camV.z += (aimPos.z - _camV.z) * 0.35;
  }
  if (slammer){
    _camV.x += (slammer.mesh.position.x - _camV.x) * 0.3;
    _camV.z += (slammer.mesh.position.z - _camV.z) * 0.3;
  }
  camT.lerp(_camV, 1 - Math.pow(0.05, rdt));
  var dTarget = clamp((cfit.r + 0.9) / Math.tan(Math.min(camAspect.vHalf, camAspect.hHalf)), 7, 24);
  camBaseD += (dTarget - camBaseD) * Math.min(1, rdt * 2.0);
  /* user-layer homing: double-tap, or 4 s into the rival's turn */
  if (rivalHomeAt && performance.now() > rivalHomeAt){ camHoming = true; rivalHomeAt = 0; }
  if (camHoming){
    var hk = Math.pow(0.03, rdt);
    uYaw *= hk; uPanX *= hk; uPanZ *= hk;
    uZoom = 1 + (uZoom - 1) * hk;
    if (Math.abs(uYaw) < 0.01 && Math.abs(uZoom - 1) < 0.01 &&
        Math.abs(uPanX) < 0.02 && Math.abs(uPanZ) < 0.02){
      uYaw = 0; uZoom = 1; uPanX = 0; uPanZ = 0; camHoming = false;
    }
  }
  camPunch *= Math.pow(0.04, rdt);
  if (camShake > 0.005) camShake *= Math.pow(0.02, rdt); else camShake = 0;
  placeCamera(ts);

  /* venue life: the dog, the sprinkler */
  if (dogBarkT > 0){
    dogBarkT -= rdt * 1.6;
    venueDog.position.y = Math.max(0, Math.abs(Math.sin(dogBarkT * 12)) * 0.3 * dogBarkT);
    if (dogBarkT <= 0) venueDog.position.y = 0;
  }
  if (!AUTO && mode === 'idle' && M){
    sprinkT = (sprinkT || 0) + rdt;
    if (sprinkT > 0.65){ sprinkT = 0; tone(1450, 0.02, 'square', 0.012); }
  }

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
el('courtprev').textContent = ACTS.join(' → ');
/* knob-system harness: ?knobtest=1 forces the first node hot */
if (/[?&]knobtest=1/.test(location.search)){
  COURT[0].opts[0].field = 'tilt';
  COURT[0].opts[0].wincon = 'bounty';
}
mark('clean');
tlog('BOOT ok v' + VERSION);
if (AUTO){
  setTimeout(function(){ el('startbtn').click(); }, 200);
}
