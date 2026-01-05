import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { findTicketByChannel, updateTicket } from '../../modules/tickets/ticketModel.js';
import { config } from '../../config/index.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ticket-add')
    .setDescription('Add a user to this ticket')
    .addUserOption(o => o.setName('user').setDescription('User to add').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const ticket = await findTicketByChannel(interaction.guild.id, interaction.channel.id);
    if (!ticket || !ticket.open) return interaction.reply({ content: 'No open ticket found in this channel.', ephemeral: true });
    await interaction.channel.permissionOverwrites.edit(user.id, { ViewChannel: true, SendMessages: true }).catch(()=>{});
    const participants = Array.from(new Set([...(ticket.participants||[]), user.id]));
    await updateTicket({ guildId: interaction.guild.id, channelId: interaction.channel.id }, { $set: { participants } });
    await interaction.reply({ content: `Added ${user.tag} to the ticket.`, ephemeral: true });
  }
};
