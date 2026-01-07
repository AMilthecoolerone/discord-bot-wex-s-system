import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import process from 'node:process';

export default {
  data: new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('Shows information about the bot'),

  async execute(interaction) {
    const client = interaction.client;

    const uptime = Math.floor(process.uptime());
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);

    const embed = new EmbedBuilder()
      .setTitle('🤖 Bot Information')
      .setColor(process.env.EMBED_COLOR || '#09f711ff')
      .setThumbnail(client.user.displayAvatarURL())
      .addFields(
        { name: 'Tag', value: client.user.tag, inline: true },
        { name: 'ID', value: client.user.id, inline: true },
        { name: 'Servers', value: `${client.guilds.cache.size}`, inline: true },
        { name: 'Uptime', value: `${days}d ${hours}h ${minutes}m`, inline: true },
        { name: 'Ping', value: `${client.ws.ping}ms`, inline: true },
        {
          name: 'Memory',
          value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
          inline: true
        },
        { name: 'Node.js', value: process.version, inline: true },
        { name: 'discord.js', value: 'v14', inline: true }
      )
      .setFooter({ text: 'Katapump Mod Bot' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
 