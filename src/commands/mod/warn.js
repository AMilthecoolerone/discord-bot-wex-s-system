import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { addInfraction } from '../../modules/moderation/infractionsModel.js';
import { sendModLog } from '../../utils/modlog.js';

export default {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason', true);
    await addInfraction({ guildId: interaction.guild.id, userId: user.id, moderatorId: interaction.user.id, action: 'WARN', reason });
    await sendModLog(interaction.guild, 'User Warned', [
      { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
      { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
      { name: 'Reason', value: reason }
    ]);
    await interaction.reply({ content: `Warned ${user.tag}.`, ephemeral: true });
  }
};
