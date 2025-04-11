import { EmbedBuilder } from 'discord.js';
import db from '../database/db.js';
import { getThemeColor } from './theme.js';
import { isWhitelisted } from './whitelist.js';

export async function handleRecruitmentCommand(message) {
  // Vérifier si l'utilisateur est whitelisté
  if (!isWhitelisted(message.guild.id, message.author.id)) {
    return message.reply('Vous n\'avez pas la permission d\'utiliser cette commande.');
  }

  const args = message.content.split(' ');
  args.shift(); // Supprime la commande

  if (args.length < 3) {
    return message.reply('Format incorrect. Utilisez : !recrutement <ouvrir/fermer> @role #salon');
  }

  const action = args[0].toLowerCase();
  const role = message.mentions.roles.first();
  const channel = message.mentions.channels.first();
  const guildId = message.guild.id;

  if (!role) {
    return message.reply('Veuillez mentionner un rôle valide !');
  }

  if (!channel) {
    return message.reply('Veuillez mentionner un salon valide !');
  }

  if (action !== 'ouvrir' && action !== 'fermer') {
    return message.reply('Action invalide. Utilisez "ouvrir" ou "fermer".');
  }

  const isOpen = action === 'ouvrir' ? 1 : 0;

  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO recruitment (guild_id, channel_id, is_open)
      VALUES (?, ?, ?)
    `);

    stmt.run(guildId, channel.id, isOpen);

    const embed = new EmbedBuilder()
      .setTitle(isOpen ? '🟢 Recrutements Ouverts' : '🔴 Recrutements Fermés')
      .setDescription(isOpen ? 
        `${role} Les candidatures sont maintenant ouvertes !\nVous pouvez postuler dans ce salon.` :
        `${role} Les candidatures sont maintenant fermées.\nMerci de votre compréhension.`)
      .setColor('#2b2d31')
      .setThumbnail(message.guild.iconURL({ dynamic: true, size: 512 }))
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    await message.reply(`Les recrutements ont été ${isOpen ? 'ouverts' : 'fermés'} dans ${channel} avec notification du rôle ${role}`);
  } catch (error) {
    console.error('Erreur:', error);
    await message.reply('Une erreur est survenue lors de la mise à jour des recrutements.');
  }
}