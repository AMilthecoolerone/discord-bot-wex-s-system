import { SlashCommandBuilder } from 'discord.js';
import { getInfractions } from '../../modules/moderation/infractionsModel.js';
import { config } from '../../config/index.js';

export default {
  data: new SlashCommandBuilder()
    .setName('infractions')
    .setDescription('View a user\'s infractions')
    .addUserOption(o => o.setName('user').setDescription('Target user').setRequired(true)),
  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const list = await getInfractions(interaction.guild.id, user.id);
    if (!list.length) return interaction.reply({ content: `No infractions found for ${user.tag}.`, ephemeral: true });
    const lines = list.slice(0, 10).map(i => `• ${i.action} — ${i.reason || 'No reason'} (${new Date(i.createdAt).toLocaleString()})`);
    await interaction.reply({ embeds: [{ title: `Infractions for ${user.tag}`, description: lines.join('\n'), color: parseInt(config.embedColor.replace('#',''),16) }], ephemeral: true });
  }
};
