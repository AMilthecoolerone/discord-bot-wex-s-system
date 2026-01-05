import { readdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadCommands(client) {
  const baseDir = path.resolve(__dirname, '../commands');
  const cats = await readdir(baseDir);
  for (const c of cats) {
    const catDir = path.join(baseDir, c);
    const files = await readdir(catDir).catch(() => []);
    for (const f of files) {
      if (!f.endsWith('.js')) continue;
      // Use file:// URL to satisfy ESM loader on Windows
      const fileUrl = pathToFileURL(path.join(catDir, f)).href;
      const mod = await import(fileUrl);
      const cmd = mod.default || mod.command;
      if (cmd && cmd.data && cmd.execute) {
        client.commands.set(cmd.data.name, cmd);
      }
    }
  }
}
