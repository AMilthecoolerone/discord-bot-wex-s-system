import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('pay-request')
    .setDescription('Request payment for a user')
    .addUserOption(o => o.setName('user').setDescription('User to pay').setRequired(true))
    .addStringOption(o => o.setName('amount').setDescription('Amount to pay').setRequired(true)),
  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const amount = interaction.options.getString('amount', true);

    const channel = await interaction.guild.channels.fetch('1457913980919087310').catch(() => null);
    if (!channel) {
      return interaction.reply({ content: 'Payment channel not found.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('Payment Request')
      .setDescription(`Request to pay **${amount}** to ${user}.\nRequested by ${interaction.user}.`)
      .setColor('#00FF00')
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('pay_accept').setLabel('Accept').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('pay_decline').setLabel('Decline').setStyle(ButtonStyle.Danger)
    );

    await channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: 'Payment request sent.', ephemeral: true });
  }
};