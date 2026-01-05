import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Lock the current channel (disable @everyone sending)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(interaction) {
    const everyone = interaction.guild.roles.everyone;
    await interaction.channel.permissionOverwrites.edit(everyone, { SendMessages: false });
    await interaction.reply({ content: 'Channel locked.', ephemeral: true });
  }
};
