import { SlashCommandBuilder } from 'discord.js';
import { endGiveaway } from '../../modules/giveaway/giveawayModel.js';

export default {
  data: new SlashCommandBuilder()
    .setName('giveaway-end')
    .setDescription('End a giveaway early')
    .addStringOption(o =>
      o.setName('id').setDescription('Giveaway ID').setRequired(true)),

  async execute(interaction) {
    if (!interaction.member.permissions.has('ManageGuild')) {
      return interaction.reply({ content: 'No permission.', ephemeral: true });
    }

    const g = await endGiveaway(interaction.options.getString('id', true));
    if (!g) {
      return interaction.reply({ content: 'Invalid giveaway ID.', ephemeral: true });
    }

    interaction.reply({ content: 'Giveaway ended successfully.' });
  }
};
