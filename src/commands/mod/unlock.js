import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Unlock the current channel (allow @everyone sending)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(interaction) {
    const everyone = interaction.guild.roles.everyone;
    await interaction.channel.permissionOverwrites.edit(everyone, { SendMessages: null });
    await interaction.reply({ content: 'Channel unlocked.', ephemeral: true });
  }
};
