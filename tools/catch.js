/* Tiny local sink: the page POSTs its own canvas bytes here so the image
   never has to travel through anything else. Dev-only, loopback, no deps. */
const http = require('http');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'shots');
fs.mkdirSync(OUT, { recursive: true });

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') { res.writeHead(204).end(); return; }
  if (req.method !== 'POST') { res.writeHead(405).end('post only'); return; }

  const name = (new URL(req.url, 'http://x')).searchParams.get('name') || 'shot';
  const safe = name.replace(/[^a-z0-9._-]/gi, '_');
  const chunks = [];
  let size = 0;

  req.on('data', c => {
    size += c.length;
    if (size > 40 * 1024 * 1024) { req.destroy(); return; }
    chunks.push(c);
  });

  req.on('end', () => {
    const file = path.join(OUT, safe);
    fs.writeFileSync(file, Buffer.concat(chunks));
    console.log('saved', safe, Math.round(size / 1024) + ' kB');
    res.writeHead(200).end('ok ' + size);
  });
}).listen(8900, '127.0.0.1', () => console.log('catch listening on 8900'));
