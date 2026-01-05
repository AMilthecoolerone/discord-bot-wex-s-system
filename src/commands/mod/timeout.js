import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { addInfraction } from '../../modules/moderation/infractionsModel.js';
import { sendModLog } from '../../utils/modlog.js';

export default {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout (mute) a user for a duration')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
    .addIntegerOption(o => o.setName('minutes').setDescription('Duration in minutes').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const minutes = interaction.options.getInteger('minutes', true);
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = await interaction.guild.members.fetch(user.id).catch(()=>null);
    if (!member) return interaction.reply({ content: 'User not found in this guild.', ephemeral: true });
    const durationMs = Math.min(minutes * 60 * 1000, 28 * 24 * 60 * 60 * 1000); // discord limit ~28 days
    await member.timeout(durationMs, reason);
    await addInfraction({ guildId: interaction.guild.id, userId: user.id, moderatorId: interaction.user.id, action: 'TIMEOUT', reason, durationMs });
    await sendModLog(interaction.guild, 'User Timed Out', [
      { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
      { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
      { name: 'Duration', value: `${minutes} minutes`, inline: true },
      { name: 'Reason', value: reason }
    ]);
    await interaction.reply({ content: `Timed out ${user.tag} for ${minutes} minutes.`, ephemeral: true });
  }
};
