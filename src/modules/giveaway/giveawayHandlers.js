import { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  ComponentType
} from 'discord.js';
import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';
import { 
  findGiveawayByMessage, 
  updateGiveaway,
  deleteGiveaway 
} from './giveawayModel.js';

// Active timers for giveaways (in-memory, lost on restart)
const activeTimers = new Map();

// Format time remaining
function formatTimeRemaining(endTime) {
  const now = new Date();
  const end = new Date(endTime);
  const diff = end - now;
  
  if (diff <= 0) return 'Ended';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

// Create giveaway embed (modern app-style with green theme)
export function createGiveawayEmbed(giveaway, participants = []) {
  const endTime = new Date(giveaway.endTime);
  const timeRemaining = formatTimeRemaining(giveaway.endTime);
  const participantCount = participants.length || giveaway.participants?.length || 0;
  const winnerCount = giveaway.winnerCount || 1;
  
  // Green theme colors
  const greenColor = '#00FF88'; // Bright green
  const darkGreen = '#00CC6A';
  
  // Get giveaway ID - use messageId if available, otherwise generate a short ID from timestamp
  const giveawayId = giveaway.messageId 
    ? giveaway.messageId.slice(-6) 
    : Date.now().toString(36).slice(-6).toUpperCase();

  const embed = new EmbedBuilder()
    .setTitle('🎁 GIVEAWAY')
    .setDescription(
      `### 🏆 **${giveaway.prize}**\n\n` +
      `⏰ **Ends:** <t:${Math.floor(endTime.getTime() / 1000)}:R> (<t:${Math.floor(endTime.getTime() / 1000)}:F>)\n` +
      `⏳ **Time Remaining:** ${timeRemaining}\n\n` +
      `👥 **${participantCount}** participant${participantCount !== 1 ? 's' : ''}\n` +
      `🎯 **${winnerCount}** winner${winnerCount !== 1 ? 's' : ''} will be selected`
    )
    .setColor(greenColor)
    .setFooter({ 
      text: `Click the button below to enter! • Giveaway ID: ${giveawayId}` 
    })
    .setTimestamp(endTime);

  // Add requirements if any
  const requirements = [];
  if (giveaway.requiredRole) {
    requirements.push(`🔹 Required Role: <@&${giveaway.requiredRole}>`);
  }
  if (giveaway.minAccountAge) {
    requirements.push(`🔹 Account Age: ${giveaway.minAccountAge}+ days`);
  }
  
  if (requirements.length > 0) {
    embed.addFields({ 
      name: '📋 Requirements', 
      value: requirements.join('\n'), 
      inline: false 
    });
  }

  return embed;
}

// Create giveaway components (button) - modern app-style
export function createGiveawayComponents(ended = false) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('giveaway_enter')
      .setLabel(ended ? '🎉 Ended' : '🎁 Enter Giveaway')
      .setStyle(ended ? ButtonStyle.Secondary : ButtonStyle.Success)
      .setEmoji(ended ? '✅' : '🎁')
      .setDisabled(ended)
  );
  return [row];
}

// Check if user meets requirements
async function checkRequirements(member, giveaway) {
  if (giveaway.requiredRole) {
    if (!member.roles.cache.has(giveaway.requiredRole)) {
      return { valid: false, reason: `You need the <@&${giveaway.requiredRole}> role to enter.` };
    }
  }

  if (giveaway.minAccountAge) {
    const accountAge = (Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24);
    if (accountAge < giveaway.minAccountAge) {
      return { valid: false, reason: `Your account must be at least ${giveaway.minAccountAge} days old.` };
    }
  }

  return { valid: true };
}

