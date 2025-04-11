import { EmbedBuilder } from 'discord.js';
import db from '../database/db.js';

const ADMIN_ID = '619551502272561152';

function isAdmin(userId) {
  return userId === ADMIN_ID;
}

export async function handleMessageLogOnCommand(message) {
  if (!isAdmin(message.author.id)) {
    return message.reply('Vous n\'avez pas la permission d\'utiliser cette commande.');
  }

  const channel = message.mentions.channels.first();
  if (!channel) {
    return message.reply('Format incorrect. Utilisez : !messagelog on #salon');
  }

  const guildId = message.guild.id;
  const channelId = channel.id;

  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO message_logs (guild_id, log_channel_id, enabled)
      VALUES (?, ?, true)
    `);

    stmt.run(guildId, channelId);

    const embed = new EmbedBuilder()
      .setTitle('✅ Logs de messages activés')
      .setColor('#2b2d31')
      .addFields(
        { name: 'Salon', value: `<#${channelId}>` }
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Erreur:', error);
    await message.reply('Une erreur est survenue lors de l\'activation des logs.');
  }
}

export async function handleMessageLogOffCommand(message) {
  if (!isAdmin(message.author.id)) {
    return message.reply('Vous n\'avez pas la permission d\'utiliser cette commande.');
  }

  const guildId = message.guild.id;

  try {
    const stmt = db.prepare(`
      DELETE FROM message_logs
      WHERE guild_id = ?
    `);

    const result = stmt.run(guildId);

    if (result.changes === 0) {
      return message.reply('Les logs de messages n\'étaient pas activés.');
    }

    const embed = new EmbedBuilder()
      .setTitle('❌ Logs de messages désactivés')
      .setColor('#2b2d31')
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Erreur:', error);
    await message.reply('Une erreur est survenue lors de la désactivation des logs.');
  }
}