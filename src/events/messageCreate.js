import { sendModLog } from '../utils/modlog.js';

function hasInvite(text) {
  return /(discord\.gg\/|discord\.com\/invite\/)/i.test(text);
}
function hasMassMentions(message) {
  const mentions = (message.mentions.users.size || 0) + (message.mentions.roles.size || 0) + (message.mentions.everyone ? 1 : 0);
  return mentions >= 5;
}
function excessiveCaps(text) {
  const letters = text.replace(/[^a-zA-Z]/g, '');
  if (letters.length < 10) return false;
  const caps = letters.replace(/[a-z]/g, '').length;
  return caps / letters.length > 0.7;
}
function hasManyLinks(text) {
  const links = text.match(/https?:\/\/\S+/g);
  return links && links.length >= 5;
}

export default {
  name: 'messageCreate',
  async execute(message, client) {
    if (!message.guild || message.author.bot) return;
    const content = message.content || '';
    if (hasInvite(content) || hasMassMentions(message) || excessiveCaps(content) || hasManyLinks(content)) {
      await message.delete().catch(()=>{});
      await sendModLog(message.guild, 'Automod: Message removed', [
        { name: 'User', value: `${message.author.tag} (${message.author.id})`, inline: true },
        { name: 'Reason', value: 'Anti-spam filter triggered' },
        { name: 'Channel', value: `${message.channel}` }
      ]);
    }
  }
};
