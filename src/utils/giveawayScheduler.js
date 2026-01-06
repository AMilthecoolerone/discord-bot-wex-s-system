import { listActiveGiveaways, endGiveaway } from '../modules/giveaway/giveawayModel.js';

export async function resumeGiveaways(client) {
  const giveaways = await listActiveGiveaways();

  for (const g of giveaways) {
    const delay = g.endsAt - Date.now();
    if (delay <= 0) {
      await finishGiveaway(client, g.id);
    } else {
      setTimeout(() => finishGiveaway(client, g.id), delay);
    }
  }
}

async function finishGiveaway(client, id) {
  const g = await endGiveaway(id);
  if (!g) return;

  const channel = await client.channels.fetch(g.channelId).catch(() => null);
  if (!channel) return;

  const winners = g.entries
    .sort(() => 0.5 - Math.random())
    .slice(0, g.winners);

  await channel.send(
    winners.length
      ? `🎉 **Giveaway Ended!** Winner(s): ${winners.map(w => `<@${w}>`).join(', ')}`
      : `❌ Giveaway ended with no entries.`
  );
}
