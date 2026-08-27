/* ================================================================
   SLAMMERS — playing-for-keeps tazo roguelite (proof of concept)
   ================================================================ */
var VERSION = '0.16.0';
var AUTO = /[?&]auto=1/.test(location.search);

/* ---------- diagnostics: breadcrumbs, error banner, version ---------- */
function mark(stage){ try{ sessionStorage.setItem('slam_stage', stage); }catch(e){} }
function showErr(msg){
  var e = document.getElementById('err');
  e.textContent = msg; e.style.display = 'block';
}
window.onerror = function(msg, src, line){ showErr('ERR: ' + msg + ' @' + line); mark('error:' + msg); return false; };
(function(){
  try{
    var prev = sessionStorage.getItem('slam_stage');
    if (prev && prev !== 'clean') showErr('Previous run DIED at: ' + prev);
  }catch(e){}
  document.getElementById('ver').textContent = 'v' + VERSION + (AUTO ? ' [autotest]' : '');
})();
mark('boot');
function tlog(s){
  if (!AUTO) return;
  document.getElementById('testlog').textContent += s + '\n';
  try{ console.log('[TEST] ' + s); }catch(e){}
}

