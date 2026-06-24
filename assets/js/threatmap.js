/* Global Threat Map — original real-time-style visualization.
   Finer dotted world map + colour-coded attack arcs + scrolling live feed.
   No external data/feed; figures are illustrative industry estimates.
   Respects prefers-reduced-motion and pauses when off-screen. */
(function () {
  'use strict';
  var canvas = document.getElementById('threatCanvas');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var wrap = canvas.parentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ll(lat, lon) { return { x: (lon + 180) / 360, y: (90 - lat) / 180 }; }

  // Continents approximated as unions of circles (normalized equirectangular).
  var BLOBS = [
    [0.155,0.27,0.085],[0.205,0.32,0.07],[0.225,0.27,0.05],[0.12,0.30,0.05],[0.10,0.22,0.045],
    [0.18,0.19,0.05],[0.255,0.40,0.03],[0.30,0.13,0.038],[0.245,0.45,0.02],
    [0.30,0.58,0.05],[0.315,0.66,0.045],[0.285,0.52,0.04],[0.33,0.74,0.028],
    [0.485,0.235,0.034],[0.51,0.215,0.03],[0.46,0.25,0.024],[0.53,0.19,0.03],
    [0.51,0.45,0.05],[0.535,0.52,0.055],[0.555,0.60,0.04],[0.50,0.40,0.035],[0.575,0.45,0.03],
    [0.595,0.62,0.016],[0.575,0.37,0.035],
    [0.66,0.20,0.10],[0.74,0.22,0.08],[0.80,0.22,0.06],[0.685,0.32,0.06],[0.72,0.34,0.05],
    [0.63,0.30,0.04],[0.685,0.42,0.04],[0.745,0.47,0.03],[0.77,0.50,0.024],[0.80,0.32,0.04],
    [0.862,0.30,0.02],[0.76,0.55,0.03],[0.79,0.56,0.02],[0.83,0.66,0.055],[0.86,0.68,0.03],[0.93,0.72,0.016]
  ];
  function inLand(x, y) {
    for (var i = 0; i < BLOBS.length; i++) {
      var dx = x - BLOBS[i][0], dy = y - BLOBS[i][1], r = BLOBS[i][2];
      if (dx * dx + dy * dy < r * r) return true;
    }
    return false;
  }

  var HOTSPOTS = [
    { p: ll(40.7,-74),  n: 'New York',     f: '🇺🇸' },
    { p: ll(34,-118),   n: 'Los Angeles',  f: '🇺🇸' },
    { p: ll(51.5,-0.1), n: 'London',       f: '🇬🇧' },
    { p: ll(50,8.7),    n: 'Frankfurt',    f: '🇩🇪' },
    { p: ll(52.4,4.9),  n: 'Amsterdam',    f: '🇳🇱' },
    { p: ll(55.7,37.6), n: 'Moscow',       f: '🇷🇺' },
    { p: ll(39.9,116.4),n: 'Beijing',      f: '🇨🇳' },
    { p: ll(35.7,139.7),n: 'Tokyo',        f: '🇯🇵' },
    { p: ll(37.5,127),  n: 'Seoul',        f: '🇰🇷' },
    { p: ll(1.3,103.8), n: 'Singapore',    f: '🇸🇬' },
    { p: ll(3.1,101.7), n: 'Kuala Lumpur', f: '🇲🇾' },
    { p: ll(19,72.8),   n: 'Mumbai',       f: '🇮🇳' },
    { p: ll(25.2,55.3), n: 'Dubai',        f: '🇦🇪' },
    { p: ll(-23.5,-46.6),n:'Sao Paulo',    f: '🇧🇷' },
    { p: ll(6.5,3.4),   n: 'Lagos',        f: '🇳🇬' },
    { p: ll(-33.9,151.2),n:'Sydney',       f: '🇦🇺' }
  ];
  var TYPES = [
    { n: 'Malware',    c: '#FF453A' }, { n: 'Phishing',   c: '#FF9F0A' },
    { n: 'DDoS',       c: '#0A84FF' }, { n: 'Exploit',    c: '#BF5AF2' },
    { n: 'Botnet',     c: '#30D158' }, { n: 'Ransomware', c: '#FF2D55' }
  ];

  // Legend
  var legendEl = document.getElementById('tmLegend');
  if (legendEl) legendEl.innerHTML = TYPES.map(function (t) {
    return '<span><i style="background:' + t.c + '"></i>' + t.n + '</span>';
  }).join('');

  var W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2), dots = [];
  function resize() {
    var rect = wrap.getBoundingClientRect();
    W = Math.max(280, rect.width); H = W / 2;
    canvas.width = W * DPR; canvas.height = H * DPR;
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    dots = [];
    for (var x = 0.02; x < 0.99; x += 0.011)
      for (var y = 0.06; y < 0.96; y += 0.022)
        if (inLand(x, y)) dots.push([(x * W) | 0, (y * H) | 0]);
  }
  function px(p) { return [p.x * W, p.y * H]; }

  function drawMap() {
    ctx.fillStyle = 'rgba(120,150,190,0.26)';
    for (var i = 0; i < dots.length; i++) ctx.fillRect(dots[i][0], dots[i][1], 1.3, 1.3);
  }

  var arcs = [], ripples = [], session = 0, feed = [];
  function spawn() {
    var ai = (Math.random()*HOTSPOTS.length)|0, bi = (Math.random()*HOTSPOTS.length)|0;
    if (ai === bi) return;
    var a = HOTSPOTS[ai], b = HOTSPOTS[bi], ty = TYPES[(Math.random()*TYPES.length)|0];
    var p0 = px(a.p), p1 = px(b.p);
    var mx = (p0[0]+p1[0])/2, my = (p0[1]+p1[1])/2 - Math.hypot(p1[0]-p0[0], p1[1]-p0[1]) * 0.32;
    arcs.push({ p0:p0, c:[mx,my], p1:p1, t:0, sp:0.006+Math.random()*0.01, col:ty.c, a:a, b:b, ty:ty });
    session++;
  }
  function bez(p0,c,p1,t){ var u=1-t; return [u*u*p0[0]+2*u*t*c[0]+t*t*p1[0], u*u*p0[1]+2*u*t*c[1]+t*t*p1[1]]; }

  function pushFeed(arc) {
    var d = new Date();
    var hh = ('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2)+':'+('0'+d.getSeconds()).slice(-2);
    feed.unshift({ t: hh, ty: arc.ty, a: arc.a, b: arc.b });
    if (feed.length > 7) feed.pop();
    renderFeed();
  }
  var feedEl = document.getElementById('tmFeed');
  function renderFeed() {
    if (!feedEl) return;
    feedEl.innerHTML = feed.map(function (e) {
      return '<li><span class="t">' + e.t + '</span>'
        + '<span class="ty" style="color:' + e.ty.c + '">' + e.ty.n + '</span>'
        + '<span class="rt">' + e.a.f + ' ' + e.a.n + ' &rarr; ' + e.b.f + ' ' + e.b.n + '</span></li>';
    }).join('');
  }

  function frame() {
    ctx.fillStyle = 'rgba(6,7,12,0.20)'; ctx.fillRect(0, 0, W, H);
    drawMap();
    for (var h = 0; h < HOTSPOTS.length; h++) {
      var hp = px(HOTSPOTS[h].p), pr = 1.5 + Math.sin(Date.now()/520 + h) * 0.8;
      ctx.beginPath(); ctx.fillStyle = 'rgba(10,132,255,0.5)'; ctx.arc(hp[0], hp[1], pr, 0, 6.283); ctx.fill();
    }
    for (var i = arcs.length - 1; i >= 0; i--) {
      var ar = arcs[i]; ar.t += ar.sp;
      ctx.lineWidth = 1.6; ctx.strokeStyle = ar.col; ctx.globalAlpha = 0.92;
      ctx.beginPath();
      var steps = 14, t0 = Math.max(0, ar.t - 0.14);
      for (var s = 0; s <= steps; s++) { var t = t0 + (ar.t - t0) * (s/steps); var pt = bez(ar.p0,ar.c,ar.p1,t); s===0?ctx.moveTo(pt[0],pt[1]):ctx.lineTo(pt[0],pt[1]); }
      ctx.stroke(); ctx.globalAlpha = 1;
      var head = bez(ar.p0,ar.c,ar.p1,Math.min(ar.t,1));
      ctx.beginPath(); ctx.fillStyle = ar.col; ctx.arc(head[0], head[1], 2.3, 0, 6.283); ctx.fill();
      if (ar.t >= 1) { ripples.push({ x:ar.p1[0], y:ar.p1[1], r:1, col:ar.col }); pushFeed(ar); arcs.splice(i,1); }
    }
    for (var k = ripples.length - 1; k >= 0; k--) {
      var rp = ripples[k]; rp.r += 0.7;
      ctx.beginPath(); ctx.strokeStyle = rp.col; ctx.globalAlpha = Math.max(0, 1 - rp.r/22); ctx.lineWidth = 1.4;
      ctx.arc(rp.x, rp.y, rp.r, 0, 6.283); ctx.stroke(); ctx.globalAlpha = 1;
      if (rp.r > 22) ripples.splice(k,1);
    }
  }

  var elToday = document.getElementById('tmToday'), elLive = document.getElementById('tmLive');
  var RATE = 2200 / 86400;
  function midnightBase() { var d = new Date(); return Math.floor((d.getHours()*3600 + d.getMinutes()*60 + d.getSeconds()) * RATE); }
  function fmt(n){ return n.toLocaleString('en-US'); }
  function updateCounters() { if (elToday) elToday.textContent = fmt(midnightBase()); if (elLive) elLive.textContent = fmt(session); }

  var running = false, lastSpawn = 0, lastCount = 0;
  function loop(ts) {
    if (!running) return;
    frame();
    if (ts - lastSpawn > 360) { spawn(); lastSpawn = ts; }
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
    new IntersectionObserver(function (es) { es.forEach(function (e) { e.isIntersecting ? start() : stop(); }); }, { threshold: 0.12 }).observe(wrap);
  } else { start(); }
})();
