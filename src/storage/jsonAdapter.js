import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const base = path.resolve(process.cwd(), 'data');

async function ensureBase() {
  if (!existsSync(base)) {
    await mkdir(base, { recursive: true });
  }
}

export class JsonCollection {
  constructor(name) {
    this.file = path.join(base, `${name}.json`);
    this.data = [];
  }
  async load() {
    await ensureBase();
    try {
      const raw = await readFile(this.file, 'utf8');
      this.data = JSON.parse(raw);
    } catch {
      this.data = [];
      await this.save();
    }
  }
  async save() {
    await ensureBase();
    await writeFile(this.file, JSON.stringify(this.data, null, 2));
  }
}
