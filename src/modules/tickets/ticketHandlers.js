import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionsBitField } from 'discord.js';
import { config } from '../../config/index.js';
import { createTicket, findOpenTicketsByUser, updateTicket, findTicketByChannel, deleteTicket } from './ticketModel.js';
import { sendModLog } from '../../utils/modlog.js';

export function controlRow(ticket) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_claim').setLabel(ticket?.claimedBy ? 'Claimed' : 'Claim').setStyle(ButtonStyle.Secondary).setDisabled(!!ticket?.claimedBy),
    new ButtonBuilder().setCustomId('ticket_close').setLabel('Close').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('ticket_delete').setLabel('Delete').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('ticket_transcript').setLabel('Transcript').setStyle(ButtonStyle.Primary)
    
  );
}

async function createChannelForTicket(guild, userId, label, reason) {
  const category = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === config.ticketCategory);
  const username = guild.members.cache.get(userId)?.user?.username || 'user';
  const ch = await guild.channels.create({
    name: `${label}-${username}`.toLowerCase().slice(0, 90),
    type: ChannelType.GuildText,
    parent: category?.id,
    permissionOverwrites: [
      { id: guild.roles.everyone, deny: [PermissionsBitField.Flags.ViewChannel] },
      { id: userId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
    ]
  });
  const staffRole = guild.roles.cache.find(r => r.name === config.staffRole);
  if (staffRole) await ch.permissionOverwrites.edit(staffRole, { ViewChannel: true, SendMessages: true }).catch(()=>{});
  const pretty = label.replace(/_/g, ' ').replace(/\b\w/g, s => s.toUpperCase());
  const embed = new EmbedBuilder()
    .setTitle(`${pretty} Ticket`)
    .setDescription(`Reason: ${reason}`)
    .setColor(config.embedColor)
    .setTimestamp();
  const row = controlRow({ claimedBy: null });
  await ch.send({ embeds: [embed], components: [row] });
  return { ch, pretty };
}

