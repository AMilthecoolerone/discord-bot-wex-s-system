import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { findTicketByChannel, updateTicket } from '../../modules/tickets/ticketModel.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ticket-reopen')
    .setDescription('Reopen this ticket')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const ticket = await findTicketByChannel(interaction.guild.id, interaction.channel.id);
    if (!ticket || ticket.open) return interaction.reply({ content: 'This ticket is already open or not a ticket channel.', ephemeral: true });
    // Restore creator permissions
    await interaction.channel.permissionOverwrites.edit(ticket.userId, { ViewChannel: true, SendMessages: true }).catch(()=>{});
    await updateTicket({ guildId: interaction.guild.id, channelId: interaction.channel.id }, { $set: { open: true, closedAt: null } });
    await interaction.reply({ content: 'Ticket reopened.', ephemeral: true });
  }
};
