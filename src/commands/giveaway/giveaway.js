import { 
  SlashCommandBuilder, 
  PermissionFlagsBits, 
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType
} from 'discord.js';
import { config } from '../../config/index.js';
import { hasStaffRole } from '../../utils/permissions.js';
import { 
  createGiveaway, 
  findActiveGiveaways, 
  findAllGiveaways,
  findGiveawayByMessage,
  deleteGiveaway 
} from '../../modules/giveaway/giveawayModel.js';
import { 
  createGiveawayEmbed, 
  createGiveawayComponents,
  endGiveaway,
  scheduleGiveawayEnd
} from '../../modules/giveaway/giveawayHandlers.js';
import { sendModLog } from '../../utils/modlog.js';
import { logger } from '../../utils/logger.js';
import { parseTimeString, formatDuration } from '../../utils/timeParser.js';

export default {
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Giveaway management commands')
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Create a new giveaway')
        .addStringOption(option =>
          option
            .setName('prize')
            .setDescription('What is being given away')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('duration')
            .setDescription('Duration (e.g., 1m, 2h, 3d) - Max 30 days')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option
            .setName('winners')
            .setDescription('Number of winners')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(10)
        )
        .addRoleOption(option =>
          option
            .setName('required_role')
            .setDescription('Required role to enter (optional)')
            .setRequired(false)
        )
        .addIntegerOption(option =>
          option
            .setName('min_account_age')
            .setDescription('Minimum account age in days (optional)')
            .setRequired(false)
            .setMinValue(1)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List active giveaways')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('end')
        .setDescription('End a giveaway early')
        .addStringOption(option =>
          option
            .setName('message_id')
            .setDescription('Message ID of the giveaway')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('reroll')
        .setDescription('Reroll winners for an ended giveaway')
        .addStringOption(option =>
          option
            .setName('message_id')
            .setDescription('Message ID of the giveaway')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('delete')
        .setDescription('Delete a giveaway')
        .addStringOption(option =>
          option
            .setName('message_id')
            .setDescription('Message ID of the giveaway')
            .setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  
  async execute(interaction, client) {
    try {
      const subcommand = interaction.options.getSubcommand();
      const member = interaction.member;

      // Staff-only check
      if (!hasStaffRole(member, config.staffRole)) {
        return interaction.reply({ 
          content: '❌ Only staff members can use this command.', 
          ephemeral: true 
        });
      }

      if (subcommand === 'create') {
        const prize = interaction.options.getString('prize', true);
        const durationString = interaction.options.getString('duration', true);
        const winnerCount = interaction.options.getInteger('winners') || 1;
        const requiredRole = interaction.options.getRole('required_role');
        const minAccountAge = interaction.options.getInteger('min_account_age');

        // Parse time string (1m, 2h, 3d format)
        const durationMs = parseTimeString(durationString);
        if (!durationMs) {
          return interaction.reply({ 
            content: '❌ Invalid duration format. Use: `1m` (minutes), `2h` (hours), or `3d` (days). Max: 30 days.\n\n**Examples:** `30m`, `2h`, `7d`', 
            ephemeral: true 
          });
        }

        const endTime = new Date(Date.now() + durationMs);
        const formattedDuration = formatDuration(durationMs);

        const embed = createGiveawayEmbed({
          prize,
          winnerCount,
          endTime,
          requiredRole: requiredRole?.id,
          minAccountAge
        });
        const components = createGiveawayComponents(false);

        const message = await interaction.channel.send({ 
          embeds: [embed], 
          components 
        });

        const giveaway = await createGiveaway({
          guildId: interaction.guild.id,
          channelId: interaction.channel.id,
          messageId: message.id,
          prize,
          winnerCount,
          endTime,
          createdBy: interaction.user.id,
          requiredRole: requiredRole?.id,
          minAccountAge
        });

        // Schedule auto-end
        scheduleGiveawayEnd(client, giveaway);

        await interaction.reply({ 
          content: `✅ **Giveaway created successfully!**\n\n🎁 **Prize:** ${prize}\n⏰ **Duration:** ${formattedDuration}\n🎯 **Winners:** ${winnerCount}\n\n${message.url}`, 
          ephemeral: true 
        });

        await sendModLog(interaction.guild, 'Giveaway Created', [
          { name: 'Prize', value: prize },
          { name: 'Duration', value: formattedDuration },
          { name: 'Winners', value: winnerCount.toString() },
          { name: 'Created By', value: `${interaction.user.tag} (${interaction.user.id})` },
          { name: 'Message', value: message.url }
        ]);
      }

      if (subcommand === 'list') {
        const giveaways = await findActiveGiveaways(interaction.guild.id);

        if (giveaways.length === 0) {
          return interaction.reply({ 
            content: '📭 No active giveaways found.', 
            ephemeral: true 
          });
        }

        const embed = new EmbedBuilder()
          .setTitle('🎁 Active Giveaways')
          .setColor('#00FF88')
          .setDescription(`**${giveaways.length}** active giveaway${giveaways.length !== 1 ? 's' : ''} found`);

        for (const giveaway of giveaways.slice(0, 10)) {
          const channel = interaction.guild.channels.cache.get(giveaway.channelId);
          const endTime = new Date(giveaway.endTime);
          const timeRemaining = endTime > new Date() 
            ? `<t:${Math.floor(endTime.getTime() / 1000)}:R>`
            : 'Ended';
          const participantCount = giveaway.participants?.length || 0;

          embed.addFields({
            name: `🎁 ${giveaway.prize}`,
            value: `📺 **Channel:** ${channel || 'Unknown'}\n⏰ **Ends:** ${timeRemaining}\n👥 **Participants:** ${participantCount}\n🎯 **Winners:** ${giveaway.winnerCount || 1}\n🔗 [View Giveaway](https://discord.com/channels/${giveaway.guildId}/${giveaway.channelId}/${giveaway.messageId})`,
            inline: false
          });
        }

        if (giveaways.length > 10) {
          embed.setFooter({ text: `Showing 10 of ${giveaways.length} giveaways` });
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      if (subcommand === 'end') {
        const messageId = interaction.options.getString('message_id', true);
        const channel = interaction.channel;
        
        const success = await endGiveaway(interaction.guild, channel, messageId);
        
        if (success) {
          await interaction.reply({ 
            content: '✅ **Giveaway ended successfully!**\n\nWinners have been selected and notified.', 
            ephemeral: true 
          });
          
          await sendModLog(interaction.guild, 'Giveaway Ended', [
            { name: 'Message ID', value: messageId },
            { name: 'Ended By', value: `${interaction.user.tag} (${interaction.user.id})` }
          ]);
        } else {
          await interaction.reply({ 
            content: '❌ Failed to end giveaway. Make sure the message ID is correct and the giveaway is active.', 
            ephemeral: true 
          });
        }
      }

      if (subcommand === 'reroll') {
        const messageId = interaction.options.getString('message_id', true);
        const channel = interaction.channel;
        
        // Try to find ended giveaway
        const allGiveaways = await findAllGiveaways(interaction.guild.id);
        const endedGiveaway = allGiveaways.find(g => g.messageId === messageId && g.ended);
        
        if (!endedGiveaway) {
          const activeGiveaway = await findGiveawayByMessage(interaction.guild.id, messageId);
          if (activeGiveaway) {
            return interaction.reply({ 
              content: '❌ This giveaway is still active. Use `/giveaway end` first.', 
              ephemeral: true 
            });
          }
          return interaction.reply({ 
            content: '❌ Giveaway not found or not ended.', 
            ephemeral: true 
          });
        }

        // Reroll
        const success = await endGiveaway(interaction.guild, channel, messageId, true);
        
        if (success) {
          await interaction.reply({ 
            content: '✅ **Winners rerolled successfully!**\n\nNew winners have been selected and notified.', 
            ephemeral: true 
          });
          
          await sendModLog(interaction.guild, 'Giveaway Rerolled', [
            { name: 'Message ID', value: messageId },
            { name: 'Rerolled By', value: `${interaction.user.tag} (${interaction.user.id})` }
          ]);
        } else {
          await interaction.reply({ 
            content: '❌ Failed to reroll winners.', 
            ephemeral: true 
          });
        }
      }

      if (subcommand === 'delete') {
        const messageId = interaction.options.getString('message_id', true);
        
        try {
          const giveaway = await findGiveawayByMessage(interaction.guild.id, messageId);
          if (!giveaway) {
            return interaction.reply({ 
              content: '❌ Giveaway not found.', 
              ephemeral: true 
            });
          }

          // Try to delete the message
          const channel = interaction.guild.channels.cache.get(giveaway.channelId);
          if (channel) {
            const message = await channel.messages.fetch(messageId).catch(() => null);
            if (message) {
              await message.delete().catch(() => {});
            }
          }

          await deleteGiveaway(interaction.guild.id, messageId);
          
          await interaction.reply({ 
            content: '✅ **Giveaway deleted successfully!**', 
            ephemeral: true 
          });

          await sendModLog(interaction.guild, 'Giveaway Deleted', [
            { name: 'Message ID', value: messageId },
            { name: 'Deleted By', value: `${interaction.user.tag} (${interaction.user.id})` }
          ]);
        } catch (err) {
          logger.error('Error deleting giveaway', err);
          await interaction.reply({ 
            content: '❌ Failed to delete giveaway.', 
            ephemeral: true 
          });
        }
      }
    } catch (err) {
      logger.error('Error in giveaway command', err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ 
          content: '❌ An error occurred while processing your command.', 
          ephemeral: true 
        }).catch(() => {});
      }
    }
  }
};