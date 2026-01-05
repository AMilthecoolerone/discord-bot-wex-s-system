import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { addInfraction } from '../../modules/moderation/infractionsModel.js';
import { sendModLog } from '../../utils/modlog.js';
import { config } from '../../config/index.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user')
    .addUserOption(o => o.setName('user').setDescription('User to ban').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason'))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = await interaction.guild.members.fetch(user.id).catch(()=>null);
    if (!member) return interaction.reply({ content: 'User not found in this guild.', ephemeral: true });
    await member.ban({ reason });
    await addInfraction({ guildId: interaction.guild.id, userId: user.id, moderatorId: interaction.user.id, action: 'BAN', reason });
    await sendModLog(interaction.guild, 'User Banned', [
      { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
      { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
      { name: 'Reason', value: reason }
    ]);
    await interaction.reply({ content: `Banned ${user.tag}.`, ephemeral: true });
  }
};
