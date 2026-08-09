/* ================================================================
   HELPERS
   ================================================================ */
function el(id){ return document.getElementById(id); }
function clamp(v,a,b){ return v < a ? a : (v > b ? b : v); }
function rnd(a,b){ return a + Math.random() * (b - a); }
function hdist(ax,az,bx,bz){ var dx=ax-bx, dz=az-bz; return Math.sqrt(dx*dx+dz*dz); }

