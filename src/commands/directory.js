import { EmbedBuilder } from 'discord.js';
import db from '../database/db.js';

export async function handleDirectoryCommand(message) {
  const args = message.content.split(' ');
  args.shift(); // Supprime la commande

  if (args.length < 3) {
    return message.reply('Format incorrect. Utilisez : !ajoutannuaire nom prénom numéro');
  }

  const nom = args[0];
  const prenom = args[1];
  const numero = args[2];
  const guildId = message.guild.id;

  try {
    // Ajouter la nouvelle entrée
    const stmt = db.prepare(`
      INSERT INTO directory (guild_id, nom, prenom, numero)
      VALUES (?, ?, ?, ?)
    `);

    try {
      stmt.run(guildId, nom, prenom, numero);
    } catch (err) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return message.reply('Ce numéro existe déjà dans l\'annuaire !');
      }
      throw err;
    }

    const embed = new EmbedBuilder()
      .setTitle('✅ Contact ajouté à l\'annuaire')
      .setColor('#2b2d31')
      .addFields(
        { name: 'Nom', value: nom, inline: true },
        { name: 'Prénom', value: prenom, inline: true },
        { name: 'Numéro', value: numero, inline: true }
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Erreur:', error);
    await message.reply('Une erreur est survenue lors de l\'ajout du contact.');
  }
}

export async function handleSearchDirectoryCommand(message) {
  const args = message.content.split(' ');
  args.shift(); // Supprime la commande

  if (args.length < 1) {
    return message.reply('Format incorrect. Utilisez : !recherche nom_ou_numero');
  }

  const searchTerm = args[0];
  const guildId = message.guild.id;

  try {
    const stmt = db.prepare(`
      SELECT * FROM directory 
      WHERE guild_id = ? 
      AND (LOWER(nom) LIKE LOWER(?) OR LOWER(prenom) LIKE LOWER(?) OR numero LIKE ?)
    `);

    const searchPattern = `%${searchTerm}%`;
    const contacts = stmt.all(guildId, searchPattern, searchPattern, searchPattern);

    if (!contacts || contacts.length === 0) {
      return message.reply('Aucun contact trouvé.');
    }

    const embed = new EmbedBuilder()
      .setTitle('📞 Résultats de la recherche')
      .setColor('#2b2d31')
      .setDescription(
        contacts.map(contact => 
          `**${contact.nom} ${contact.prenom}**\nNuméro: ${contact.numero}`
        ).join('\n\n')
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Erreur:', error);
    await message.reply('Une erreur est survenue lors de la recherche.');
  }
}