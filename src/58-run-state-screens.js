/* ================================================================
   RUN + MATCH STATE
   ================================================================ */
var run = null;      // { binder:[{key,prov}], rivalIdx, rivals:[deep copies] }
var M = null;        // match state
var mode = 'menu';   // menu|idle|aim|rival|drop|sim|over
var pendingBooms = 0, animCount = 0, turnEnding = false;
var slammer = null;  // active slammer body
var aimPos = { x: 0, z: 0 }, aimT = 0, power = 0;
var rivalPlan = null;
var bannerTimer = null, barkTimer = null;

/* ?stage=N — debug/harness start: jump the court, pad the war chest */
var DBG_STAGE = (function(){
  var m = location.search.match(/[?&]stage=(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
})();
function newRun(stackKey){
  var stack = STACKS[stackKey || 'sandlot'];
  var rivals = {};
  Object.keys(RIVALS).forEach(function(k){
    var r = RIVALS[k], c = {};
    for (var kk in r) c[kk] = r[kk];
    c.binder = r.binder.slice();
    rivals[k] = c;
  });
  run = {
    stackKey: stackKey || 'sandlot',
    binder: stack.binder.map(function(k){ return { key: k, prov: null, finish: null, wear: 0 }; }),
    stage: 0,
    path: {},                    /* forks taken: stage index -> option index */
    money: 0,                    /* Lunch Money — the earned build budget */
    pouch: stack.pouch.slice(),
    slammer: stack.pouch[0],
    rumorKnown: false,
    beaten: [],
    stats: { matches: 0, wins: 0, caps: 0, lost: 0, earned: 0 },
    rivals: rivals
  };
  if (DBG_STAGE){
    run.stage = Math.min(DBG_STAGE, COURT.length - 1);
    run.money = 25;
    ['mecha','manhole','magnet','rubber','double','whoopee','feather','gum','star','skull']
      .forEach(function(k){ run.binder.push({ key: k, prov: null, finish: null, wear: 0 }); });
    tlog('DEBUG start at stage ' + run.stage);
  }
}
function curRival(){ return run.rivals[curNode().r]; }
/* every chip that enters the Binder is recorded in the all-time Collection */
function binderAdd(entry){
  run.binder.push(entry);
  try{
    var coll = JSON.parse(localStorage.getItem('slam_coll') || '{}');
    coll[entry.key] = (coll[entry.key] || 0) + 1;
    localStorage.setItem('slam_coll', JSON.stringify(coll));
  }catch(e){}
}

/* ---------- screens ---------- */
function showScreen(id){
  ['title','stacks','collection','ante','result','runend','map','store','binder'].forEach(function(s){
    el(s).classList.toggle('show', s === id);
  });
  el('hud').classList.toggle('show', id === null);
}

/* ---------- the in-run Binder: what you carry, where it came from ---------- */
function openBinder(){
  el('bindersub').textContent = run.binder.length + ' chips · LUNCH MONEY $' + run.money;
  var g = el('rbgrid'); g.innerHTML = '';
  run.binder.forEach(function(entry){
    var d = DESIGNS[entry.key];
    var card = document.createElement('div');
    card.className = 'tz ' + d.rarity;
    var line = d.fxdesc || (entry.prov ? 'won off ' + entry.prov : 'from the starter page');
    card.innerHTML = '<img src="' + designURL(entry.key) + '"' +
      ((entry.wear || 0) >= 3 ? ' style="filter:grayscale(.25) contrast(.92)"' : '') +
      '><div class="nm">' + d.name + '</div><div class="fx">' + line + '</div>' +
      (entry.prov && d.fxdesc ? '<div class="fx" style="color:var(--pop)">won off ' + entry.prov + '</div>' : '') +
      (entry.finish ? '<div class="fnsh">' + entry.finish.toUpperCase() + '</div>' : '') +
      ((entry.wear || 0) >= 3 ? '<div class="wear">SURVIVOR ×' + entry.wear + '</div>' : '');
    g.appendChild(card);
  });
  /* plastic-sleeve empties: the page always has room for more */
  for (var i = 0; i < Math.max(0, 3 - (run.binder.length % 3 || 3)) + 3; i++){
    var slot = document.createElement('div');
    slot.className = 'tz slot';
    slot.innerHTML = '<div style="width:52px;height:52px;border-radius:50%;border:2px dashed #4a4058"></div>';
    g.appendChild(slot);
  }
  el('rbpouch').textContent = 'SLAMMER POUCH: ' +
    run.pouch.map(function(k){ return SLAMMERS[k].name + (k === run.slammer ? ' ✓' : ''); }).join(' · ');
  showScreen('binder');
}

/* ---------- court map: four acts, forks you pick ---------- */
function showMap(){
  var wrap = el('mapnodes'); wrap.innerHTML = '';
  var curAct = COURT[run.stage].act;
  var curEl = null;
  COURT.forEach(function(layer, i){
    if (i === 0 || COURT[i - 1].act !== layer.act){
      var h = document.createElement('div');
      h.className = 'actline';
      h.textContent = 'ACT ' + (layer.act + 1) + ' — ' + ACTS[layer.act];
      if (layer.act > curAct) h.style.opacity = 0.35;
      wrap.appendChild(h);
    }
    var row = document.createElement('div');
    row.className = 'maprow';
    var picked = Math.min(run.path[i] || 0, layer.opts.length - 1);
    layer.opts.forEach(function(n, oi){
      var d = document.createElement('div');
      d.className = 'mapnode card';
      /* rivals in future acts stay rumors */
      var mystery = n.t === 'match' && layer.act > curAct;
      var label = n.t === 'store' ? 'THE CORNER STORE'
        : (mystery ? '?????' : RIVALS[n.r].turf + ' — ' + RIVALS[n.r].name);
      var st;
      if (i < run.stage) st = (layer.opts.length > 1 && picked !== oi) ? 'PASSED' : 'BEAT';
      else if (i === run.stage){
        st = layer.opts.length > 1 ? (picked === oi ? 'NOW' : 'OR...') : 'NOW';
        d.classList.add(picked === oi ? 'cur' : 'alt');
        if (layer.opts.length > 1)
          d.addEventListener('click', function(){ run.path[i] = oi; showMap(); });
        if (picked === oi) curEl = d;
      } else st = 'LOCKED';
      if (i !== run.stage) d.style.opacity = i < run.stage ? 0.45 : 0.7;
      d.innerHTML = '<span>' + label + '</span><span class="st">' + st + '</span>';
      row.appendChild(d);
    });
    wrap.appendChild(row);
  });
  el('mapmoney').textContent = 'LUNCH MONEY: $' + run.money;
  var boss = curNodeRival();
  el('maprumor').textContent = run.rumorKnown && boss && boss.rule
    ? 'rumor: ' + boss.name + ' plays ' + boss.ruleName : '';
  showScreen('map');
  if (curEl) setTimeout(function(){ try{ curEl.scrollIntoView({ block: 'center' }); }catch(e){} }, 30);
  mark('map');
  if (AUTO) setTimeout(function(){
    var L = COURT[run.stage];
    if (L.opts.length > 1) run.path[run.stage] = Math.floor(rnd(0, L.opts.length));
    el('gobtn').click();
  }, 150);
}
function curNodeRival(){
  for (var i = run.stage; i < COURT.length; i++){
    var n = stageNode(i);
    if (n.t === 'match') return run.rivals[n.r];
  }
  return null;
}

/* ================================================================
   CORNER STORE v2 — Lunch Money economy (vision §4).
   Singles wall · Blind Bags (the ritual) · Trade Counter · Rumors.
   ================================================================ */
var CHIP_PRICE = { 1: 3, 2: 5, 3: 8 };
var SELL_PRICE = { 1: 1, 2: 2, 3: 4 };
var BAGS = {
  chum:  { name: 'CHUM BAG',  cost: 4, desc: '3 commons — ante fodder', tint: '#6d7b8d' },
  weird: { name: 'WEIRD BAG', cost: 5, desc: '2 rares from the effect pool', tint: '#b14aed' },
  heavy: { name: 'HEAVY BAG', cost: 5, desc: '2 weight & field chips', tint: '#e0863d' },
  foil:  { name: 'FOIL BAG',  cost: 6, desc: '1 chip · big odds · a finish inside', tint: '#7fd9c0' }
};
var POOL_COMMON = ['smiley','pizza','alien','star','skull','cat','hypno','duck'];
var POOL_EFFECT = ['rubber','double','whoopee','vhs'];
var POOL_PHYS = ['feather','manhole','magnet','gum'];
function chipPool(){ return POOL_COMMON.concat(POOL_EFFECT, POOL_PHYS); }
function rollSingle(){
  var r = Math.random();
  if (r < 0.06) return 'mecha';
  if (r < 0.45) return (r < 0.25 ? POOL_EFFECT : POOL_PHYS)[Math.floor(rnd(0, 4))];
  return POOL_COMMON[Math.floor(rnd(0, POOL_COMMON.length))];
}
function genStore(){
  var singles = [
    { type: 'chip', key: rollSingle() },
    { type: 'chip', key: rollSingle() }
  ];
  var slams = Object.keys(SLAMMERS).filter(function(k){ return run.pouch.indexOf(k) < 0; });
  if (slams.length) singles.push({ type: 'slammer', key: slams[Math.floor(rnd(0, slams.length))] });
  singles.forEach(function(o){
    o.price = o.type === 'slammer' ? 7 : CHIP_PRICE[rank(o.key)];
    o.sold = false;
  });
  return {
    singles: singles,
    bagsSold: {},
    collecting: chipPool()[Math.floor(rnd(0, chipPool().length))],
    rumorSold: false
  };
}
var storeMode = 'buy';
function openStore(){
  if (!run.store || run.storeStage !== run.stage){
    run.store = genStore();
    run.storeStage = run.stage;
    /* piggy bank: saving is a strategy */
    var piggy = Math.min(5, Math.floor(run.money / 5));
    if (piggy > 0){
      run.money += piggy;
      tlog('MONEY piggy +' + piggy + ' -> ' + run.money);
      run.store.piggy = piggy;
    }
  }
  storeMode = 'buy';
  renderStore();
  showScreen('store');
  mark('store');
  if (AUTO){
    setTimeout(function(){
      var bags = ['foil', 'weird', 'heavy', 'chum'];
      for (var bi = 0; bi < bags.length; bi++){
        if (!run.store.bagsSold[bags[bi]] && run.money >= BAGS[bags[bi]].cost){
          buyBag(bags[bi]); break;
        }
      }
      setTimeout(function(){
        var s = run.store.singles[0];
        if (s && !s.sold && run.money >= s.price) buySingle(0);
        setTimeout(function(){ el('leavebtn').click(); }, 250);
      }, AUTO ? 400 : 2000);
    }, 250);
  }
}
function storeMoneyLine(){
  return 'LUNCH MONEY: $' + run.money +
    (run.store.piggy ? ' (piggy bank paid +$' + run.store.piggy + ')' : '') +
    ' · he\'s collecting ' + DESIGNS[run.store.collecting].name + ' this week (+$2)';
}
function renderStore(){
  el('payline').textContent = storeMoneyLine();
  var w = el('offers'); w.innerHTML = '';
  if (storeMode === 'buy'){
    run.store.singles.forEach(function(o, i){
      var d = DESIGNS[o.key];
      var card = document.createElement('div');
      card.className = 'tz ' + d.rarity + (o.sold ? ' soldout' : '');
      card.innerHTML = '<img src="' + designURL(o.key) + '"><div class="nm">' + d.name +
        '</div><div class="fx">' + (o.type === 'slammer' ? 'slammer — ' + SLAMMERS[o.key].desc : d.fxdesc) +
        '</div><div class="fx" style="color:var(--pop)">' + (o.sold ? 'SOLD' : '$' + o.price) + '</div>';
      if (!o.sold) card.addEventListener('click', function(){ buySingle(i); });
      w.appendChild(card);
    });
    Object.keys(BAGS).forEach(function(bk){
      var b = BAGS[bk], sold = run.store.bagsSold[bk];
      var card = document.createElement('div');
      card.className = 'tz bag' + (sold ? ' soldout' : '');
      card.innerHTML = '<div class="bagart" style="--tint:' + b.tint + '"></div><div class="nm">' + b.name +
        '</div><div class="fx">' + b.desc + '</div>' +
        '<div class="fx" style="color:var(--pop)">' + (sold ? 'SOLD' : '$' + b.cost) + '</div>';
      if (!sold) card.addEventListener('click', function(){ buyBag(bk); });
      w.appendChild(card);
    });
    if (!run.store.rumorSold){
      var rc = document.createElement('div');
      rc.className = 'tz';
      rc.innerHTML = '<div class="bagart" style="--tint:#4a4058"></div><div class="nm">RUMORS</div>' +
        '<div class="fx">what\'s the next boss playing?</div><div class="fx" style="color:var(--pop)">$1</div>';
      rc.addEventListener('click', buyRumor);
      w.appendChild(rc);
    }
  } else {
    /* the trade counter: sell from the Binder */
    run.binder.forEach(function(entry, i){
      var d = DESIGNS[entry.key];
      var price = SELL_PRICE[rank(entry.key)] + (entry.key === run.store.collecting ? 2 : 0);
      var card = document.createElement('div');
      card.className = 'tz ' + d.rarity;
      card.innerHTML = '<img src="' + designURL(entry.key) + '"><div class="nm">' + d.name +
        '</div><div class="fx" style="color:var(--mint,#7fd9c0)">sells for $' + price + '</div>';
      card.addEventListener('click', function(){ sellChip(i); });
      w.appendChild(card);
    });
    if (!w.children.length) w.innerHTML = '<div class="say" style="opacity:.6">an empty binder. tragic.</div>';
  }
  el('sellbtn').textContent = storeMode === 'buy' ? 'SELL INSTEAD' : 'BACK TO BUYING';
}
function buySingle(i){
  var o = run.store.singles[i];
  if (o.sold || run.money < o.price) return;
  run.money -= o.price;
  o.sold = true;
  if (o.type === 'slammer'){ run.pouch.push(o.key); }
  else binderAdd({ key: o.key, prov: 'THE CORNER STORE', finish: null, wear: 0 });
  sfxCash();
  tlog('STORE bought ' + o.key + ' $' + o.price + ' -> $' + run.money);
  renderStore();
}
function sellChip(i){
  var entry = run.binder[i];
  var price = SELL_PRICE[rank(entry.key)] + (entry.key === run.store.collecting ? 2 : 0);
  run.binder.splice(i, 1);
  run.money += price;
  sfxCash();
  tlog('STORE sold ' + entry.key + ' +$' + price + ' -> $' + run.money);
  renderStore();
}
function buyRumor(){
  if (run.store.rumorSold || run.money < 1) return;
  run.money -= 1;
  run.store.rumorSold = true;
  run.rumorKnown = true;
  var boss = curNodeRival();
  banner(boss && boss.rule ? boss.name + ' PLAYS ' + boss.ruleName : 'no rule. just rich.', 1600);
  tlog('STORE rumor -> $' + run.money);
  renderStore();
}
/* ---------- Blind Bags: the ritual ---------- */
function rollFinish(bag){
  if (bag === 'foil'){
    /* foil always shines — the question is HOW */
    var r = Math.random();
    if (r < 0.4) return 'holo';
    if (r < 0.55) return 'glow';
    if (r < 0.7) return 'metal';
    if (r < 0.8) return 'popup';
    if (r < 0.9) return 'infinity';
    return 'motion';
  }
  /* the misprint pool: factory accidents */
  if (Math.random() < 0.25)
    return ['static', 'wetink', 'xray', 'misprint'][Math.floor(rnd(0, 4))];
  return null;
}
function rollBag(type){
  var pulls = [];
  if (type === 'chum'){
    for (var i = 0; i < 3; i++) pulls.push({ key: POOL_COMMON[Math.floor(rnd(0, POOL_COMMON.length))], finish: null });
  } else if (type === 'weird'){
    for (var j = 0; j < 2; j++) pulls.push({ key: POOL_EFFECT[Math.floor(rnd(0, 4))], finish: rollFinish() });
  } else if (type === 'heavy'){
    for (var k = 0; k < 2; k++) pulls.push({ key: POOL_PHYS[Math.floor(rnd(0, 4))], finish: rollFinish() });
  } else {
    pulls.push({ key: Math.random() < 0.3 ? 'mecha' : POOL_EFFECT.concat(POOL_PHYS)[Math.floor(rnd(0, 8))], finish: rollFinish('foil') });
  }
  return pulls;
}
function buyBag(type){
  var b = BAGS[type];
  if (run.store.bagsSold[type] || run.money < b.cost) return;
  run.money -= b.cost;
  run.store.bagsSold[type] = true;
  var pulls = rollBag(type);
  pulls.forEach(function(p){
    binderAdd({ key: p.key, prov: 'BLIND BAG', finish: p.finish, wear: 0 });
    tlog('BAG ' + type + ' -> ' + p.key + (p.finish ? ' [' + p.finish.toUpperCase() + ']' : ''));
  });
  revealBag(b, pulls);
}
function revealBag(b, pulls){
  var ov = el('bagreveal');
  ov.innerHTML = '<div class="bagart big" style="--tint:' + b.tint + '"></div>';
  ov.classList.add('show');
  sfxCash();
  var t0 = AUTO ? 60 : 950;
  setTimeout(function(){
    ov.innerHTML = '';
    var row = document.createElement('div');
    row.className = 'bagrow';
    ov.appendChild(row);
    pulls.forEach(function(p, i){
      setTimeout(function(){
        var d = DESIGNS[p.key];
        var card = document.createElement('div');
        card.className = 'tz reveal ' + d.rarity;
        card.innerHTML = '<img src="' + designURL(p.key) + '"><div class="nm">' + d.name + '</div>' +
          (p.finish ? '<div class="fnsh">' + p.finish.toUpperCase() + '</div>' : '');
        row.appendChild(card);
        tone(400 + rank(p.key) * 260, 0.12, 'square', 0.07, 900);
      }, i * (AUTO ? 40 : 620));
    });
    setTimeout(function(){
      var ok = document.createElement('button');
      ok.textContent = "TAKE 'EM";
      ok.addEventListener('click', function(){
        ov.classList.remove('show');
        renderStore();
      });
      ov.appendChild(ok);
      if (AUTO) setTimeout(function(){ ok.click(); }, 60);
    }, pulls.length * (AUTO ? 40 : 620) + (AUTO ? 60 : 400));
  }, t0);
}
function banner(txt, ms){
  var b = el('banner');
  b.textContent = txt; b.style.opacity = 1;
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(function(){ b.style.opacity = 0; }, ms || 1100);
}
function bark(txt){
  var b = el('bark');
  b.textContent = txt; b.style.display = 'block';
  clearTimeout(barkTimer);
  barkTimer = setTimeout(function(){ b.style.display = 'none'; }, 2000);
}
function popupAt3D(pos, txt, color){
  var v = pos.clone().project(camera);
  var d = document.createElement('div');
  d.className = 'pop';
  d.style.left = ((v.x * 0.5 + 0.5) * el('gl').clientWidth) + 'px';
  d.style.top = ((-v.y * 0.5 + 0.5) * el('gl').clientHeight) + 'px';
  d.style.color = color || '#ffd23f';
  d.textContent = txt;
  el('fx').appendChild(d);
  setTimeout(function(){ d.remove(); }, 1050);
}


/* ---------- the front door: Starter Stacks + Collection (vision §2) ---------- */
function openStacks(){
  var w = el('stacklist'); w.innerHTML = '';
  Object.keys(STACKS).forEach(function(key){
    var s = STACKS[key], open = stackUnlocked(key);
    var d = document.createElement('div');
    d.className = 'mapnode card' + (open ? ' cur' : '');
    d.style.flexDirection = 'column';
    d.style.alignItems = 'flex-start';
    if (!open) d.style.opacity = 0.45;
    d.innerHTML = '<span>' + s.name + '</span>' +
      '<span class="st" style="text-transform:none">' + (open ? s.desc : 'LOCKED — ' + s.unlock) + '</span>' +
      (open ? '<span class="st">' + s.binder.length + ' chips · ' +
        s.pouch.map(function(k){ return SLAMMERS[k].name; }).join(' + ') + '</span>' : '');
    if (open) d.addEventListener('click', function(){
      newRun(key);
      showMap();
    });
    w.appendChild(d);
  });
  showScreen('stacks');
  if (AUTO) setTimeout(function(){ newRun('sandlot'); showMap(); }, 120);
}
function openCollection(){
  var coll = {};
  try{ coll = JSON.parse(localStorage.getItem('slam_coll') || '{}'); }catch(e){}
  var g = el('collgrid'); g.innerHTML = '';
  var owned = 0, total = 0;
  Object.keys(DESIGNS).forEach(function(key){
    var d = DESIGNS[key];
    if (['slammer','back','face','coin'].indexOf(d.rarity) >= 0) return;
    total++;
    var n = coll[key] || 0;
    if (n) owned++;
    var card = document.createElement('div');
    card.className = 'tz ' + d.rarity;
    card.innerHTML = '<img src="' + designURL(key) + '"' +
      (n ? '' : ' style="filter:brightness(0.12)"') + '><div class="nm">' +
      (n ? d.name : '???') + '</div>' +
      (n ? '<div class="fx">owned ×' + n + ' all-time</div>' : '');
    g.appendChild(card);
  });
  el('collsub').textContent = owned + ' of ' + total + ' designs ever owned';
  showScreen('collection');
}
