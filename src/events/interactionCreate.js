import { logger } from '../utils/logger.js';
import { handleButton, handleModal, handleSelect } from '../modules/tickets/ticketHandlers.js';
import { addEntry } from '../modules/giveaway/giveawayModel.js';

export default {
  name: 'interactionCreate',
  async execute(interaction, client) {
    try {
      // Slash commands
      if (interaction.isChatInputCommand()) {
        const cmd = client.commands.get(interaction.commandName);
        if (!cmd) return;
        await cmd.execute(interaction, client);
        return;
      }

      // 🎉 GIVEAWAY BUTTON (handled FIRST)
      if (
        interaction.isButton() &&
        interaction.customId.startsWith('giveaway_join:')
      ) {
        const id = interaction.customId.split(':')[1];
        const ok = await addEntry(id, interaction.user.id);

        return interaction.reply({
          content: ok
            ? 'You have entered the giveaway!'
            : 'You already entered or the giveaway has ended.',
          ephemeral: true
        });
      }

      // 🎟️ Ticket buttons (existing logic)
      if (interaction.isButton()) {
        await handleButton(interaction);
        return;
      }

      // Select menus
      if (interaction.isStringSelectMenu && interaction.isStringSelectMenu()) {
        await handleSelect(interaction);
        return;
      }

      // Modals
      if (interaction.isModalSubmit()) {
        await handleModal(interaction);
        return;
      }

    } catch (err) {
      logger.error('Interaction error', err);

      if (interaction.deferred || interaction.replied) {
        await interaction
          .followUp({ content: 'An error occurred.', ephemeral: true })
          .catch(() => {});
      } else {
        await interaction
          .reply({ content: 'An error occurred.', flags: [1] })
          .catch(() => {});
      }
    }
  }
};
