import { getStore } from '../../storage/index.js';
import { randomUUID } from 'crypto';

const store = getStore('giveaways');

export async function createGiveaway(data) {
  const id = randomUUID();
  await store.set(id, { id, entries: [], ended: false, ...data });
  return id;
}

export async function getGiveaway(id) {
  return store.get(id);
}

export async function addEntry(id, userId) {
  const g = await store.get(id);
  if (!g || g.ended) return false;

  if (!g.entries.includes(userId)) {
    g.entries.push(userId);
    await store.set(id, g);
  }
  return true;
}

export async function endGiveaway(id) {
  const g = await store.get(id);
  if (!g || g.ended) return null;

  g.ended = true;
  await store.set(id, g);
  return g;
}

export async function listActiveGiveaways() {
  return (await store.values()).filter(g => !g.ended);
}
 