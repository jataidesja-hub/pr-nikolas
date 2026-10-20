// Gera public/media.json e copia midia/ para public/midia (usado no build do Vercel)
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, 'midia');
const DST = path.join(__dirname, 'public', 'midia');
const VID = ['.mp4', '.webm', '.mov', '.m4v', '.ogv'];
const IMG = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.bmp'];

fs.rmSync(DST, { recursive: true, force: true });
fs.mkdirSync(DST, { recursive: true });
const items = fs.readdirSync(SRC)
  .filter(n => VID.includes(path.extname(n).toLowerCase()) || IMG.includes(path.extname(n).toLowerCase()))
  .map(n => {
    fs.copyFileSync(path.join(SRC, n), path.join(DST, n));
    return { name: n, url: '/midia/' + encodeURIComponent(n), type: VID.includes(path.extname(n).toLowerCase()) ? 'video' : 'image' };
  });
items.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
let i = items.findIndex(x => x.type === 'video' && /^principal/i.test(x.name));
if (i < 0) i = items.findIndex(x => x.type === 'video');
if (i > 0) items.unshift(items.splice(i, 1)[0]);
fs.writeFileSync(path.join(__dirname, 'public', 'media.json'), JSON.stringify(items));
console.log(items.length + ' arquivos');
