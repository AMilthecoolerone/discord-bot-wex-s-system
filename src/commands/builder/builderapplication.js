import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } from 'discord.js';
import { config } from '../../config/index.js';
import { hasStaffRole } from '../../utils/permissions.js';
import { findApplicationsByStatus, findApplicationById, findApplicationByUser, updateBuilderApplication } from '../../modules/builder/builderModel.js';
import { sendModLog } from '../../utils/modlog.js';
import { logger } from '../../utils/logger.js';
import { QUESTIONS } from '../../modules/builder/builderHandlers.js';
import { setBuilderReviewChannel } from '../../utils/settings.js';

export default {
  data: new SlashCommandBuilder()
    .setName('builderapplication')
    .setDescription('Builder application system commands')
    .addSubcommand(subcommand =>
      subcommand
        .setName('post')
        .setDescription('Post the builder application embed in this channel')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List builder applications')
        .addStringOption(option =>
          option
            .setName('status')
            .setDescription('Filter by status')
            .setRequired(false)
            .addChoices(
              { name: 'Pending', value: 'pending' },
              { name: 'Approved', value: 'approved' },
              { name: 'Denied', value: 'denied' },
              { name: 'Auto-Rejected', value: 'auto_rejected' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View a specific builder application')
        .addStringOption(option =>
          option
            .setName('id')
            .setDescription('Application ID or user mention/ID')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('approve')
        .setDescription('Approve a builder application')
        .addStringOption(option =>
          option
            .setName('id')
            .setDescription('Application ID or user mention/ID')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('reason')
            .setDescription('Optional reason for approval')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('deny')
        .setDescription('Deny a builder application')
        .addStringOption(option =>
          option
            .setName('id')
            .setDescription('Application ID or user mention/ID')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('reason')
            .setDescription('Reason for denial')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('setchannel')
        .setDescription('Set the builder review channel')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('Channel to send builder applications to')
            .setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  
  async execute(interaction) {
    try {
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
    
    // Staff-only commands
    const member = interaction.member;
    if (!hasStaffRole(member, config.staffRole)) {
      return interaction.reply({ 
        content: '❌ Only staff members can use this command.', 
        ephemeral: true 
      });
    }

    if (subcommand === 'list') {
      const status = interaction.options.getString('status') || 'pending';
      const applications = await findApplicationsByStatus(interaction.guild.id, status);
      
      if (applications.length === 0) {
        return interaction.reply({ 
          content: `No ${status} applications found.`, 
          ephemeral: true 
        });
      }

      const embed = new EmbedBuilder()
        .setTitle(`Builder Applications - ${status.toUpperCase()}`)
        .setColor(config.embedColor)
        .setDescription(`Found ${applications.length} application(s)`);

      // Show first 10 applications
      const displayApps = applications.slice(0, 10);
      for (const app of displayApps) {
        const user = await interaction.client.users.fetch(app.userId).catch(() => null);
        const submittedAt = app.submittedAt instanceof Date 
          ? app.submittedAt 
          : new Date(app.submittedAt || Date.now());
        
        embed.addFields({
          name: `${app.applicationId || 'N/A'} - ${user?.tag || 'Unknown User'}`,
          value: `User: <@${app.userId}>\nSubmitted: <t:${Math.floor(submittedAt.getTime() / 1000)}:R>\nStatus: ${app.status}`,
          inline: true
        });
      }

      if (applications.length > 10) {
        embed.setFooter({ text: `Showing 10 of ${applications.length} applications. Use /builderapplication view to see details.` });
      }

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (subcommand === 'view') {
      const idInput = interaction.options.getString('id', true);
      
      // Try to parse as user ID or mention
      let userId = idInput.replace(/[<@!>]/g, '');
      let application = null;
      
      // First try as application ID
      if (idInput.startsWith('BA-')) {
        application = await findApplicationById(interaction.guild.id, idInput);
      }
      
      // If not found, try as user ID
      if (!application && userId) {
        application = await findApplicationByUser(interaction.guild.id, userId);
      }
      
      if (!application) {
        return interaction.reply({ 
          content: '❌ Application not found. Check the ID or user.', 
          ephemeral: true 
        });
      }

      const user = await interaction.client.users.fetch(application.userId).catch(() => null);
      const submittedAt = application.submittedAt instanceof Date 
        ? application.submittedAt 
        : new Date(application.submittedAt || Date.now());
      
      const answers = application.answers instanceof Map 
        ? Object.fromEntries(application.answers) 
        : application.answers;
      
      const statusColor = application.status === 'approved' ? '#00FF00' 
        : application.status === 'denied' || application.status === 'auto_rejected' ? '#FF0000'
        : config.embedColor;

      const embed = new EmbedBuilder()
        .setTitle('🏗️ Builder Application Details')
        .setColor(statusColor)
        .addFields(
          { name: 'Application ID', value: `\`${application.applicationId || 'N/A'}\``, inline: true },
          { name: 'Applicant', value: `<@${application.userId}>\n${user?.tag || 'Unknown'}`, inline: true },
          { name: 'Status', value: application.status.toUpperCase(), inline: true },
          { name: 'Submitted', value: `<t:${Math.floor(submittedAt.getTime() / 1000)}:F>`, inline: false }
        );

      // Add all questions and answers (truncated for embed limits)
      for (let i = 0; i < QUESTIONS.length && i < 20; i++) {
        const questionNum = i + 1;
        const answer = answers[`question_${questionNum}`] || 'No answer provided';
        const displayAnswer = answer.length > 500 ? answer.substring(0, 497) + '...' : answer;
        
        embed.addFields({
          name: QUESTIONS[i],
          value: displayAnswer || 'No answer provided',
          inline: false
        });
      }

      if (application.rejectionReason || application.reviewReason) {
        embed.addFields({
          name: 'Reason',
          value: application.rejectionReason || application.reviewReason || 'N/A',
          inline: false
        });
      }

      if (application.reviewedBy) {
        embed.addFields({
          name: 'Reviewed By',
          value: `<@${application.reviewedBy}>`,
          inline: true
        });
      }

      embed.setTimestamp(submittedAt);

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (subcommand === 'approve') {
      const idInput = interaction.options.getString('id', true);
      const reason = interaction.options.getString('reason') || 'No reason provided';
      
      let userId = idInput.replace(/[<@!>]/g, '');
      let application = null;
      
      if (idInput.startsWith('BA-')) {
        application = await findApplicationById(interaction.guild.id, idInput);
      }
      
      if (!application && userId) {
        application = await findApplicationByUser(interaction.guild.id, userId);
      }
      
      if (!application) {
        return interaction.reply({ 
          content: '❌ Application not found.', 
          ephemeral: true 
        });
      }

      if (application.status === 'approved') {
        return interaction.reply({ 
          content: '❌ This application is already approved.', 
          ephemeral: true 
        });
      }

      await updateBuilderApplication(
        { guildId: interaction.guild.id, userId: application.userId },
        { 
          $set: { 
            status: 'approved',
            reviewedBy: interaction.user.id,
            reviewedAt: new Date(),
            reviewReason: reason
          } 
        }
      );

      const user = await interaction.client.users.fetch(application.userId).catch(() => null);
      
      await sendModLog(interaction.guild, 'Builder Application Approved', [
        { name: 'Application ID', value: application.applicationId || 'N/A' },
        { name: 'Applicant', value: `${user?.tag || 'Unknown'} (${application.userId})` },
        { name: 'Reviewed By', value: `${interaction.user.tag} (${interaction.user.id})` },
        { name: 'Reason', value: reason }
      ]);

      await interaction.reply({ 
        content: `✅ Application ${application.applicationId || 'N/A'} has been approved.`, 
        ephemeral: true 
      });

      // Try to DM the user
      if (user) {
        try {
          await user.send({
            content: `🎉 Your builder application has been **approved**!\n\nReason: ${reason}\n\nWelcome to the team!`
          });
        } catch (err) {
          logger.warn(`Could not DM user ${user.id} about approval`);
        }
      }
    }

    if (subcommand === 'deny') {
      const idInput = interaction.options.getString('id', true);
      const reason = interaction.options.getString('reason') || 'No reason provided';
      
      let userId = idInput.replace(/[<@!>]/g, '');
      let application = null;
      
      if (idInput.startsWith('BA-')) {
        application = await findApplicationById(interaction.guild.id, idInput);
      }
      
      if (!application && userId) {
        application = await findApplicationByUser(interaction.guild.id, userId);
      }
      
      if (!application) {
        return interaction.reply({ 
          content: '❌ Application not found.', 
          ephemeral: true 
        });
      }

      if (application.status === 'denied') {
        return interaction.reply({ 
          content: '❌ This application is already denied.', 
          ephemeral: true 
        });
      }

      await updateBuilderApplication(
        { guildId: interaction.guild.id, userId: application.userId },
        { 
          $set: { 
            status: 'denied',
            reviewedBy: interaction.user.id,
            reviewedAt: new Date(),
            reviewReason: reason
          } 
        }
      );

      const user = await interaction.client.users.fetch(application.userId).catch(() => null);
      
      await sendModLog(interaction.guild, 'Builder Application Denied', [
        { name: 'Application ID', value: application.applicationId || 'N/A' },
        { name: 'Applicant', value: `${user?.tag || 'Unknown'} (${application.userId})` },
        { name: 'Reviewed By', value: `${interaction.user.tag} (${interaction.user.id})` },
        { name: 'Reason', value: reason }
      ]);

      await interaction.reply({ 
        content: `❌ Application ${application.applicationId || 'N/A'} has been denied.`, 
        ephemeral: true 
      });

      // Try to DM the user
      if (user) {
        try {
          await user.send({
            content: `❌ Your builder application has been **denied**.\n\nReason: ${reason}\n\nYou may reapply in the future if you wish.`
          });
        } catch (err) {
          logger.warn(`Could not DM user ${user.id} about denial`);
        }
      }
    }

    if (subcommand === 'setchannel') {
      const channel = interaction.options.getChannel('channel', true);
      
      if (channel.type !== ChannelType.GuildText) {
        return interaction.reply({ 
          content: '❌ The channel must be a text channel.', 
          ephemeral: true 
        });
      }

      await setBuilderReviewChannel(interaction.guild.id, channel.id);
      
      await interaction.reply({ 
        content: `✅ Builder review channel set to ${channel}.`, 
        ephemeral: true 
      });

      await sendModLog(interaction.guild, 'Builder Review Channel Updated', [
        { name: 'Channel', value: `${channel} (${channel.id})` },
        { name: 'Set By', value: `${interaction.user.tag} (${interaction.user.id})` }
      ]);
    }
    } catch (err) {
      logger.error('Error in builderapplication command', err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ 
          content: '❌ An error occurred while processing your command. Please try again later.', 
          ephemeral: true 
        }).catch(() => {});
      }
    }
  }
};