// Varre a pasta midia/: arquivos soltos = itens; cada SUBPASTA = grupo (carrossel de fotos)
const fs = require('fs');
const path = require('path');
const VID = ['.mp4', '.webm', '.mov', '.m4v', '.ogv'];
const IMG = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.bmp'];
const cmp = (a, b) => a.localeCompare(b, undefined, { numeric: true });
const enc = rel => '/midia/' + rel.split('/').map(encodeURIComponent).join('/');

// chave do contador = hash do CONTEUDO do video (renomear o arquivo nao zera as views).
// chaves.json mapeia hash -> chave antiga (preserva contagens existentes).
let legacy = {};
try { legacy = JSON.parse(fs.readFileSync(path.join(__dirname, 'chaves.json'), 'utf8')); } catch (e) {}
function videoKey(file) {
  const fd = fs.openSync(file, 'r');
  const b = Buffer.alloc(262144);
  const n = fs.readSync(fd, b, 0, b.length, 0);
  fs.closeSync(fd);
  const h = require('crypto').createHash('md5').update(b.subarray(0, n)).update(String(fs.statSync(file).size)).digest('hex').slice(0, 12);
  return legacy[h] || 'v-' + h;
}

function scan(root) {
  const items = [];
  fs.readdirSync(root, { withFileTypes: true }).forEach(d => {
    if (d.isFile()) {
      const e = path.extname(d.name).toLowerCase();
      if (VID.includes(e) || IMG.includes(e)) {
        const it = { name: d.name, url: enc(d.name), type: VID.includes(e) ? 'video' : 'image', file: d.name };
        if (it.type === 'video') it.key = videoKey(path.join(root, d.name));
        items.push(it);
      }
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