export async function handleButton(interaction) {
  const { guild, user, customId } = interaction;
  if (customId === 'ticket_open_normal' || customId === 'ticket_open_appeal') {
    const open = await findOpenTicketsByUser(guild.id, user.id);
    if (open.length >= (config.maxTicketsPerUser || 1)) {
      return interaction.reply({ content: 'You already have an open ticket.', ephemeral: true });
    }
    const modal = new ModalBuilder().setCustomId(`ticket_modal_${customId.split('_').pop()}`).setTitle('Open Ticket');
    const reason = new TextInputBuilder().setCustomId('reason').setLabel('Describe your issue').setRequired(true).setStyle(TextInputStyle.Paragraph);
    modal.addComponents(new ActionRowBuilder().addComponents(reason));
    return interaction.showModal(modal);
  }
  if (customId.startsWith('ticket_label_')) {
    const label = customId.replace('ticket_label_', '');
    const open = await findOpenTicketsByUser(guild.id, user.id);
    if (open.length >= (config.maxTicketsPerUser || 1)) {
      return interaction.reply({ content: 'You already have an open ticket.', ephemeral: true });
    }
    const reason = '—';
    const { ch, pretty } = await createChannelForTicket(guild, user.id, label, reason);
    await createTicket({ guildId: guild.id, userId: user.id, channelId: ch.id, type: 'normal', category: label, reason, participants: [user.id] });
    await interaction.reply({ content: `Your ${pretty} ticket has been created: ${ch}.`, ephemeral: true });
    await sendModLog(guild, 'Ticket Opened', [
      { name: 'Channel', value: `${ch}` },
      { name: 'User', value: `${interaction.user.tag} (${interaction.user.id})` },
      { name: 'Category', value: pretty }
    ]);
    return;
  }
  if (customId === 'ticket_claim') {
    const member = interaction.member;
    if (!member.roles.cache.some(r => r.name === config.staffRole)) {
      return interaction.reply({ content: 'Only staff can claim tickets.', ephemeral: true });
    }
    const ticket = await findTicketByChannel(guild.id, interaction.channel.id);
    if (!ticket || !ticket.open) return interaction.reply({ content: 'This is not an open ticket channel.', ephemeral: true });
    await updateTicket({ guildId: guild.id, channelId: interaction.channel.id }, { $set: { claimedBy: interaction.user.id } });
    await interaction.update({ components: [controlRow({ ...ticket, claimedBy: interaction.user.id })] }).catch(async()=>{
      await interaction.reply({ content: 'Claimed.', ephemeral: true });
    });
    await interaction.channel.send({ content: `Ticket claimed by <@${interaction.user.id}>.` });
    await sendModLog(guild, 'Ticket Claimed', [
      { name: 'Channel', value: `${interaction.channel}` },
      { name: 'Staff', value: `${interaction.user.tag}` }
    ]);
    return;
  }
  if (customId === 'ticket_close') {
    const ticket = await findTicketByChannel(guild.id, interaction.channel.id);
    if (!ticket || !ticket.open) return interaction.reply({ content: 'Not an open ticket.', ephemeral: true });
    await interaction.channel.permissionOverwrites.edit(ticket.userId, { ViewChannel: false, SendMessages: false }).catch(()=>{});
    await updateTicket({ guildId: guild.id, channelId: interaction.channel.id }, { $set: { open: false, closedAt: new Date() } });
    await interaction.channel.send({ content: 'Ticket closed.' });
    await interaction.reply({ content: 'Closed.', ephemeral: true }).catch(()=>{});
    await sendModLog(guild, 'Ticket Closed', [
      { name: 'Channel', value: `${interaction.channel}` },
      { name: 'Closed by', value: `${interaction.user.tag}` }
    ]);
    return;
  }
  if (customId === 'ticket_transcript') {
    const msgs = await interaction.channel.messages.fetch({ limit: 100 }).catch(() => null);
    if (!msgs) return interaction.reply({ content: 'Unable to fetch messages.', ephemeral: true });
    const sorted = Array.from(msgs.values()).sort((a,b)=> a.createdTimestamp - b.createdTimestamp);
    const lines = sorted.map(m => `[${new Date(m.createdAt).toISOString()}] ${m.author?.tag || 'Unknown'}: ${m.content}`);
    const html = `<!doctype html><meta charset="utf-8"><title>Transcript ${interaction.channel.name}</title><pre>${lines.map(l=>l.replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]))).join("\n")}</pre>`;
    const buf = Buffer.from(html, 'utf8');
    await interaction.reply({ content: 'Transcript generated.', files: [{ attachment: buf, name: `transcript-${interaction.channel.id}.html` }], ephemeral: true });
    return;
  }
  if (customId === 'ticket_delete') {
    const member = interaction.member;
    if (!member.roles.cache.some(r => r.name === config.staffRole)) {
      return interaction.reply({ content: 'Only staff can delete tickets.', ephemeral: true });
    }
    const ticket = await findTicketByChannel(guild.id, interaction.channel.id);
    if (!ticket) return interaction.reply({ content: 'This is not a ticket channel.', ephemeral: true });
    
    // Delete ticket from database
    await deleteTicket({ guildId: guild.id, channelId: interaction.channel.id });
    
    // Delete the channel
    await interaction.channel.delete().catch(() => {});
    
    await sendModLog(guild, 'Ticket Deleted', [
      { name: 'Channel', value: `${interaction.channel.name} (${interaction.channel.id})` },
      { name: 'Deleted by', value: `${interaction.user.tag} (${interaction.user.id})` }
    ]);
    return;
  }
}

