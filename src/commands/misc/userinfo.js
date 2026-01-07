import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Shows information about a user')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to inspect')
        .setRequired(false)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const member = await interaction.guild.members.fetch(user.id);

    const roles = member.roles.cache
      .filter(role => role.id !== interaction.guild.id)
      .map(role => role.toString())
      .join(', ') || 'None';

    const embed = new EmbedBuilder()
      .setTitle('👤 User Information')
      .setColor(process.env.EMBED_COLOR || '#5865F2')
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'User', value: `${user.tag}`, inline: true },
        { name: 'ID', value: user.id, inline: true },
        { name: 'Bot', value: user.bot ? 'Yes' : 'No', inline: true },
        {
          name: 'Account Created',
          value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`,
          inline: true
        },
        {
          name: 'Joined Server',
          value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`,
          inline: true
        },
        {
          name: 'Roles',
          value: roles.length > 1024 ? 'Too many roles' : roles
        }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
