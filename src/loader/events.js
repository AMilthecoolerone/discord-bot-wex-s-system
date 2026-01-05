import { readdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadEvents(client) {
  const baseDir = path.resolve(__dirname, '../events');
  const files = await readdir(baseDir).catch(() => []);
  for (const f of files) {
    if (!f.endsWith('.js')) continue;
    // Use file:// URL to satisfy ESM loader on Windows
    const fileUrl = pathToFileURL(path.join(baseDir, f)).href;
    const mod = await import(fileUrl);
    const evt = mod.default || mod.event;
    if (!evt || !evt.name || !evt.execute) continue;
    if (evt.once) client.once(evt.name, (...args) => evt.execute(...args, client));
    else client.on(evt.name, (...args) => evt.execute(...args, client));
  }
}
