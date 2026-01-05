import { EmbedBuilder } from 'discord.js';
import { config } from '../config/index.js';
import { getSettings } from './settings.js';

export async function sendModLog(guild, title, fields = [], color = config.embedColor) {
  const settings = await getSettings(guild.id);
  let channel = guild.channels.cache.find(c => c.name === config.modlogChannel && c.isTextBased());
  if (settings.modlogChannelId) {
    const byId = guild.channels.cache.get(settings.modlogChannelId);
    if (byId && byId.isTextBased()) channel = byId;
  }
  if (!channel) return;
  const embed = new EmbedBuilder().setTitle(title).setColor(color).addFields(fields).setTimestamp();
  await channel.send({ embeds: [embed] }).catch(() => {});
}
