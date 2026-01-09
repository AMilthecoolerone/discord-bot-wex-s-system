import { logger } from '../utils/logger.js';
import { handleButton, handleModal, handleSelect } from '../modules/tickets/ticketHandlers.js';
import { handleBuilderButton, handleBuilderModal } from '../modules/builder/builderHandlers.js';
import { handleGiveawayButton } from '../modules/giveaway/giveawayHandlers.js';

export default {
  name: 'interactionCreate',
  async execute(interaction, client) {
    try {
      if (interaction.isChatInputCommand()) {
        const cmd = client.commands.get(interaction.commandName);
        if (!cmd) return;
        await cmd.execute(interaction, client);

      } else if (interaction.isButton()) {
        // Check giveaway button first
        if (interaction.customId === 'giveaway_enter') {
          await handleGiveawayButton(interaction);
        } else if (interaction.customId === 'builder_apply_start') {
          await handleBuilderButton(interaction);
        } else {
          await handleButton(interaction);
        }

      } else if (interaction.isStringSelectMenu && interaction.isStringSelectMenu()) {
        // Backward-safe check; in d.js v14 this returns a function; v14+ exposes method.
        await handleSelect(interaction);

      } else if (interaction.isModalSubmit()) {
        // Check if it's a builder application modal first
        if (interaction.customId.startsWith('builder_modal_')) {
          await handleBuilderModal(interaction);
        } else {
          await handleModal(interaction);
        }
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