// Handle button click
export async function handleGiveawayButton(interaction) {
  try {
    const { customId, message, member, user } = interaction;
    
    if (customId === 'giveaway_enter') {
      const giveaway = await findGiveawayByMessage(interaction.guild.id, message.id);
      
      if (!giveaway) {
        return interaction.reply({ 
          content: '❌ This giveaway no longer exists.', 
          ephemeral: true 
        });
      }

      if (giveaway.ended) {
        return interaction.reply({ 
          content: '❌ This giveaway has already ended.', 
          ephemeral: true 
        });
      }

      // Check requirements
      const requirements = await checkRequirements(member, giveaway);
      if (!requirements.valid) {
        return interaction.reply({ 
          content: `❌ ${requirements.reason}`, 
          ephemeral: true 
        });
      }

      // Toggle participation
      const participants = giveaway.participants || [];
      const isParticipating = participants.includes(user.id);

      if (isParticipating) {
        // Remove from participants
        const newParticipants = participants.filter(id => id !== user.id);
        await updateGiveaway(
          { guildId: interaction.guild.id, messageId: message.id },
          { $set: { participants: newParticipants } }
        );
        
        await interaction.reply({ 
          content: '✅ You have left the giveaway.', 
          ephemeral: true 
        });
      } else {
        // Add to participants
        participants.push(user.id);
        await updateGiveaway(
          { guildId: interaction.guild.id, messageId: message.id },
          { $set: { participants: participants } }
        );
        
        await interaction.reply({ 
          content: '🎉 **You\'ve entered the giveaway!**\n\nGood luck! 🍀', 
          ephemeral: true 
        });
      }

      // Update the embed
      giveaway.participants = isParticipating 
        ? participants.filter(id => id !== user.id)
        : participants;
      
      const updatedEmbed = createGiveawayEmbed(giveaway, giveaway.participants);
      await message.edit({ 
        embeds: [updatedEmbed], 
        components: createGiveawayComponents(false) 
      }).catch(err => {
        logger.error('Failed to update giveaway message', err);
      });
    }
  } catch (err) {
    logger.error('Error in handleGiveawayButton', err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ 
        content: '❌ An error occurred. Please try again later.', 
        ephemeral: true 
      }).catch(() => {});
    }
  }
}

// End a giveaway and pick winners
export async function endGiveaway(guild, channel, messageId, reroll = false) {
  try {
    let giveaway = await findGiveawayByMessage(guild.id, messageId);
    
    // If not found and rerolling, try to find ended giveaway
    if (!giveaway && reroll) {
      const { findAllGiveaways } = await import('./giveawayModel.js');
      const allGiveaways = await findAllGiveaways(guild.id);
      giveaway = allGiveaways.find(g => g.messageId === messageId && g.ended);
    }
    
    if (!giveaway) {
      logger.warn(`Giveaway not found: ${messageId}`);
      return false;
    }

    if (giveaway.ended && !reroll) {
      logger.warn(`Giveaway already ended: ${messageId}`);
      return false;
    }
    
    // For reroll, we need to reset ended status temporarily
    if (reroll && giveaway.ended) {
      await updateGiveaway(
        { guildId: guild.id, messageId: messageId },
        { $set: { ended: false, winners: [] } }
      );
      giveaway.ended = false;
      giveaway.winners = [];
    }

    const participants = giveaway.participants || [];
    
    if (participants.length === 0) {
      // No participants
      await updateGiveaway(
        { guildId: guild.id, messageId: messageId },
        { $set: { ended: true, winners: [] } }
      );

      const embed = new EmbedBuilder()
        .setTitle('🎁 GIVEAWAY ENDED')
        .setDescription(
          `### 🏆 **${giveaway.prize}**\n\n` +
          `❌ **No participants entered this giveaway.**\n\n` +
          `This giveaway had no entries and has been cancelled.`
        )
        .setColor('#666666')
        .setTimestamp();

      const message = await channel.messages.fetch(messageId).catch(() => null);
      if (message) {
        await message.edit({ 
          embeds: [embed], 
          components: createGiveawayComponents(true) 
        });
      }

      // Clear timer
      if (activeTimers.has(messageId)) {
        clearTimeout(activeTimers.get(messageId));
        activeTimers.delete(messageId);
      }

      return true;
    }

    // Pick winners
    const winnerCount = Math.min(giveaway.winnerCount || 1, participants.length);
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const winners = shuffled.slice(0, winnerCount);

    await updateGiveaway(
      { guildId: guild.id, messageId: messageId },
      { $set: { ended: true, winners: winners } }
    );

    // Create winner announcement (modern app-style)
    const winnerMentions = winners.map(id => `<@${id}>`).join(', ');
    const winnerText = winnerCount === 1 
      ? `**🎯 Winner:** ${winnerMentions}`
      : `**🎯 Winners:** ${winnerMentions}`;

    // Update the original giveaway message
    const endedEmbed = new EmbedBuilder()
      .setTitle('🎁 GIVEAWAY ENDED')
      .setDescription(
        `### 🏆 **${giveaway.prize}**\n\n` +
        `${winnerText}\n\n` +
        `🎊 **Congratulations!** 🎊\n\n` +
        `👥 **${participants.length}** participant${participants.length !== 1 ? 's' : ''} entered`
      )
      .setColor('#00CC6A')
      .setFooter({ text: 'Giveaway has ended' })
      .setTimestamp();

    const message = await channel.messages.fetch(messageId).catch(() => null);
    if (message) {
      await message.edit({ 
        embeds: [endedEmbed], 
        components: createGiveawayComponents(true) 
      });
    }

    // Send winner announcement in the same channel (modern app-style)
    const announcementEmbed = new EmbedBuilder()
      .setTitle('🎉 GIVEAWAY WINNER! 🎉')
      .setDescription(
        `### 🏆 **${giveaway.prize}**\n\n` +
        `${winnerText}\n\n` +
        `🎊 **Congratulations to the winner${winnerCount > 1 ? 's' : ''}!** 🎊\n\n` +
        `Thank you to all ${participants.length} participant${participants.length !== 1 ? 's' : ''} who entered!`
      )
      .setColor('#00FF88')
      .setFooter({ text: 'Giveaway ended' })
      .setTimestamp();

    await channel.send({
      content: `🎉 **Giveaway Ended!** ${winnerMentions}`,
      embeds: [announcementEmbed]
    }).catch(err => {
      logger.error('Failed to send winner announcement', err);
    });

    // DM all winners
    for (const winnerId of winners) {
      try {
        const winner = await guild.members.fetch(winnerId).catch(() => null);
        if (winner && winner.user) {
          const dmEmbed = new EmbedBuilder()
            .setTitle('🎉 You Won! 🎉')
            .setDescription(
              `### 🏆 **Congratulations!**\n\n` +
              `You won **${giveaway.prize}** in the giveaway on **${guild.name}**!\n\n` +
              `🎊 **You're a winner!** 🎊\n\n` +
              `**📋 To claim your prize:**\n` +
              `• Return to the server: **${guild.name}**\n` +
              `•  open a ticket\n` +
              `• Mention that you won the giveaway for & provide the proof of winning: **${giveaway.prize}**\n\n` +
              `⏰ **Please claim within 24 hours or your prize may be forfeited.**`
            )
            .setColor('#00FF88')
            .setFooter({ text: guild.name, iconURL: guild.iconURL() })
            .setTimestamp();

          await winner.user.send({ embeds: [dmEmbed] }).catch(() => {
            logger.warn(`Could not DM winner ${winnerId}`);
          });
        }
      } catch (err) {
        logger.error(`Error DMing winner ${winnerId}`, err);
      }
    }

    // Clear timer
    if (activeTimers.has(messageId)) {
      clearTimeout(activeTimers.get(messageId));
      activeTimers.delete(messageId);
    }

    return true;
  } catch (err) {
    logger.error('Error ending giveaway', err);
    return false;
  }
}

