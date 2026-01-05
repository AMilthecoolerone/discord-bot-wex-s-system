import { logger } from '../utils/logger.js';
import { handleButton, handleModal, handleSelect } from '../modules/tickets/ticketHandlers.js';

export default {
  name: 'interactionCreate',
  async execute(interaction, client) {
    try {
      if (interaction.isChatInputCommand()) {
        const cmd = client.commands.get(interaction.commandName);
        if (!cmd) return;
        await cmd.execute(interaction, client);
      } else if (interaction.isButton()) {
        await handleButton(interaction);
      } else if (interaction.isStringSelectMenu && interaction.isStringSelectMenu()) {
        // Backward-safe check; in d.js v14 this returns a function; v14+ exposes method.
        await handleSelect(interaction);
      } else if (interaction.isModalSubmit()) {
        await handleModal(interaction);
      }
    } catch (err) {
      logger.error('Interaction error', err);
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({ content: 'An error occurred.', ephemeral: true }).catch(() => {});
      } else {
        await interaction.reply({ content: 'An error occurred.', flags: [1] }).catch(() => {});
      }
    }
  }
};
