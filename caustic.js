/* ============================================================
   Caustic renderer (Forward physics model of Photophane).

   Parallel light refracts through a dynamic height field
   via Snell's law gradient calculation and accumulates bilinearly.
   Renders in both Light Mode (warm amber refraction on paper)
   and Dark Mode (white/gold filaments on ink).
   Includes interactive mouse light tracking, intersection observer
   lifecycle pausing, and prefers-reduced-motion safety.
   ============================================================ */

(function () {
  'use strict';

  var canvas = document.getElementById('caustic');
  if (!canvas) return;

  var ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var BW = 180, BH = 102;
  var CELLS = BW * BH;

  var RX = 380, RY = 216;
  var NR = RX * RY;

  var accR = new Float32Array(CELLS);
  var accG = new Float32Array(CELLS);
  var accB = new Float32Array(CELLS);
  var tmp  = new Float32Array(CELLS);

  var buf = document.createElement('canvas');
  buf.width = BW; buf.height = BH;
  var bctx = buf.getContext('2d');
  var img = bctx.createImageData(BW, BH);
  var px = img.data;

  var jx = new Float32Array(NR), jy = new Float32Array(NR);
  var seed = 1337;
  function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
  for (var i = 0; i < NR; i++) { jx[i] = rnd() - 0.5; jy[i] = rnd() - 0.5; }

  var WV = [
    [0.60,  3.10,  1.000,  0.000,  0.00,  0.075],
    [0.46,  4.70,  0.310,  0.951,  1.90,  0.055],
    [0.38,  6.30, -0.707,  0.707,  3.60, -0.043],
    [0.24,  9.40,  0.860, -0.510,  0.80,  0.092],
    [0.17, 13.10, -0.260, -0.966,  2.40, -0.064]
  ];
  var NW = WV.length;
  var amp = new Float32Array(NW), fq = new Float32Array(NW),
      wdx = new Float32Array(NW), wdy = new Float32Array(NW), ph = new Float32Array(NW);
  for (var w = 0; w < NW; w++) {
    amp[w] = WV[w][0]; fq[w] = WV[w][1]; wdx[w] = WV[w][2]; wdy[w] = WV[w][3];
  }

  var pointerX = 0.65, pointerY = 0.35;
  var lampX = 0.65, lampY = 0.35;
  var rowStep = 1;

  var KR = 0.0530, KG = 0.0556, KB = 0.0584;

  var vign = new Float32Array(CELLS);
  (function buildVignette() {
    for (var y = 0; y < BH; y++) {
      for (var x = 0; x < BW; x++) {
        var nx = (x / BW - 0.5) * 2.0;
        var ny = (y / BH - 0.5) * 2.0;
        var d = Math.sqrt(nx * nx * 0.66 + ny * ny * 1.05);
        var v = 1.0 - d * 0.75;
        if (v < 0) v = 0;
        vign[y * BW + x] = v * v;
      }
    }
  })();

  function splat(acc, u, v, weight) {
    var x0 = Math.floor(u), y0 = Math.floor(v);
    if (x0 < 0 || y0 < 0 || x0 >= BW - 1 || y0 >= BH - 1) return;
    var fx = u - x0, fy = v - y0;
    var gx = 1 - fx, gy = 1 - fy;
    var o = y0 * BW + x0;
    acc[o]          += weight * gx * gy;
    acc[o + 1]      += weight * fx * gy;
    acc[o + BW]     += weight * gx * fy;
    acc[o + BW + 1] += weight * fx * fy;
  }

  function blur(acc) {
    var x, y, o;
    for (var pass = 0; pass < 1; pass++) {
      for (y = 0; y < BH; y++) {
        o = y * BW;
        var prev = acc[o];
        for (x = 0; x < BW; x++) {
          var cur = acc[o + x];
          var next = (x + 1 < BW) ? acc[o + x + 1] : cur;
          tmp[o + x] = (prev + 2 * cur + next) * 0.25;
          prev = cur;
        }
      }
      for (x = 0; x < BW; x++) {
        var up = tmp[x];
        for (y = 0; y < BH; y++) {
          o = y * BW + x;
          var c2 = tmp[o];
          var dn = (y + 1 < BH) ? tmp[o + BW] : c2;
          acc[o] = (up + 2 * c2 + dn) * 0.25;
          up = c2;
        }
      }
    }
  }

  function render(t) {
    accR.fill(0); accG.fill(0); accB.fill(0);

    lampX += (pointerX - lampX) * 0.05;
    lampY += (pointerY - lampY) * 0.05;

    var tiltX = (lampX - 0.5) * 0.30;
    var tiltY = (lampY - 0.5) * 0.20;

    for (var s = 0; s < NW; s++) ph[s] = WV[s][4] + t * WV[s][5];

    for (var ry = 0; ry < RY; ry += rowStep) {
      var k = ry * RX;
      for (var rx = 0; rx < RX; rx++, k++) {
        var x = (rx + 0.5 + jx[k]) / RX;
        var y = (ry + 0.5 + jy[k]) / RY;

        var gx = 0.0, gy = 0.0;
        for (var q = 0; q < NW; q++) {
          var c = Math.cos(fq[q] * (x * wdx[q] + y * wdy[q]) + ph[q]) * amp[q] * fq[q];
          gx += c * wdx[q];
          gy += c * wdy[q];
        }

        var gx2 = gx + 0.58 * gx * Math.abs(gy);
        var gy2 = gy + 0.58 * gy * Math.abs(gx);

        var bx = x + tiltX, by = y + tiltY;

        splat(accR, (bx + KR * gx2) * BW, (by + KR * gy2) * BH, 1);
        splat(accG, (bx + KG * gx2) * BW, (by + KG * gy2) * BH, 1);
        splat(accB, (bx + KB * gx2) * BW, (by + KB * gy2) * BH, 1);
      }
    }

    blur(accR); blur(accG); blur(accB);

    var mean = (RX * Math.ceil(RY / rowStep)) / CELLS;
    var gain = 0.62 / mean;
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    for (var p = 0, o = 0; p < CELLS; p++, o += 4) {
      var vg = vign[p];
      var r = 1.0 - Math.exp(-accR[p] * gain);
      var g = 1.0 - Math.exp(-accG[p] * gain);
      var b = 1.0 - Math.exp(-accB[p] * gain);
      var lum = (r + g + b) * 0.3333;

      if (isDark) {
        // Dark Mode: warm white/tungsten filaments on dark ground
        var aDark = Math.pow(lum, 1.45) * vg * 2.15;
        px[o]     = 255 * Math.min(1, r * 1.00 + lum * 0.20);
        px[o + 1] = 255 * Math.min(1, g * 0.95 + lum * 0.14);
        px[o + 2] = 255 * Math.min(1, b * 0.84 + lum * 0.07);
        px[o + 3] = 255 * Math.min(1, aDark);
      } else {
        // Light Mode: rich warm amber-ochre refractive caustics visible on paper
        var aLight = Math.min(0.85, Math.pow(lum, 1.1) * vg * 1.8);
        px[o]     = Math.round(185 * r + 50 * lum);
        px[o + 1] = Math.round(115 * g + 30 * lum);
        px[o + 2] = Math.round(45 * b + 15 * lum);
        px[o + 3] = Math.round(255 * aLight);
      }
    }

    bctx.putImageData(img, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(buf, 0, 0, canvas.width, canvas.height);
  }

  function resize() {
    var r = canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var w = Math.max(1, Math.round(r.width * dpr));
    var h = Math.max(1, Math.round(r.height * dpr));
    if (w !== canvas.width || h !== canvas.height) {
      canvas.width = w; canvas.height = h;
      return true;
    }
    return false;
  }

  var t0 = performance.now();
  var visible = true, running = false, raf = 0;
  var FRAME_MS = 1000 / 24;
  var lastDraw = -1e9;
  var cost = 0, warm = 0;

  function frame(now) {
    if (!visible) { running = false; return; }
    raf = requestAnimationFrame(frame);

    if (now - lastDraw < FRAME_MS - 1) return;
    lastDraw = now;

    var a = performance.now();
    render((now - t0) / 1000);
    var ms = performance.now() - a;

    cost = cost ? cost * 0.9 + ms * 0.1 : ms;
    if (++warm > 15) {
      if (cost > 26 && rowStep === 1) { rowStep = 2; cost = 0; }
      else if (cost < 11 && rowStep === 2) { rowStep = 1; cost = 0; }
    }
  }

  function start() {
    if (running || reduce || !visible) return;
    running = true;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  resize();
  render(0);

  // Lifecycle & Motion Safeguards
  if (!reduce) {
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start(); else stop();
      }, { threshold: 0.05 }).observe(canvas);
    } else {
      start();
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });

    // Interactive Light Tracking on Mouse/Pointer Hover
    window.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        var rawX = (e.clientX - r.left) / r.width;
        var rawY = (e.clientY - r.top) / r.height;
        pointerX = Math.max(0.05, Math.min(0.95, rawX));
        pointerY = Math.max(0.05, Math.min(0.95, rawY));
      }
    }, { passive: true });
  }

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      if (resize() && (reduce || !running)) render((performance.now() - t0) / 1000);
    }, 140);
  }, { passive: true });
})();
