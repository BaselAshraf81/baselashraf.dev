/* ============================================================
   Caustic renderer.

   This is not a blurred gradient pretending to be light. It is the
   same computation photophane does, run forwards instead of backwards:
   a height field stands in for the surface of a thick clear plate,
   parallel light refracts through it by the local surface gradient,
   and every ray is accumulated where it lands. Light piles up along
   the folds and cusps of that mapping, which is what a caustic is.

   The three colour channels refract with slightly different strength,
   because glass bends short wavelengths harder than long ones. That is
   why the fringes go cyan on one side and amber on the other, and it
   is dispersion rather than decoration.

   Rays are splatted bilinearly and the accumulation is blurred before
   exposure, because a caustic is a smooth density of light and photon
   noise is an artefact of sampling it, not a feature of it.
   ============================================================ */

(function () {
  'use strict';

  var canvas = document.getElementById('caustic');
  if (!canvas) return;

  var ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Buffer kept small so each cell collects enough rays to be smooth.
     It is upscaled on paint; caustic folds are high-contrast structures
     and survive that comfortably. */
  var BW = 180, BH = 102;
  var CELLS = BW * BH;

  var RX = 440, RY = 250;
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

  /* stable per-ray jitter, so the ray grid never moires against the buffer */
  var jx = new Float32Array(NR), jy = new Float32Array(NR);
  var seed = 1337;
  function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
  for (var i = 0; i < NR; i++) { jx[i] = rnd() - 0.5; jy[i] = rnd() - 0.5; }

  /* ---- the plate surface: crossed waves, enough amplitude to fold ---- */
  var WV = [
    /* amp   freq   dirX    dirY    phase  speed */
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

  var pointerX = 0.62, pointerY = 0.34;   /* where the lamp is        */
  var lampX = 0.62, lampY = 0.34;         /* eased toward the pointer */

  /* dispersion: how hard each channel bends. Kept tight, so colour
     only separates where the surface curves hard. */
  var KR = 0.0530, KG = 0.0556, KB = 0.0584;

  var vign = new Float32Array(CELLS);
  (function buildVignette() {
    for (var y = 0; y < BH; y++) {
      for (var x = 0; x < BW; x++) {
        var nx = (x / BW - 0.5) * 2.0;
        var ny = (y / BH - 0.5) * 2.0;
        var d = Math.sqrt(nx * nx * 0.66 + ny * ny * 1.05);
        var v = 1.0 - d * 0.80;
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

  /* separable 1-2-1; one pass only, enough to kill sampling noise while
     leaving the bright filaments along each fold intact */
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

    lampX += (pointerX - lampX) * 0.04;
    lampY += (pointerY - lampY) * 0.04;

    var tiltX = (lampX - 0.5) * 0.30;
    var tiltY = (lampY - 0.5) * 0.20;

    for (var s = 0; s < NW; s++) ph[s] = WV[s][4] + t * WV[s][5];

    var k = 0;
    for (var ry = 0; ry < RY; ry++) {
      for (var rx = 0; rx < RX; rx++, k++) {
        var x = (rx + 0.5 + jx[k]) / RX;
        var y = (ry + 0.5 + jy[k]) / RY;

        var gx = 0.0, gy = 0.0;
        for (var q = 0; q < NW; q++) {
          var c = Math.cos(fq[q] * (x * wdx[q] + y * wdy[q]) + ph[q]) * amp[q] * fq[q];
          gx += c * wdx[q];
          gy += c * wdy[q];
        }

        /* the far face of the plate refracts a second time, sharpening folds */
        var gx2 = gx + 0.58 * gx * Math.abs(gy);
        var gy2 = gy + 0.58 * gy * Math.abs(gx);

        var bx = x + tiltX, by = y + tiltY;

        splat(accR, (bx + KR * gx2) * BW, (by + KR * gy2) * BH, 1);
        splat(accG, (bx + KG * gx2) * BW, (by + KG * gy2) * BH, 1);
        splat(accB, (bx + KB * gx2) * BW, (by + KB * gy2) * BH, 1);
      }
    }

    blur(accR); blur(accG); blur(accB);

    /* Exposed for the folds, not for the average. The unfocused ground
       sits near black and the convergence lines clip white, which is the
       actual dynamic range of a caustic. */
    var mean = NR / CELLS;
    var gain = 0.62 / mean;

    for (var p = 0, o = 0; p < CELLS; p++, o += 4) {
      var vg = vign[p];
      var r = 1.0 - Math.exp(-accR[p] * gain);
      var g = 1.0 - Math.exp(-accG[p] * gain);
      var b = 1.0 - Math.exp(-accB[p] * gain);

      var lum = (r + g + b) * 0.3333;

      /* the ground falls away faster than the folds do, which is what
         gives a caustic its range: near-black between, clipped white on */
      var a = Math.pow(lum, 1.45) * vg * 2.15;

      px[o]     = 255 * Math.min(1, r * 1.00 + lum * 0.20);
      px[o + 1] = 255 * Math.min(1, g * 0.95 + lum * 0.14);
      px[o + 2] = 255 * Math.min(1, b * 0.84 + lum * 0.07);
      px[o + 3] = 255 * Math.min(1, a);
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

  function frame(now) {
    if (!visible) { running = false; return; }
    render((now - t0) / 1000);
    raf = requestAnimationFrame(frame);
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

  if (!reduce) {
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        if (visible) start(); else stop();
      }, { threshold: 0 }).observe(canvas);
    } else {
      start();
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });

    if (window.matchMedia('(hover: hover)').matches) {
      window.addEventListener('pointermove', function (e) {
        var r = canvas.getBoundingClientRect();
        pointerX = (e.clientX - r.left) / r.width;
        pointerY = (e.clientY - r.top) / r.height;
      }, { passive: true });
    } else {
      /* on touch, let the lamp drift on its own */
      setInterval(function () {
        var n = performance.now();
        pointerX = 0.60 + Math.sin(n / 7000) * 0.26;
        pointerY = 0.34 + Math.cos(n / 9100) * 0.14;
      }, 100);
    }
  }

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      if (resize() && (reduce || !running)) render((performance.now() - t0) / 1000);
    }, 140);
  }, { passive: true });
})();
