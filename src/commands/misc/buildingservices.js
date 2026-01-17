// at the top of your file
const { SlashCommandBuilder,  EmbedBuilder } = require('discord.js');

// inside a command, event listener, etc.
const buildingservices = new EmbedBuilder()
	.setColor(process.env.EMBED_COLOR)
	.setTitle('Farms per hour viewer')
	.setURL('https://discord.js.org/')
	.setAuthor({ name: 'Wexs building Co.', iconURL: 'https://i.imgur.com/AfFp7pu.png' })
	.setDescription('Displays the farms per hour for each building service.')
	.setThumbnail('https://i.imgur.com/AfFp7pu.png')
	.addFields(
		{ name: 'Ikea v1', value: '30M per hour / 432K Kelp' },
		{ name: 'Ikea v2', value: '15 - 40M' },
		{ name: 'Mau v6', value: '223M per hour', inline: true },
		{ name: 'Inline field title', value: 'Some value here', inline: true },
	)
	.addFields({ name: 'All Farms are in Full bases', value: 'Smokers e.t.c', inline: true })
	.setImage('https://i.imgur.com/AfFp7pu.png')
	.setTimestamp()
	.setFooter({ text: 'Made by Amil (Maintain)', iconURL: 'https://cdn.discordapp.com/attachments/1457913980919087310/1462042677523644551/ChatGPT_Image_17._Jan._2026_12_15_35.png?ex=696cc0d9&is=696b6f59&hm=490f341218d63cd73ef5a6b0e89958d24a6ae785996ed381db06a3e300a1db59&' });

channel.send({ embeds: [exampleEmbed] });