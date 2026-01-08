import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { config } from '../../config/index.js';
import { hasStaffRole } from '../../utils/permissions.js';

export default {
  data: new SlashCommandBuilder()
    .setName('builderapplication')
    .setDescription('Builder application system commands')
    .addSubcommand(subcommand =>
      subcommand
        .setName('post')
        .setDescription('Post the builder application embed in this channel')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'post') {
      // Check staff role
      const member = interaction.member;
      if (!hasStaffRole(member, config.staffRole)) {
        return interaction.reply({ 
          content: '❌ Only staff members can use this command.', 
          ephemeral: true 
        });
      }

      const embed = new EmbedBuilder()
        .setTitle('🏗️ Builder Application')
        .setDescription(
          'Interested in becoming a Builder for our Minecraft server?\n\n' +
          '**Applications are reviewed by staff.**\n\n' +
          '**Important:** Any applications using AI will instantly be denied.\n\n' +
          'Click the button below to start your application.'
        )
        .setColor(config.embedColor)
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('builder_apply_start')
          .setLabel('Apply for Builder')
          .setStyle(ButtonStyle.Primary)
      );

      await interaction.reply({ embeds: [embed], components: [row] });
    }
  }
};