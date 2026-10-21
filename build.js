// Gera public/media.json e copia midia/ para public/midia (usado no build do Vercel)
const fs = require('fs');
const path = require('path');
const { scan } = require('./scan');
const SRC = path.join(__dirname, 'midia');
const DST = path.join(__dirname, 'public', 'midia');

fs.rmSync(DST, { recursive: true, force: true });
fs.cpSync(SRC, DST, { recursive: true });
const items = scan(SRC);
fs.writeFileSync(path.join(__dirname, 'public', 'media.json'), JSON.stringify(items));
console.log(items.length + ' itens');
