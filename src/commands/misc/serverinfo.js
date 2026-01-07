import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Shows information about this server'),

  async execute(interaction) {
    const { guild } = interaction;

    const owner = await guild.fetchOwner();

    const embed = new EmbedBuilder()
      .setTitle(`🏠 Server Info`)
      .setColor(process.env.EMBED_COLOR)
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .addFields(
        { name: 'Name', value: guild.name, inline: true },
        { name: 'ID', value: guild.id, inline: true },
        { name: 'Owner', value: `<@${owner.id}>`, inline: true },
        { name: 'Members', value: `${guild.memberCount}`, inline: true },
        { name: 'Boost Level', value: `Level ${guild.premiumTier}`, inline: true },
        { name: 'Boosts', value: `${guild.premiumSubscriptionCount}`, inline: true },
        { name: 'Roles', value: `${guild.roles.cache.size}`, inline: true },
        { name: 'Channels', value: `${guild.channels.cache.size}`, inline: true },
        {
          name: 'Created',
          value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`,
          inline: true
        }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
