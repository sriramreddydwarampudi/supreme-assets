const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const source = path.join(projectRoot, 'public', '_redirects');
const destinationDir = path.join(projectRoot, 'dist');
const destination = path.join(destinationDir, '_redirects');

if (!fs.existsSync(source)) {
  console.warn('[copy-redirects] Skipping: public/_redirects not found.');
  process.exit(0);
}

if (!fs.existsSync(destinationDir)) {
  console.warn('[copy-redirects] Skipping: dist folder not found (run expo export first).');
  process.exit(0);
}

fs.copyFileSync(source, destination);
console.log('[copy-redirects] Copied public/_redirects to dist/_redirects.');

