// Varre a pasta midia/: arquivos soltos = itens; cada SUBPASTA = grupo (carrossel de fotos)
const fs = require('fs');
const path = require('path');
const VID = ['.mp4', '.webm', '.mov', '.m4v', '.ogv'];
const IMG = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.bmp'];
const cmp = (a, b) => a.localeCompare(b, undefined, { numeric: true });
const enc = rel => '/midia/' + rel.split('/').map(encodeURIComponent).join('/');

function scan(root) {
  const items = [];
  fs.readdirSync(root, { withFileTypes: true }).forEach(d => {
    if (d.isFile()) {
      const e = path.extname(d.name).toLowerCase();
      if (VID.includes(e) || IMG.includes(e))
        items.push({ name: d.name, url: enc(d.name), type: VID.includes(e) ? 'video' : 'image', file: d.name });
    } else if (d.isDirectory()) {
      const slides = fs.readdirSync(path.join(root, d.name))
        .filter(n => IMG.includes(path.extname(n).toLowerCase())).sort(cmp)
        .map(n => ({ name: n, url: enc(d.name + '/' + n), file: d.name + '/' + n }));
      if (slides.length === 1) items.push({ name: slides[0].name, url: slides[0].url, type: 'image', file: slides[0].file });
      else if (slides.length > 1) items.push({ name: d.name, type: 'group', slides, file: d.name });
    }
  });
  items.sort((a, b) => cmp(a.name, b.name));
  // video principal: nome comecando com "principal", senao o primeiro video
  let i = items.findIndex(x => x.type === 'video' && /^principal/i.test(x.name));
  if (i < 0) i = items.findIndex(x => x.type === 'video');
  if (i > 0) items.unshift(items.splice(i, 1)[0]);
  return items;
}
module.exports = { scan };
