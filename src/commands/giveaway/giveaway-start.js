import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import { createGiveaway } from '../../modules/giveaway/giveawayModel.js';
import { config } from '../../config/index.js';

export default {
  data: new SlashCommandBuilder()
    .setName('giveaway-start')
    .setDescription('Start a giveaway')
    .addStringOption(o =>
      o.setName('prize').setDescription('Prize').setRequired(true))
    .addIntegerOption(o =>
      o.setName('duration').setDescription('Duration (minutes)').setRequired(true))
    .addIntegerOption(o =>
      o.setName('winners').setDescription('Number of winners').setMinValue(1).setRequired(true)),

  async execute(interaction) {
    if (!interaction.member.permissions.has('ManageGuild')) {
      return interaction.reply({ content: 'No permission.', ephemeral: true });
    }

    const prize = interaction.options.getString('prize', true);
    const minutes = interaction.options.getInteger('duration', true);
    const winners = interaction.options.getInteger('winners', true);

    const endsAt = Date.now() + minutes * 60_000;

    const id = await createGiveaway({
      guildId: interaction.guild.id,
      channelId: interaction.channel.id,
      prize,
      winners,
      endsAt
    });

    const embed = new EmbedBuilder()
      .setTitle('🎉 Giveaway')
      .setDescription(
        `**Prize:** ${prize}\nEnds <t:${Math.floor(endsAt / 1000)}:R>`
      )
      .setColor(config.embedColor)
      .setFooter({ text: `ID: ${id}` });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`giveaway_join:${id}`)
        .setLabel('Enter')
        .setStyle(ButtonStyle.Success)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
};
