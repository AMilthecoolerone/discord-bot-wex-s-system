import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('nick')
    .setDescription('Change a user\'s nickname')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
    .addStringOption(o => o.setName('nickname').setDescription('New nickname').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),
  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const nickname = interaction.options.getString('nickname', true);
    const member = await interaction.guild.members.fetch(user.id).catch(()=>null);
    if (!member) return interaction.reply({ content: 'User not found in this guild.', ephemeral: true });
    await member.setNickname(nickname).catch(()=>{});
    await interaction.reply({ content: `Nickname updated for ${user.tag}.`, ephemeral: true });
  }
};
