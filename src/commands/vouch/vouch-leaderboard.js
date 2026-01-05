import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { aggregateLeaderboard } from '../../modules/vouch/vouchModel.js';
import { config } from '../../config/index.js';

export default {
  data: new SlashCommandBuilder()
    .setName('vouch-leaderboard')
    .setDescription('Show staff leaderboard by average rating (min vouch count)')
    .addIntegerOption(o => o.setName('min').setDescription('Minimum number of vouches to be ranked').setMinValue(1).setMaxValue(20)),
  async execute(interaction) {
    const min = interaction.options.getInteger('min') || 3;
    const rows = await aggregateLeaderboard(interaction.guild.id, min);
    if (!rows.length) return interaction.reply({ content: 'No leaderboard data yet.', ephemeral: true });

    const lines = await Promise.all(rows.map(async (r, i) => {
      const u = await interaction.client.users.fetch(r.staffId).catch(()=>({ tag: `User ${r.staffId}` }));
      return `#${i+1} — ${u.tag} — avg ${r.avgRating.toFixed(2)}/5 across ${r.count}`;
    }));

    const embed = new EmbedBuilder().setTitle(`Vouch Leaderboard (min ${min})`).setDescription(lines.join('\n')).setColor(config.embedColor).setTimestamp();
    await interaction.reply({ embeds: [embed] });
  }
};
