import { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import { findOpenTicketsByUser } from '../../modules/tickets/ticketModel.js';
import { config } from '../../config/index.js';

const choices = [
  { name: 'Building Services', value: 'building_services' },
  { name: 'Support', value: 'support' },
  { name: 'Market', value: 'market' },
  { name: 'Giveaway claim', value: 'giveaway_claim' }
];

export default {
  data: new SlashCommandBuilder()
    .setName('ticket-open')
    .setDescription('Open a new ticket with a specific category')
    .addStringOption(o => o
      .setName('type')
      .setDescription('Ticket type')
      .setRequired(true)
      .addChoices(...choices)),
  async execute(interaction) {
    const typeChoice = interaction.options.getString('type', true);
    
    // Enforce max open tickets per user
    const open = await findOpenTicketsByUser(interaction.guild.id, interaction.user.id);
    if (open.length >= (config.maxTicketsPerUser || 1)) {
      return interaction.reply({ content: 'You already have an open ticket.', ephemeral: true });
    }

    const modal = new ModalBuilder()
      .setCustomId(`ticket_open_modal_${typeChoice}`)
      .setTitle(`${choices.find(c => c.value === typeChoice)?.name || typeChoice} Ticket`);

    if (typeChoice === 'support') {
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
    } else if (typeChoice === 'giveaway_claim') {
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
    } else if (typeChoice === 'market') {
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
    } else if (typeChoice === 'building_services') {
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
};
