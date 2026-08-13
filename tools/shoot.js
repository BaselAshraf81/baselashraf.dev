/* Headless Chrome over CDP. Unlike `chrome --screenshot`, this can wait in real
   time, so pages that compute for 10-40s (eigendrum's eigensolver, photophane's
   solver) are captured *after* they finish. Bytes go Chrome -> disk directly. */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = path.join(__dirname, '..', 'shots');
const PORT = 9333;

const JOBS = [
  {
    name: 'eigendrum-star',
    url: 'https://eigendrum.com/#p=star',
    waitMs: 18000,
    // strike off-centre so asymmetric modes light up, then let it ring
    after: `(() => {
      const c = document.getElementById('board');
      if (!c) return 'no canvas';
      const r = c.getBoundingClientRect();
      const x = r.left + r.width * 0.38, y = r.top + r.height * 0.42;
      for (const t of ['pointerdown','mousedown','pointerup','mouseup','click'])
        c.dispatchEvent(new MouseEvent(t, { clientX: x, clientY: y, bubbles: true, buttons: 1 }));
      return 'struck';
    })()`,
    afterWaitMs: 260,
    clip: '#board',
  },
  {
    name: 'photophane',
    url: 'https://baselashraf81.github.io/photophane/',
    waitMs: 45000,
    fullPage: true,
  },
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getJSON(url) {
  const r = await fetch(url);
  return r.json();
}

class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.waiting = new Map(); this.events = []; }
  static async open(url) {
    const ws = new WebSocket(url);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    const c = new CDP(ws);
    ws.onmessage = e => {
      const m = JSON.parse(e.data);
      if (m.id && c.waiting.has(m.id)) {
        const { res, rej } = c.waiting.get(m.id);
        c.waiting.delete(m.id);
        m.error ? rej(new Error(m.error.message)) : res(m.result);
      } else if (m.method) {
        c.events.push(m.method);
      }
    };
    return c;
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((res, rej) => {
      this.waiting.set(id, { res, rej });
      setTimeout(() => {
        if (this.waiting.has(id)) { this.waiting.delete(id); rej(new Error(method + ' timed out')); }
      }, 90000);
    });
  }
  close() { this.ws.close(); }
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'shoot-'));

  const chrome = spawn(CHROME, [
    '--headless=new',
    '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + profile,
    '--hide-scrollbars',
    '--mute-audio',
    '--no-first-run',
    '--no-default-browser-check',
    '--enable-unsafe-swiftshader',
    '--window-size=1440,900',
    'about:blank',
  ], { stdio: 'ignore' });

  // wait for the debugger to answer
  let version = null;
  for (let i = 0; i < 60; i++) {
    try { version = await getJSON(`http://127.0.0.1:${PORT}/json/version`); break; }
    catch { await sleep(250); }
  }
  if (!version) { chrome.kill(); throw new Error('chrome debugger never came up'); }
  console.log('chrome up:', version['Browser']);

  for (const job of JOBS) {
    let page;
    try {
      const target = await getJSON(`http://127.0.0.1:${PORT}/json/new?about:blank`).catch(async () => {
        // newer Chrome requires PUT for /json/new
        const r = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' });
        return r.json();
      });

      page = await CDP.open(target.webSocketDebuggerUrl);
      await page.send('Page.enable');
      await page.send('Runtime.enable');
      await page.send('Emulation.setDeviceMetricsOverride', {
        width: 1440, height: 900, deviceScaleFactor: 2, mobile: false,
      });

      await page.send('Page.navigate', { url: job.url });
      console.log(`${job.name}: navigated, waiting ${job.waitMs}ms for it to settle...`);
      await sleep(job.waitMs);

      if (job.after) {
        const r = await page.send('Runtime.evaluate', { expression: job.after, returnByValue: true });
        console.log(`${job.name}: after -> ${JSON.stringify(r.result && r.result.value)}`);
        await sleep(job.afterWaitMs || 0);
      }

      const shotArgs = { format: 'png', captureBeyondViewport: true };

      if (job.clip) {
        const box = await page.send('Runtime.evaluate', {
          expression: `(() => { const e = document.querySelector(${JSON.stringify(job.clip)});
            if (!e) return null; const r = e.getBoundingClientRect();
            return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height }; })()`,
          returnByValue: true,
        });
        if (box.result && box.result.value) {
          shotArgs.clip = { ...box.result.value, scale: 2 };
        } else {
          console.log(`${job.name}: clip ${job.clip} not found, full viewport instead`);
        }
      } else if (job.fullPage) {
        const m = await page.send('Page.getLayoutMetrics');
        const s = m.cssContentSize || m.contentSize;
        shotArgs.clip = { x: 0, y: 0, width: s.width, height: Math.min(s.height, 8000), scale: 2 };
      }

      const shot = await page.send('Page.captureScreenshot', shotArgs);
      const file = path.join(OUT, 'cdp-' + job.name + '.png');
      fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
      console.log(`${job.name}: OK ${Math.round(fs.statSync(file).size / 1024)} kB -> ${path.basename(file)}`);

      await page.send('Page.close').catch(() => {});
    } catch (e) {
      console.log(`${job.name}: FAILED ${e.message}`);
    } finally {
      if (page) page.close();
    }
  }

  chrome.kill();
  await sleep(400);
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
  console.log('done');
})();
