import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Bulk delete messages in this channel')
    .addIntegerOption(o => o.setName('count').setDescription('Number of messages (1-100)').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction) {
    const count = Math.max(1, Math.min(100, interaction.options.getInteger('count', true)));
    await interaction.channel.bulkDelete(count, true);
    await interaction.reply({ content: `Deleted ${count} messages.`, ephemeral: true });
  }
};
