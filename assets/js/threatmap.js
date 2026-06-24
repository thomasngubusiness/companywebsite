/* Global Threat Map — original, self-contained canvas visualization.
   Dotted world map + animated attack arcs + live-ish counters.
   No external data/feed; figures are illustrative industry estimates.
   Respects prefers-reduced-motion and pauses when off-screen. */
(function () {
  'use strict';
  var canvas = document.getElementById('threatCanvas');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var wrap = canvas.parentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ll(lat,lon) -> normalized equirectangular [0..1]
  function ll(lat, lon) { return { x: (lon + 180) / 360, y: (90 - lat) / 180 }; }

  // Continents approximated as unions of circles (normalized space).
  var BLOBS = [
    [0.16,0.28,0.10],[0.22,0.34,0.075],[0.20,0.21,0.06],[0.125,0.32,0.055],[0.235,0.45,0.028], // N/C America
    [0.285,0.62,0.07],[0.305,0.70,0.05],[0.27,0.55,0.05],                                       // S America
    [0.49,0.25,0.05],[0.525,0.225,0.038],[0.46,0.28,0.03],                                       // Europe
    [0.52,0.52,0.09],[0.50,0.44,0.06],[0.55,0.60,0.052],[0.515,0.66,0.035],                      // Africa
    [0.58,0.37,0.04],                                                                            // Middle East
    [0.68,0.30,0.12],[0.745,0.39,0.07],[0.63,0.31,0.06],[0.79,0.30,0.06],[0.665,0.45,0.045],     // Asia
    [0.745,0.48,0.04],[0.83,0.68,0.062],[0.86,0.71,0.03]                                         // India/SEA/Australia
  ];
  function inLand(x, y) {
    for (var i = 0; i < BLOBS.length; i++) {
      var dx = x - BLOBS[i][0], dy = (y - BLOBS[i][1]) * 1.0, r = BLOBS[i][2];
      if (dx * dx + dy * dy < r * r) return true;
    }
    return false;
  }

  var HOTSPOTS = [
    ll(40.7,-74),ll(34,-118),ll(19.4,-99),ll(-23.5,-46.6),ll(51.5,-0.1),ll(50,8.7),
    ll(55.7,37.6),ll(25.2,55.3),ll(1.3,103.8),ll(39.9,116.4),ll(35.7,139.7),ll(19,72.8),
    ll(-33.9,151.2),ll(6.5,3.4),ll(-26.2,28),ll(31.2,121.5)
  ];

  var W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2), dots = [];
  function resize() {
    var rect = wrap.getBoundingClientRect();
    W = Math.max(280, rect.width); H = W / 2;
    canvas.width = W * DPR; canvas.height = H * DPR;
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    dots = [];
    var stepX = 0.0125, stepY = 0.025;
    for (var x = 0.02; x < 0.99; x += stepX)
      for (var y = 0.06; y < 0.96; y += stepY)
        if (inLand(x, y)) dots.push([x * W + (Math.random()-0.5)*2, y * H + (Math.random()-0.5)*2]);
  }

  function px(p) { return [p.x * W, p.y * H]; }
  function drawMap() {
    ctx.fillStyle = 'rgba(120,150,190,0.28)';
    for (var i = 0; i < dots.length; i++) { ctx.beginPath(); ctx.arc(dots[i][0], dots[i][1], 0.9, 0, 6.283); ctx.fill(); }
  }

  var arcs = [], ripples = [], session = 0, ACCENTS = ['#FF453A','#FF9F0A','#0A84FF','#BF5AF2','#30D158'];
  function spawn() {
    var a = HOTSPOTS[(Math.random()*HOTSPOTS.length)|0], b = HOTSPOTS[(Math.random()*HOTSPOTS.length)|0];
    if (a === b) return;
    var p0 = px(a), p1 = px(b);
    var mx = (p0[0]+p1[0])/2, my = (p0[1]+p1[1])/2 - Math.hypot(p1[0]-p0[0], p1[1]-p0[1]) * 0.32;
    arcs.push({ p0:p0, c:[mx,my], p1:p1, t:0, sp:0.006+Math.random()*0.01, col:ACCENTS[(Math.random()*ACCENTS.length)|0] });
    session++;
  }
  function bez(p0,c,p1,t){ var u=1-t; return [u*u*p0[0]+2*u*t*c[0]+t*t*p1[0], u*u*p0[1]+2*u*t*c[1]+t*t*p1[1]]; }

  function frame() {
    ctx.fillStyle = 'rgba(6,7,12,0.20)'; ctx.fillRect(0, 0, W, H);   // fade trails
    drawMap();
    // hotspots pulse
    for (var h = 0; h < HOTSPOTS.length; h++) {
      var hp = px(HOTSPOTS[h]); var pr = 1.6 + Math.sin(Date.now()/500 + h) * 0.8;
      ctx.beginPath(); ctx.fillStyle = 'rgba(10,132,255,0.5)'; ctx.arc(hp[0], hp[1], pr, 0, 6.283); ctx.fill();
    }
    for (var i = arcs.length - 1; i >= 0; i--) {
      var a = arcs[i]; a.t += a.sp;
      // trailing comet
      ctx.lineWidth = 1.6; ctx.strokeStyle = a.col; ctx.globalAlpha = 0.9;
      ctx.beginPath();
      var steps = 14, t0 = Math.max(0, a.t - 0.14);
      for (var s = 0; s <= steps; s++) { var t = t0 + (a.t - t0) * (s / steps); var pt = bez(a.p0,a.c,a.p1,t); if (s===0) ctx.moveTo(pt[0],pt[1]); else ctx.lineTo(pt[0],pt[1]); }
      ctx.stroke(); ctx.globalAlpha = 1;
      var head = bez(a.p0,a.c,a.p1,Math.min(a.t,1));
      ctx.beginPath(); ctx.fillStyle = a.col; ctx.arc(head[0], head[1], 2.2, 0, 6.283); ctx.fill();
      if (a.t >= 1) { ripples.push({ x:a.p1[0], y:a.p1[1], r:1, col:a.col }); arcs.splice(i,1); }
    }
    for (var k = ripples.length - 1; k >= 0; k--) {
      var rp = ripples[k]; rp.r += 0.7;
      ctx.beginPath(); ctx.strokeStyle = rp.col; ctx.globalAlpha = Math.max(0, 1 - rp.r/22); ctx.lineWidth = 1.4;
      ctx.arc(rp.x, rp.y, rp.r, 0, 6.283); ctx.stroke(); ctx.globalAlpha = 1;
      if (rp.r > 22) ripples.splice(k,1);
    }
  }

  // counters
  var elToday = document.getElementById('tmToday'), elLive = document.getElementById('tmLive');
  var RATE = 2200 / 86400; // ~1 every 39s (widely cited)
  function midnightBase() { var d = new Date(); var s = d.getHours()*3600 + d.getMinutes()*60 + d.getSeconds(); return Math.floor(s * RATE); }
  function fmt(n){ return n.toLocaleString('en-US'); }
  function updateCounters() {
    if (elToday) elToday.textContent = fmt(midnightBase());
    if (elLive) elLive.textContent = fmt(session);
  }

  var running = false, lastSpawn = 0, lastCount = 0;
  function loop(ts) {
    if (!running) return;
    frame();
    if (ts - lastSpawn > 380) { spawn(); lastSpawn = ts; }
    if (ts - lastCount > 500) { updateCounters(); lastCount = ts; }
    requestAnimationFrame(loop);
  }

  function start() { if (running || reduce) return; running = true; requestAnimationFrame(loop); }
  function stop() { running = false; }

  resize();
  window.addEventListener('resize', function () { clearTimeout(window.__tmR); window.__tmR = setTimeout(function(){ resize(); if (reduce) { ctx.fillStyle='#06070C'; ctx.fillRect(0,0,W,H); drawMap(); } }, 150); });

  if (reduce) {
    ctx.fillStyle = '#06070C'; ctx.fillRect(0, 0, W, H); drawMap();
    if (elToday) elToday.textContent = fmt(midnightBase());
    if (elLive) elLive.textContent = '—';
    return;
  }
  ctx.fillStyle = '#06070C'; ctx.fillRect(0, 0, W, H);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { es.forEach(function (e) { e.isIntersecting ? start() : stop(); }); }, { threshold: 0.15 }).observe(wrap);
  } else { start(); }
})();
