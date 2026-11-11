import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url)).replace(/[\\/]scripts$/, '');
const out = join(root, 'dist');
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const entry of ['index.html', 'styles.css', 'app.js', 'catalog.js', 'orders.js', 'i18n.js', 'assets']) {
  await cp(join(root, entry), join(out, entry), { recursive: true });
}
console.log('Built static site into dist/');
