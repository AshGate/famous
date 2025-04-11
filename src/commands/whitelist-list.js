import { EmbedBuilder } from 'discord.js';
import db from '../database/db.js';

export async function handleWhitelistListCommand(message) {
  const guildId = message.guild.id;

  try {
    const stmt = db.prepare(`
      SELECT user_id, added_by, created_at, expires_at
      FROM whitelist
      WHERE guild_id = ?
      ORDER BY created_at DESC
    `);

    const whitelistedUsers = stmt.all(guildId);

    if (!whitelistedUsers || whitelistedUsers.length === 0) {
      return message.reply('Aucun utilisateur whitelisté sur ce serveur.');
    }

    const embed = new EmbedBuilder()
      .setTitle('📋 Liste des utilisateurs whitelistés')
      .setColor('#2b2d31')
      .setDescription(
        await Promise.all(whitelistedUsers.map(async (user) => {
          try {
            const discordUser = await message.client.users.fetch(user.user_id);
            const addedByUser = await message.client.users.fetch(user.added_by);
            const addedDate = new Date(user.created_at).toLocaleDateString();
            let status = 'Permanent';
            
            if (user.expires_at) {
              const expiresAt = new Date(user.expires_at);
              const now = new Date();
              if (expiresAt > now) {
                status = `Expire le ${expiresAt.toLocaleString()}`;
              } else {
                status = 'Expiré';
              }
            }
            
            return `**${discordUser.tag}** (${user.user_id})\nAjouté par: ${addedByUser.tag}\nLe: ${addedDate}\nStatut: ${status}\n`;
          } catch (error) {
            return `**ID: ${user.user_id}**\nAjouté par: ${user.added_by}\nLe: ${new Date(user.created_at).toLocaleDateString()}\n`;
          }
        })).then(descriptions => descriptions.join('\n'))
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Erreur:', error);
    await message.reply('Une erreur est survenue lors de la récupération de la liste des utilisateurs whitelistés.');
  }
}