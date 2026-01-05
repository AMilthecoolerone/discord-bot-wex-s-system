import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { config } from '../../config/index.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ticket-dropdown-panel')
    .setDescription('Post a stylish ticket panel with a dropdown for categories (v3)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(o => o
      .setName('image_url')
      .setDescription('Optional image URL to use for the panel (overrides IMAGE_URL)')
      .setRequired(false)
    ),
  async execute(interaction) {
    const overrideImage = interaction.options.getString('image_url') || '';
    const image = overrideImage || config.imageUrl || '';

    const embed = new EmbedBuilder()
      .setTitle('Need Help? Open a Ticket')
      .setDescription('Choose a category that fits your request. You will be asked a few questions, then a private channel will be created for you and our staff.')
      .setColor(config.embedColor)
      .setTimestamp();

    if (image) {
      // Show main banner image and a header thumbnail for extra flair
      embed.setImage(image);
      embed.setThumbnail(image);
    }

    const select = new StringSelectMenuBuilder()
      .setCustomId('ticket_dropdown_select')
      .setPlaceholder('Choose a ticket category')
      .addOptions([
        { label: 'Support', value: 'support', description: 'General or technical support' },
        { label: 'Building Service', value: 'building_services', description: 'Request a build / see prices' },
        { label: 'Market', value: 'market', description: 'Buying / selling' },
        { label: 'Giveaway Claim', value: 'giveaway_claim', description: 'Claim your prize' }
      ]);

    const row = new ActionRowBuilder().addComponents(select);
    await interaction.reply({ embeds: [embed], components: [row] });
  }
};