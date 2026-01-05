import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { config } from '../../config/index.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ticket-label-panel')
    .setDescription('Post a ticket panel with labeled buttons')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('Open a Ticket')
      .setDescription('Choose a category to open a private ticket')
      .setColor(config.embedColor);
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_label_building_services').setLabel('Building Services').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('ticket_label_support').setLabel('Support').setStyle(ButtonStyle.Success)
    );
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_label_market').setLabel('Market').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('ticket_label_giveaway_claim').setLabel('Giveaway claim').setStyle(ButtonStyle.Danger)
    );
    await interaction.reply({ embeds: [embed], components: [row1, row2] });
  }
};
