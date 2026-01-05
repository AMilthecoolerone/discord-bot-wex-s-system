import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder().setName('ping').setDescription('Pong! v2'),
  async execute(interaction) {
    const sent = await interaction.reply({ content: 'Pinging...', ephemeral: true, fetchReply: true });
    const diff = sent.createdTimestamp - interaction.createdTimestamp;
    await interaction.editReply(`Pong! Latency: ${diff}ms`);
  }
};