export async function handleModal(interaction) {
  const customId = interaction.customId;
  
  // Handle categorized ticket modals (from /ticket-open or dropdown)
  if (customId.startsWith('ticket_open_modal_') || customId.startsWith('ticket_dropdown_modal_')) {
    const typeChoice = customId.replace('ticket_open_modal_', '').replace('ticket_dropdown_modal_', '');
    const fields = interaction.fields;
    const guild = interaction.guild;
    
    // Check for max tickets
    const open = await findOpenTicketsByUser(guild.id, interaction.user.id);
    if (open.length >= (config.maxTicketsPerUser || 1)) {
      return interaction.reply({ content: 'You already have an open ticket.', ephemeral: true });
    }

    // Format category name for display
    const categoryMap = {
      'support': 'Support',
      'giveaway_claim': 'Giveaway Claim',
      'market': 'Market',
      'building_services': 'Building Service'
    };
    const categoryDisplay = categoryMap[typeChoice] || typeChoice;

    // Category channel names (Discord channel categories)
    const categoryChannelNames = {
      'support': '---------- Support ----------',
      'giveaway_claim': '---------- Giveaway Claim ----------',
      'market': '---------- Market Contents ----------',
      'building_services': '---------- Base Servicing Tickets ----------'
    };
    const categoryChannelName = categoryChannelNames[typeChoice] || config.ticketCategory;

    // Category headers for messages
    const categoryHeaders = {
      'support': '---------- Support ----------',
      'giveaway_claim': '---------- Giveaway Claim ----------',
      'market': '---------- Market Contents ----------',
      'building_services': '---------- Base Servicing Tickets ----------'
    };
    const categoryHeader = categoryHeaders[typeChoice] || '';

    // Build description based on ticket type
    let description = `Ticket created by ${interaction.user} they submitted the following answers to the ticket form:\n\n`;
    let reason = '';

    if (typeChoice === 'support') {
      const ign = fields.getTextInputValue('ign') || 'Not provided';
      const issue = fields.getTextInputValue('issue') || 'Not provided';
      const additional = fields.getTextInputValue('additional') || 'None';
      
      description += `**IGN:** ${ign}\n\n`;
      description += `**Please explain your issue:**\n${issue}\n\n`;
      description += `**Is there anything we should know?**\n${additional}`;
      reason = `${ign} - ${issue}`;
    } else if (typeChoice === 'giveaway_claim') {
      const giveaway = fields.getTextInputValue('giveaway') || 'Not provided';
      const ign = fields.getTextInputValue('ign') || 'Not provided';
      
      description += `**Which giveaway did you win?**\n${giveaway}\n\n`;
      description += `**IGN:** ${ign}`;
      reason = `${ign} - ${giveaway}`;
    } else if (typeChoice === 'market') {
      const buyOrSell = fields.getTextInputValue('buy_or_sell') || 'Not specified';
      const item = fields.getTextInputValue('item') || 'Not provided';
      const ign = fields.getTextInputValue('ign') || 'Not provided';
      
      description += `**Do you wish to buy or sell?**\n${buyOrSell}\n\n`;
      description += `**What do you want to sell or buy?**\n${item}\n\n`;
      description += `**IGN:** ${ign}`;
      reason = `${ign} - ${buyOrSell}: ${item}`;
    } else if (typeChoice === 'building_services') {
      const build = fields.getTextInputValue('build') || 'Not provided';
      const ign = fields.getTextInputValue('ign') || 'Not provided';
      
      description += `**What do you want the builders to build?**\n${build}\n\n`;
      description += `**IGN:** ${ign}`;
      reason = `${ign} - ${build}`;
    }

    // Find or use the appropriate category channel
    let category = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === categoryChannelName);
    // Fallback to default ticket category if specific category not found
    if (!category) {
      category = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === config.ticketCategory);
    }
    const ch = await guild.channels.create({
      name: `${typeChoice}-${interaction.user.username}`.toLowerCase().slice(0, 90),
      type: ChannelType.GuildText,
      parent: category?.id,
      permissionOverwrites: [
        { id: guild.roles.everyone, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
      ]
    });
    const staffRole = guild.roles.cache.find(r => r.name === config.staffRole);
    if (staffRole) await ch.permissionOverwrites.edit(staffRole, { ViewChannel: true, SendMessages: true }).catch(()=>{});

    // Create ticket
    await createTicket({ 
      guildId: guild.id, 
      userId: interaction.user.id, 
      channelId: ch.id, 
      type: 'normal', 
      category: typeChoice, 
      reason, 
      participants: [interaction.user.id] 
    });

    // Send category header as separate message
    if (categoryHeader) {
      await ch.send({ content: categoryHeader });
    }

    // Send embed
    const embed = new EmbedBuilder()
      .setTitle(`${categoryDisplay} Ticket`)
      .setDescription(description)
      .setColor(config.embedColor)
      .setTimestamp();
    const row = controlRow({ claimedBy: null });
    await ch.send({ 
      content: `<@${interaction.user.id}> <@&${staffRole?.id || ''}>`, 
      embeds: [embed], 
      components: [row] 
    });

    await interaction.reply({ content: `Your ${categoryDisplay} ticket has been created: ${ch}.`, ephemeral: true });

    await sendModLog(guild, 'Ticket Opened', [
      { name: 'Channel', value: `${ch}` },
      { name: 'User', value: `${interaction.user.tag} (${interaction.user.id})` },
      { name: 'Category', value: categoryDisplay }
    ]);
    return;
  }

  // Handle legacy modal (appeal/normal tickets)
  const kind = interaction.customId.endsWith('appeal') ? 'appeal' : 'normal';
  const reason = interaction.fields.getTextInputValue('reason');
  const guild = interaction.guild;
  const category = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === config.ticketCategory);
  const nameBase = kind === 'appeal' ? 'appeal' : 'ticket';
  const ch = await guild.channels.create({
    name: `${nameBase}-${interaction.user.username}`.toLowerCase().slice(0, 90),
    type: ChannelType.GuildText,
    parent: category?.id,
    permissionOverwrites: [
      { id: guild.roles.everyone, deny: [PermissionsBitField.Flags.ViewChannel] },
      { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
    ]
  });
  const staffRole = guild.roles.cache.find(r => r.name === config.staffRole);
  if (staffRole) await ch.permissionOverwrites.edit(staffRole, { ViewChannel: true, SendMessages: true }).catch(()=>{});
  await createTicket({ guildId: guild.id, userId: interaction.user.id, channelId: ch.id, type: kind, reason, participants: [interaction.user.id] });

  const embed = new EmbedBuilder().setTitle(kind === 'appeal' ? 'Appeal Ticket' : 'Support Ticket').setDescription(`Reason: ${reason}`).setColor(config.embedColor).setTimestamp();
  const row = controlRow({ claimedBy: null });
  await ch.send({ embeds: [embed], components: [row] });
  await interaction.reply({ content: `Your ${kind} ticket has been created: ${ch}.`, ephemeral: true });
  await sendModLog(guild, 'Ticket Opened', [
    { name: 'Channel', value: `${ch}` },
    { name: 'User', value: `${interaction.user.tag} (${interaction.user.id})` },
    { name: 'Type', value: kind },
  ]);
}

