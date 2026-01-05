import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { listVouchesForStaff } from '../../modules/vouch/vouchModel.js';
import { config } from '../../config/index.js';

export default {
  data: new SlashCommandBuilder()
    .setName('vouches')
    .setDescription('Show recent vouches for a staff member (latest first)')
    .addUserOption(o => o.setName('staff').setDescription('Staff member').setRequired(true))
    .addIntegerOption(o => o.setName('limit').setDescription('Number of entries to show (1-50)').setMinValue(1).setMaxValue(50)),
  async execute(interaction) {
    const staff = interaction.options.getUser('staff', true);
    const limit = interaction.options.getInteger('limit') || 20;
    const member = await interaction.guild.members.fetch(staff.id).catch(()=>null);
    if (!member) return interaction.reply({ content: 'That user is not in this server.', ephemeral: true });
    const hasStaff = member.roles.cache.some(r => r.name === config.staffRole);
    if (!hasStaff) return interaction.reply({ content: `Target is not a member of the ${config.staffRole} role.`, ephemeral: true });

    const rows = await listVouchesForStaff(interaction.guild.id, staff.id, limit);
    if (!rows.length) return interaction.reply({ content: `No vouches for ${staff.tag} yet.`, ephemeral: true });

    const desc = rows.map(v => `• <@${v.voterId}> — ${v.rating}/5${v.comment ? ` — ${v.comment}` : ''}`).join('\n');
    const embed = new EmbedBuilder().setTitle(`Vouches for ${staff.tag}`).setDescription(desc).setColor(config.embedColor).setTimestamp();
    await interaction.reply({ embeds: [embed] });
  }
};
