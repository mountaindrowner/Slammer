/* ================================================================
   AUDIO — oscillator bleeps, no files
   ================================================================ */
var AC = null;
function audioInit(){ if (AC) return; try{ AC = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} }
function tone(freq, dur, type, vol, sweep){
  if (!AC) return;
  try{
    var o = AC.createOscillator(), g = AC.createGain();
    o.type = type || 'square'; o.frequency.value = freq;
    if (sweep) o.frequency.exponentialRampToValueAtTime(Math.max(30,sweep), AC.currentTime + dur);
    g.gain.setValueAtTime(vol || 0.08, AC.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + dur);
    o.connect(g); g.connect(AC.destination);
    o.start(); o.stop(AC.currentTime + dur);
  }catch(e){}
}
function sfxThud(p){ tone(120 + 60*p, 0.18, 'sine', 0.16, 40); tone(70, 0.12, 'square', 0.07, 35); }
var lastClk = 0;
function sfxClack(v){
  var n = performance.now(); if (n - lastClk < 45) return; lastClk = n;
  tone(650 + Math.random()*320, 0.045, 'square', Math.min(0.09, v), 320);
}
function sfxTick(v){
  var n = performance.now(); if (n - lastClk < 45) return; lastClk = n;
  tone(210 + Math.random()*90, 0.05, 'sine', Math.min(0.07, v), 90);
}
function sfxFlip(){ tone(520, 0.09, 'square', 0.06, 900); }
function sfxBoing(){ tone(220, 0.25, 'sine', 0.1, 660); }
function sfxBoom(){ tone(90, 0.4, 'sawtooth', 0.14, 30); }
function sfxWin(){ tone(523,0.12,'square',0.07); setTimeout(function(){tone(659,0.12,'square',0.07);},120); setTimeout(function(){tone(784,0.2,'square',0.08);},240); }
function sfxLose(){ tone(300,0.2,'sawtooth',0.08,150); setTimeout(function(){tone(200,0.3,'sawtooth',0.08,90);},180); }

