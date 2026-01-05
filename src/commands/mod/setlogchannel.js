import { SlashCommandBuilder, ChannelType, PermissionFlagsBits } from 'discord.js';
import { setModlogChannel } from '../../utils/settings.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setlogchannel')
    .setDescription('Set the moderation log channel.')
    .addChannelOption(o => o.setName('channel').setDescription('Channel for mod logs').addChannelTypes(ChannelType.GuildText).setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    const ch = interaction.options.getChannel('channel', true);
    await setModlogChannel(interaction.guild.id, ch.id);
    await interaction.reply({ content: `Mod-log channel set to ${ch}.`, ephemeral: true });
  }
};
