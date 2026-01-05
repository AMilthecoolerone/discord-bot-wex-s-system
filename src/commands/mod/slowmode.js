import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Set channel slowmode (seconds)')
    .addIntegerOption(o => o.setName('seconds').setDescription('0 to disable').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(interaction) {
    const seconds = Math.max(0, Math.min(21600, interaction.options.getInteger('seconds', true)));
    await interaction.channel.setRateLimitPerUser(seconds);
    await interaction.reply({ content: `Slowmode set to ${seconds}s.`, ephemeral: true });
  }
};
