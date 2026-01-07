import {SlashCommandBuilder, EmbedBuilder,PermissionFlagsBits} from 'discord.js';
export default {
  data: new SlashCommandBuilder()
    .setName('softban')
    .setDescription('Softbans a member from the server')
    .adduseroption(option =>
        option.setName('user').setDescription('The user to softban').setRequired(true))
        .addstringoption(option =>
            option.setName('reason').setDescription('The reason for the softban').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) {
            return interaction.reply({content: 'User not found in the server.', ephemeral: true });
            if (!member.bannable) {
                return interaction.reply({content: '❌ I cannot softban this user.', ephemeral: true });
            }   
        } 
     await interaction.guild.members.ban(user.id, {
      deleteMessageSeconds: 7 * 24 * 60 * 60,
      reason
    });

    await interaction.guild.members.unban(user.id, 'Softban completed');

    const embed = new EmbedBuilder()
      .setTitle('🔨 User Softbanned')
      .setColor('Green')
      .addFields(
        { name: 'User', value: `${user.tag} (${user.id})` },
        { name: 'Moderator', value: interaction.user.tag },
        { name: 'Reason', value: reason }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};