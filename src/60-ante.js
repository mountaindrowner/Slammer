/* ================================================================
   ANTE SCREEN
   ================================================================ */
var anteSel = [];
function openAnte(){
  var r = curRival();
  var ante = Math.min(r.ante, run.binder.length, r.binder.length);
  if (run.binder.length === 0 || ante === 0){ endRun(false, 'cleaned'); return; }
  r.curAnte = ante;
  anteSel = [];
  el('demandwho').textContent = r.name + ' @ ' + r.turf;
  el('demandsay').textContent = r.demand;
  el('needline').textContent = needText(r);
  el('antecount').textContent = ante;
  /* rival stake preview: first N of his binder (face up so you can size the trade) */
  r.stake = r.binder.slice(0, ante);
  /* rule crown: the crown chip always rides in his stake */
  if (r.rule === 'crown' && r.stake.indexOf('crown') < 0 && r.binder.indexOf('crown') >= 0)
    r.stake[0] = 'crown';
  var pp = el('potprev'); pp.innerHTML = '';
  r.stake.forEach(function(k){
    var img = document.createElement('img');
    img.className = 'minitz'; img.src = designURL(k); img.title = DESIGNS[k].name;
    pp.appendChild(img);
  });
  var vs = document.createElement('div'); vs.className = 'vs'; vs.textContent = 'VS';
  pp.appendChild(vs);
  for (var i = 0; i < ante; i++){
    var slot = document.createElement('div');
    slot.className = 'minitz slot' + i; slot.style.cssText = 'width:40px;height:40px;border:2px dashed #666;border-radius:50%;background:#120d1c';
    slot.dataset.slot = i;
    pp.appendChild(slot);
  }
  buildBinderGrid(ante);
  el('slambtn').disabled = true;
  showScreen('ante');
  mark('ante');
  if (AUTO){
    setTimeout(function(){
      var order = run.binder.map(function(e, i){ return i; })
        .sort(function(a, b){ return rank(run.binder[b].key) - rank(run.binder[a].key); });
      for (var i = 0; i < ante; i++) toggleStake(order[i], ante);
      setTimeout(function(){ el('slambtn').click(); }, 60);
    }, 120);
  }
}
function buildBinderGrid(ante){
  var g = el('bindergrid'); g.innerHTML = '';
  run.binder.forEach(function(entry, i){
    var d = DESIGNS[entry.key];
    var card = document.createElement('div');
    card.className = 'tz ' + d.rarity;
    var line = d.fxdesc || (entry.prov ? 'won off ' + entry.prov : '');
    card.innerHTML = '<img src="' + designURL(entry.key) + '"' +
      ((entry.wear || 0) >= 3 ? ' style="filter:grayscale(.25) contrast(.92)"' : '') +
      '><div class="nm">' + d.name +
      '</div><div class="fx">' + line + ' · LOYALTY +' + rank(entry.key) + '</div>' +
      (entry.finish ? '<div class="fnsh">' + entry.finish.toUpperCase() + '</div>' : '') +
      ((entry.wear || 0) >= 3 ? '<div class="wear">SURVIVOR ×' + entry.wear + '</div>' : '');
    card.addEventListener('click', function(){ toggleStake(i, ante); });
    g.appendChild(card);
  });
}
function toggleStake(i, ante){
  var at = anteSel.indexOf(i);
  if (at >= 0) anteSel.splice(at, 1);
  else { if (anteSel.length >= ante) return; anteSel.push(i); }
  var cards = el('bindergrid').children;
  for (var c = 0; c < cards.length; c++) cards[c].classList.toggle('staked', anteSel.indexOf(c) >= 0);
  /* fill preview slots */
  var slots = el('potprev').querySelectorAll('[data-slot]');
  slots.forEach(function(s, si){
    if (anteSel[si] !== undefined){
      s.style.background = '#1d1630 url(' + designURL(run.binder[anteSel[si]].key) + ')';
      s.style.backgroundSize = 'cover'; s.style.borderStyle = 'solid';
    } else { s.style.background = '#1a103a'; s.style.borderStyle = 'dashed'; }
  });
  el('slambtn').disabled = !demandOK(curRival());
}
function needText(r){
  if (r.need === 'rare') return 'DEMAND: at least one rare or better';
  if (r.need === 'best') return 'DEMAND: your best tazo must be in the pot';
  return '';
}
function demandOK(r){
  if (anteSel.length !== r.curAnte) return false;
  if (!r.need) return true;
  var ranks = anteSel.map(function(i){ return rank(run.binder[i].key); });
  if (r.need === 'rare'){
    var hasAny = run.binder.some(function(e){ return rank(e.key) >= 2; });
    return !hasAny || ranks.some(function(v){ return v >= 2; });
  }
  if (r.need === 'best'){
    var mx = 0;
    run.binder.forEach(function(e){ mx = Math.max(mx, rank(e.key)); });
    return ranks.indexOf(mx) >= 0;
  }
  return true;
}

