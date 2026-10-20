const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const MEDIA = path.join(__dirname, 'midia');
const PUBLIC = path.join(__dirname, 'public');
const VID = ['.mp4', '.webm', '.mov', '.m4v', '.ogv'];
const IMG = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.bmp'];
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/mp4', '.m4v': 'video/mp4', '.ogv': 'video/ogg',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif',
  '.webp': 'image/webp', '.avif': 'image/avif', '.bmp': 'image/bmp',
};

fs.mkdirSync(MEDIA, { recursive: true });

function list() {
  const items = fs.readdirSync(MEDIA)
    .map(n => ({ n, e: path.extname(n).toLowerCase(), t: fs.statSync(path.join(MEDIA, n)).mtimeMs }))
    .filter(f => VID.includes(f.e) || IMG.includes(f.e))
    .map(f => ({ name: f.n, url: '/midia/' + encodeURIComponent(f.n), type: VID.includes(f.e) ? 'video' : 'image', time: f.t }));
  items.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  // video principal: arquivo cujo nome começa com "principal", senão o primeiro vídeo
  let i = items.findIndex(x => x.type === 'video' && /^principal/i.test(x.name));
  if (i < 0) i = items.findIndex(x => x.type === 'video');
  if (i > 0) items.unshift(items.splice(i, 1)[0]);
  return items;
}

function serve(req, res, file) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); return res.end('Not found'); }
    const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
    const range = req.headers.range;
    if (range) {
      const m = /bytes=(\d*)-(\d*)/.exec(range);
      let start = m[1] ? parseInt(m[1]) : 0;
      let end = m[2] ? parseInt(m[2]) : st.size - 1;
      if (start >= st.size || end >= st.size) end = st.size - 1;
      res.writeHead(206, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Content-Length': end - start + 1 });
      fs.createReadStream(file, { start, end }).pipe(res);
    } else {
      res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes' });
      fs.createReadStream(file).pipe(res);
    }
  });
}

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/api/media') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify(list()));
  }
  if (url.startsWith('/midia/')) {
    const f = path.join(MEDIA, path.basename(url));
    return serve(req, res, f);
  }
  const rel = url === '/' ? 'index.html' : url.replace(/^\/+/, '');
  const f = path.join(PUBLIC, rel);
  if (!f.startsWith(PUBLIC)) { res.writeHead(403); return res.end(); }
  serve(req, res, f);
}).listen(PORT, () => console.log(`Álbum em http://localhost:${PORT}  |  pasta: ${MEDIA}`));
