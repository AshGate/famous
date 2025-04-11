import { EmbedBuilder } from 'discord.js';
import db from '../database/db.js';
import { invoiceCreationState, handleInvoiceCreation } from '../commands/invoice.js';

function getLogChannel(guildId) {
  const stmt = db.prepare(`
    SELECT log_channel_id FROM message_logs
    WHERE guild_id = ? AND enabled = true
  `);
  const result = stmt.get(guildId);
  return result ? result.log_channel_id : null;
}

export async function handleMessageDelete(message) {
  if (!message.guild || message.author?.bot) return;

  const logChannelId = getLogChannel(message.guild.id);
  if (!logChannelId) return;

  const logChannel = message.guild.channels.cache.get(logChannelId);
  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setTitle('🗑️ Message supprimé')
    .setColor('#ff0000')
    .addFields(
      { name: 'Auteur', value: `${message.author.tag} (${message.author.id})` },
      { name: 'Salon', value: `${message.channel.name} (${message.channel.id})` },
      { name: 'Contenu', value: message.content || 'Aucun contenu texte' }
    )
    .setTimestamp();

  await logChannel.send({ embeds: [embed] });
}

export async function handleMessageUpdate(oldMessage, newMessage) {
  if (!oldMessage.guild || oldMessage.author?.bot || oldMessage.content === newMessage.content) return;

  const logChannelId = getLogChannel(oldMessage.guild.id);
  if (!logChannelId) return;

  const logChannel = oldMessage.guild.channels.cache.get(logChannelId);
  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setTitle('✏️ Message modifié')
    .setColor('#ffa500')
    .addFields(
      { name: 'Auteur', value: `${oldMessage.author.tag} (${oldMessage.author.id})` },
      { name: 'Salon', value: `${oldMessage.channel.name} (${oldMessage.channel.id})` },
      { name: 'Ancien contenu', value: oldMessage.content || 'Aucun contenu texte' },
      { name: 'Nouveau contenu', value: newMessage.content || 'Aucun contenu texte' }
    )
    .setTimestamp();

  await logChannel.send({ embeds: [embed] });
}

export async function handleMessage(message) {
  if (message.author.bot) return;

  const userId = message.author.id;
  if (invoiceCreationState.has(userId)) {
    await handleInvoiceCreation(message);
  }
}