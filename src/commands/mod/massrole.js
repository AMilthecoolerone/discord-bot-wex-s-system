import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { sendModLog } from '../../utils/modlog.js';
import { config } from '../../config/index.js';

export default {
  data: new SlashCommandBuilder()
    .setName('massrole')
    .setDescription('Add the [⬜] Member role to all members in the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  async execute(interaction) {
    const roleName = '[⬜] Member';
    const role = interaction.guild.roles.cache.find(r => r.name === roleName);
    if (!role) return interaction.reply({ content: `Role "${roleName}" not found. Make sure it exists.`, flags: [MessageFlags.Ephemeral] });

    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const members = await interaction.guild.members.fetch();
    let added = 0;
    let failed = 0;

    for (const member of members.values()) {
      try {
        if (!member.roles.cache.has(role.id)) {
          await member.roles.add(role);
          added++;
        }
      } catch (error) {
        failed++;
        console.error(`Failed to add role to ${member.user.tag}:`, error);
      }
    }

    await sendModLog(interaction.guild, 'Mass Role Added', [
      { name: 'Role', value: roleName },
      { name: 'Added to', value: `${added} members` },
      { name: 'Failed', value: `${failed} members` },
      { name: 'Moderator', value: `${interaction.user.tag}` }
    ]);

    await interaction.editReply({ content: `Added role "${roleName}" to ${added} members. Failed: ${failed}.` });
  }
};