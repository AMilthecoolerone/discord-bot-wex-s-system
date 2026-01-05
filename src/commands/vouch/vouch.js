import { SlashCommandBuilder } from 'discord.js';
import { createVouch } from '../../modules/vouch/vouchModel.js';
import { config } from '../../config/index.js';
import { sendModLog } from '../../utils/modlog.js';

export default {
  data: new SlashCommandBuilder()
    .setName('vouch')
    .setDescription('Leave a vouch (rating/comment) for a staff member (appends to history)')
    .addUserOption(o => o.setName('staff').setDescription('Staff member to vouch for').setRequired(true))
    .addIntegerOption(o => o.setName('rating').setDescription('Rating 1–5').setMinValue(1).setMaxValue(5).setRequired(true))
    .addStringOption(o => o.setName('comment').setDescription('Optional short comment').setRequired(false)),
  async execute(interaction) {
    const staff = interaction.options.getUser('staff', true);
    const rating = interaction.options.getInteger('rating', true);
    const comment = interaction.options.getString('comment') || '';

    const member = await interaction.guild.members.fetch(staff.id).catch(()=>null);
    if (!member) return interaction.reply({ content: 'That user is not in this server.', ephemeral: true });
    const hasStaff = member.roles.cache.some(r => r.name === config.staffRole);
    if (!hasStaff) return interaction.reply({ content: `Target is not a member of the ${config.staffRole} role.`, ephemeral: true });

    await createVouch({ guildId: interaction.guild.id, staffId: staff.id, voterId: interaction.user.id, rating, comment });
    await interaction.reply({ content: `Your vouch for ${staff.tag} has been recorded.`, ephemeral: true });

    await sendModLog(interaction.guild, 'New Vouch', [
      { name: 'Staff', value: `${staff.tag} (${staff.id})`, inline: true },
      { name: 'Voter', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
      { name: 'Rating', value: `${rating}/5`, inline: true },
      { name: 'Comment', value: comment || '—' }
    ]);
  }
};
