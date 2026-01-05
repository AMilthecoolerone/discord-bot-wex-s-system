import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { sendModLog } from '../../utils/modlog.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Remove timeout (unmute) a user')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const member = await interaction.guild.members.fetch(user.id).catch(()=>null);
    if (!member) return interaction.reply({ content: 'User not found in this guild.', ephemeral: true });
    await member.timeout(null);
    await sendModLog(interaction.guild, 'User Unmuted', [
      { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
      { name: 'Moderator', value: `${interaction.user.tag}`, inline: true }
    ]);
    await interaction.reply({ content: `Unmuted ${user.tag}.`, ephemeral: true });
  }
};
