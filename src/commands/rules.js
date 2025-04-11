import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import db from '../database/db.js';

// Initialise la table rules si elle n'existe pas
await db.exec(`
  CREATE TABLE IF NOT EXISTS rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    role_id TEXT NOT NULL,
    title TEXT DEFAULT 'Règlement du serveur',
    description TEXT NOT NULL,
    button_text TEXT DEFAULT 'J''accepte le règlement',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(guild_id)
  )
`);

export async function handleRulesCommand(message) {
  const args = message.content.split(' ');
  args.shift(); // Supprime la commande

  if (args.length < 3) {
    return message.reply('Format incorrect. Utilisez : !rules #salon @role votre_règlement');
  }

  const channel = message.mentions.channels.first();
  const role = message.mentions.roles.first();

  if (!channel || !role) {
    return message.reply('Veuillez mentionner un salon et un rôle valides !');
  }

  // Supprime les mentions du tableau d'arguments
  args.splice(args.findIndex(arg => arg.startsWith('<#')), 1);
  args.splice(args.findIndex(arg => arg.startsWith('<@&')), 1);

  const rules = args.join(' ');

  try {
    // Enregistre les règles dans la base de données
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO rules (guild_id, channel_id, role_id, description)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(message.guild.id, channel.id, role.id, rules);

    const embed = new EmbedBuilder()
      .setTitle('📜 Règlement du serveur')
      .setDescription(rules)
      .setColor('#2b2d31')
      .setFooter({ text: 'Cliquez sur le bouton ci-dessous pour accepter le règlement' })
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('accept_rules')
          .setLabel('J\'accepte le règlement')
          .setStyle(ButtonStyle.Success)
          .setEmoji('✅')
      );

    await channel.send({
      embeds: [embed],
      components: [row]
    });

    await message.reply(`✅ Le règlement a été configuré dans ${channel} avec le rôle ${role}`);
  } catch (error) {
    console.error('Erreur lors de la configuration du règlement:', error);
    await message.reply('Une erreur est survenue lors de la configuration du règlement.');
  }
}