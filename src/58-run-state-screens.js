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

function newRun(){
  run = {
    binder: START_BINDER.map(function(k){ return { key: k, prov: null }; }),
    stage: 0,
    pouch: ['slammy', 'bouncer'],
    slammer: 'slammy',
    storeStock: [
      { type:'slammer', key:'drill', cost:2, sold:false },
      { type:'chip', key:'gum', cost:1, sold:false },
      { type:'chip', key:'manhole', cost:1, sold:false }
    ],
    rivals: RIVALS.map(function(r){
      var c = {}; for (var k in r) c[k] = r[k];
      c.binder = r.binder.slice();
      return c;
    })
  };
}
function curRival(){ return run.rivals[NODES[run.stage].r]; }

/* ---------- screens ---------- */
function showScreen(id){
  ['title','ante','result','runend','map','store'].forEach(function(s){
    el(s).classList.toggle('show', s === id);
  });
  el('hud').classList.toggle('show', id === null);
}

/* ---------- court map ---------- */
function showMap(){
  var wrap = el('mapnodes'); wrap.innerHTML = '';
  NODES.forEach(function(n, i){
    var d = document.createElement('div');
    d.className = 'mapnode card' + (i === run.stage ? ' cur' : '');
    var label = n.t === 'store' ? 'THE CORNER STORE'
      : run.rivals[n.r].turf + ' — ' + run.rivals[n.r].name;
    var st = i < run.stage ? 'BEAT' : (i === run.stage ? 'NOW' : 'LOCKED');
    d.innerHTML = '<span>' + label + '</span><span class="st">' + st + '</span>';
    wrap.appendChild(d);
  });
  showScreen('map');
  mark('map');
  if (AUTO) setTimeout(function(){ el('gobtn').click(); }, 150);
}

/* ---------- corner store ---------- */
var storeSel = { offer: -1, pay: [] };
function openStore(){
  storeSel = { offer: -1, pay: [] };
  renderOffers();
  el('payline').textContent = 'tap something to trade for';
  el('storegrid').innerHTML = '';
  el('tradebtn').disabled = true;
  showScreen('store');
  mark('store');
  if (AUTO){
    setTimeout(function(){
      for (var oi = 0; oi < run.storeStock.length; oi++){
        var o = run.storeStock[oi];
        if (o.sold || run.binder.length < o.cost + 3) continue;
        pickOffer(oi);
        var order = run.binder.map(function(e, i){ return i; })
          .sort(function(a, b){ return rank(run.binder[a].key) - rank(run.binder[b].key); });
        for (var k = 0; k < o.cost; k++) togglePay(order[k]);
        el('tradebtn').click();
        break;
      }
      setTimeout(function(){ el('leavebtn').click(); }, 300);
    }, 150);
  }
}
function renderOffers(){
  var w = el('offers'); w.innerHTML = '';
  run.storeStock.forEach(function(o, i){
    if (o.sold) return;
    if (o.type === 'slammer' && run.pouch.indexOf(o.key) >= 0){ o.sold = true; return; }
    var d = DESIGNS[o.key];
    var card = document.createElement('div');
    card.className = 'tz' + (i === storeSel.offer ? ' staked' : '');
    card.innerHTML = '<img src="' + designURL(o.key) + '"><div class="nm">' + d.name +
      '</div><div class="fx">' + (o.type === 'slammer' ? 'slammer — ' + SLAMMERS[o.key].desc : d.fxdesc) +
      '</div><div class="fx" style="color:var(--pop)">costs ' + o.cost + ' tazo' + (o.cost > 1 ? 's' : '') + '</div>';
    card.addEventListener('click', function(){ pickOffer(i); });
    w.appendChild(card);
  });
  if (!w.children.length) w.innerHTML = '<div class="say" style="opacity:.6">sold out. quit loitering.</div>';
}
function pickOffer(i){
  storeSel.offer = i; storeSel.pay = [];
  var o = run.storeStock[i];
  el('payline').textContent = 'hand over ' + o.cost + ' — tap your tazos';
  renderOffers();
  buildStoreGrid();
  el('tradebtn').disabled = true;
}
function buildStoreGrid(){
  var g = el('storegrid'); g.innerHTML = '';
  run.binder.forEach(function(entry, i){
    var d = DESIGNS[entry.key];
    var card = document.createElement('div');
    card.className = 'tz ' + d.rarity + (storeSel.pay.indexOf(i) >= 0 ? ' staked' : '');
    card.innerHTML = '<img src="' + designURL(entry.key) + '"><div class="nm">' + d.name + '</div>';
    card.addEventListener('click', function(){ togglePay(i); });
    g.appendChild(card);
  });
}
function togglePay(i){
  if (storeSel.offer < 0) return;
  var o = run.storeStock[storeSel.offer];
  var at = storeSel.pay.indexOf(i);
  if (at >= 0) storeSel.pay.splice(at, 1);
  else { if (storeSel.pay.length >= o.cost) return; storeSel.pay.push(i); }
  buildStoreGrid();
  el('tradebtn').disabled = storeSel.pay.length !== o.cost;
}
function doTrade(){
  var o = run.storeStock[storeSel.offer];
  storeSel.pay.slice().sort(function(a, b){ return b - a; })
    .forEach(function(i){ run.binder.splice(i, 1); });
  o.sold = true;
  if (o.type === 'slammer') run.pouch.push(o.key);
  else run.binder.push({ key: o.key, prov: 'THE CORNER STORE' });
  tlog('TRADE bought ' + o.key + ' for ' + o.cost);
  storeSel = { offer: -1, pay: [] };
  el('payline').textContent = 'pleasure doing business.';
  el('storegrid').innerHTML = '';
  el('tradebtn').disabled = true;
  renderOffers();
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