// Schedule giveaway end
export function scheduleGiveawayEnd(client, giveaway) {
  const endTime = new Date(giveaway.endTime);
  const now = new Date();
  const delay = endTime - now;

  if (delay <= 0) {
    // Already expired, end immediately
    const guild = client.guilds.cache.get(giveaway.guildId);
    const channel = guild?.channels.cache.get(giveaway.channelId);
    if (guild && channel) {
      endGiveaway(guild, channel, giveaway.messageId);
    }
    return;
  }

  // Clear existing timer if any
  if (activeTimers.has(giveaway.messageId)) {
    clearTimeout(activeTimers.get(giveaway.messageId));
  }

  const timer = setTimeout(async () => {
    const guild = client.guilds.cache.get(giveaway.guildId);
    const channel = guild?.channels.cache.get(giveaway.channelId);
    if (guild && channel) {
      await endGiveaway(guild, channel, giveaway.messageId);
    }
    activeTimers.delete(giveaway.messageId);
  }, delay);

  activeTimers.set(giveaway.messageId, timer);
  logger.info(`Scheduled giveaway end for ${giveaway.messageId} in ${Math.floor(delay / 1000)}s`);
}

// Load and schedule all active giveaways (call on bot startup)
export async function loadActiveGiveaways(client) {
  try {
    const { findActiveGiveaways } = await import('./giveawayModel.js');
    const guilds = client.guilds.cache;
    let totalCount = 0;
    
    for (const guild of guilds.values()) {
      const giveaways = await findActiveGiveaways(guild.id);
      for (const giveaway of giveaways) {
        scheduleGiveawayEnd(client, giveaway);
        totalCount++;
      }
    }
    
    logger.info(`Loaded ${totalCount} active giveaway(s)`);
  } catch (err) {
    logger.error('Error loading active giveaways', err);
  }
}