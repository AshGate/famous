import { EmbedBuilder } from 'discord.js';
import db from '../database/db.js';

const COLORS = {
  'rouge': '#ff0000',
  'vert': '#00ff00',
  'bleu': '#0000ff',
  'jaune': '#ffff00',
  'cyan': '#00ffff',
  'rose': '#ff69b4',
  'violet': '#8a2be2',
  'orange': '#ffa500',
  'blanc': '#ffffff',
  'noir': '#000000',
  'gris': '#808080',
  'marron': '#8b4513',
  'pourpre': '#800080',
  'or': '#ffd700',
  'argent': '#c0c0c0'
};

export async function handleThemeCommand(message) {
  const args = message.content.split(' ');
  args.shift(); // Supprime la commande

  if (args.length < 1) {
    const colorList = Object.keys(COLORS).join(', ');
    return message.reply(`Format incorrect. Utilisez : !theme <couleur>\nCouleurs disponibles : ${colorList}`);
  }

  const colorName = args[0].toLowerCase();
  const hexColor = COLORS[colorName];

  if (!hexColor) {
    const colorList = Object.keys(COLORS).join(', ');
    return message.reply(`Couleur invalide. Couleurs disponibles : ${colorList}`);
  }

  const guildId = message.guild.id;

  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO theme (guild_id, color)
      VALUES (?, ?)
    `);

    stmt.run(guildId, hexColor);

    const embed = new EmbedBuilder()
      .setTitle('🎨 Thème mis à jour')
      .setDescription(`La couleur des embeds a été changée pour : ${colorName}`)
      .setColor(hexColor)
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Erreur:', error);
    await message.reply('Une erreur est survenue lors du changement de couleur.');
  }
}

export function getThemeColor(guildId) {
  try {
    const stmt = db.prepare('SELECT color FROM theme WHERE guild_id = ?');
    const result = stmt.get(guildId);
    return result ? result.color : '#2b2d31'; // Couleur par défaut si aucun thème n'est défini
  } catch (error) {
    console.error('Erreur lors de la récupération de la couleur:', error);
    return '#2b2d31'; // Couleur par défaut en cas d'erreur
  }
}