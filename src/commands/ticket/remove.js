import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { findTicketByChannel, updateTicket } from '../../modules/tickets/ticketModel.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ticket-remove')
    .setDescription('Remove a user from this ticket')
    .addUserOption(o => o.setName('user').setDescription('User to remove').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const ticket = await findTicketByChannel(interaction.guild.id, interaction.channel.id);
    if (!ticket || !ticket.open) return interaction.reply({ content: 'No open ticket found in this channel.', ephemeral: true });
    await interaction.channel.permissionOverwrites.delete(user.id).catch(()=>{});
    const participants = (ticket.participants||[]).filter(id => id !== user.id);
    await updateTicket({ guildId: interaction.guild.id, channelId: interaction.channel.id }, { $set: { participants } });
    await interaction.reply({ content: `Removed ${user.tag} from the ticket.`, ephemeral: true });
  }
};
