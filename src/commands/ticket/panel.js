import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { config } from '../../config/index.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ticket-panel')
    .setDescription('Post a ticket panel with buttons')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('Support Tickets')
      .setDescription('Click a button to open a ticket. You will be asked for details in a form.')
      .setColor(config.embedColor);
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_open_normal').setLabel('Open Ticket').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('ticket_open_appeal').setLabel('Open Appeal').setStyle(ButtonStyle.Danger)
    );
    await interaction.reply({ embeds: [embed], components: [row] });
  }
};
