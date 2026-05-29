const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'public', 'landing3.html');
const target = path.join(root, 'public', 'index.html');

if (!fs.existsSync(source)) {
  throw new Error('public/landing3.html não encontrado.');
}

const html = fs.readFileSync(source, 'utf8');
fs.writeFileSync(target, html);

console.log('public/index.html sincronizado a partir de public/landing3.html');