export async function handleSelect(interaction) {
  if (!interaction.isStringSelectMenu || !interaction.isStringSelectMenu()) return;
  const { guild, user } = interaction;
  if (interaction.customId !== 'ticket_dropdown_select') return;
  const value = interaction.values?.[0];
  if (!value) return interaction.reply({ content: 'No category selected.', ephemeral: true });
  const open = await findOpenTicketsByUser(guild.id, user.id);
  if (open.length >= (config.maxTicketsPerUser || 1)) {
    return interaction.reply({ content: 'You already have an open ticket.', ephemeral: true });
  }

  // Show modal with questions based on ticket type
  const categoryMap = {
    'support': 'Support',
    'giveaway_claim': 'Giveaway Claim',
    'market': 'Market',
    'building_services': 'Building Service'
  };
  const categoryDisplay = categoryMap[value] || value;

  const modal = new ModalBuilder()
    .setCustomId(`ticket_dropdown_modal_${value}`)
    .setTitle(`${categoryDisplay} Ticket`);

  if (value === 'support') {
    const ignInput = new TextInputBuilder()
      .setCustomId('ign')
      .setLabel('IGN')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder('Enter your in-game name');

    const issueInput = new TextInputBuilder()
      .setCustomId('issue')
      .setLabel('Please explain your issue')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setPlaceholder('Describe your issue in detail');

    const additionalInput = new TextInputBuilder()
      .setCustomId('additional')
      .setLabel('Is there anything we should know?')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setPlaceholder('Any additional information (optional)');

    modal.addComponents(
      new ActionRowBuilder().addComponents(ignInput),
      new ActionRowBuilder().addComponents(issueInput),
      new ActionRowBuilder().addComponents(additionalInput)
    );
  } else if (value === 'giveaway_claim') {
    const giveawayInput = new TextInputBuilder()
      .setCustomId('giveaway')
      .setLabel('Which giveaway did you win?')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setPlaceholder('Specify which giveaway you won');

    const ignInput = new TextInputBuilder()
      .setCustomId('ign')
      .setLabel('IGN')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder('Enter your in-game name');

    modal.addComponents(
      new ActionRowBuilder().addComponents(giveawayInput),
      new ActionRowBuilder().addComponents(ignInput)
    );
  } else if (value === 'market') {
    const buyOrSellInput = new TextInputBuilder()
      .setCustomId('buy_or_sell')
      .setLabel('Do you wish to buy or sell?')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder('Type "buy" or "sell"');

    const itemInput = new TextInputBuilder()
      .setCustomId('item')
      .setLabel('What do you want to sell or buy?')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setPlaceholder('Describe what you want to buy or sell');

    const ignInput = new TextInputBuilder()
      .setCustomId('ign')
      .setLabel('IGN')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder('Enter your in-game name');

    modal.addComponents(
      new ActionRowBuilder().addComponents(buyOrSellInput),
      new ActionRowBuilder().addComponents(itemInput),
      new ActionRowBuilder().addComponents(ignInput)
    );
  } else if (value === 'building_services') {
    const buildInput = new TextInputBuilder()
      .setCustomId('build')
      .setLabel('What do you want the builders to build?')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setPlaceholder('Describe what you want built');

    const ignInput = new TextInputBuilder()
      .setCustomId('ign')
      .setLabel('IGN')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder('Enter your in-game name');

    modal.addComponents(
      new ActionRowBuilder().addComponents(buildInput),
      new ActionRowBuilder().addComponents(ignInput)
    );
  }

  await interaction.showModal(modal);
}