import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { addInfraction } from '../../modules/moderation/infractionsModel.js';
import { sendModLog } from '../../utils/modlog.js';

export default {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user')
    .addUserOption(o => o.setName('user').setDescription('User to kick').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason'))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = await interaction.guild.members.fetch(user.id).catch(()=>null);
    if (!member) return interaction.reply({ content: 'User not found in this guild.', ephemeral: true });
    await member.kick(reason);
    await addInfraction({ guildId: interaction.guild.id, userId: user.id, moderatorId: interaction.user.id, action: 'KICK', reason });
    await sendModLog(interaction.guild, 'User Kicked', [
      { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
      { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
      { name: 'Reason', value: reason }
    ]);
    await interaction.reply({ content: `Kicked ${user.tag}.`, ephemeral: true });
  }
};
