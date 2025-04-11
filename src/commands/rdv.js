import { EmbedBuilder } from 'discord.js';
import db from '../database/db.js';
import { format, parse, isValid } from 'date-fns';
import { fr } from 'date-fns/locale/index.js';

export async function handleRdvCommand(message) {
  const args = message.content.split(' ');
  args.shift(); // Supprime la commande !rdv

  if (args.length < 4) {
    return message.reply('Format incorrect. Utilisez : !rdv #salon JJ/MM/YYYY HH:mm lieu description');
  }

  const channel = message.mentions.channels.first();
  if (!channel) {
    return message.reply('Veuillez mentionner un salon valide !');
  }

  // Supprime la mention du salon
  args.splice(args.findIndex(arg => arg.startsWith('<#')), 1);

  const dateStr = args[0];
  const timeStr = args[1];
  const lieu = args[2];
  const description = args.slice(3).join(' ');

  // Validation du format de la date (JJ/MM/YYYY)
  const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  if (!dateRegex.test(dateStr)) {
    return message.reply('Format de date invalide. Utilisez : JJ/MM/YYYY');
  }

  // Validation du format de l'heure (HH:mm)
  const timeRegex = /^(\d{2}):(\d{2})$/;
  if (!timeRegex.test(timeStr)) {
    return message.reply('Format d\'heure invalide. Utilisez : HH:mm');
  }

  try {
    // Parse la date et l'heure au format français
    const dateTimeStr = `${dateStr} ${timeStr}`;
    const dateTime = parse(dateTimeStr, 'dd/MM/yyyy HH:mm', new Date());

    if (!isValid(dateTime)) {
      return message.reply('Date ou heure invalide. Vérifiez que la date existe.');
    }

    // Vérifie si la date est dans le futur
    if (dateTime < new Date()) {
      return message.reply('La date du rendez-vous doit être dans le futur.');
    }

    // Crée l'embed avec le format français
    const embed = new EmbedBuilder()
      .setTitle('📅 Nouveau Rendez-vous')
      .setColor('#2b2d31')
      .addFields(
        { 
          name: '📆 Date et Heure', 
          value: format(dateTime, 'EEEE d MMMM yyyy à HH:mm', { locale: fr }),
          inline: false 
        },
        { 
          name: '📍 Lieu', 
          value: lieu,
          inline: true 
        },
        { 
          name: '👤 Organisateur', 
          value: `<@${message.author.id}>`,
          inline: true 
        },
        { 
          name: '📝 Description', 
          value: description,
          inline: false 
        }
      )
      .setTimestamp();

    // Enregistre le RDV dans la base de données
    const stmt = db.prepare(`
      INSERT INTO appointments (
        guild_id,
        channel_id,
        created_by,
        appointment_date,
        location,
        description
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      message.guild.id,
      channel.id,
      message.author.id,
      dateTime.toISOString(),
      lieu,
      description
    );

    // Envoie l'embed dans le salon spécifié
    await channel.send({ embeds: [embed] });
    await message.reply(`✅ Rendez-vous créé avec succès dans ${channel}`);

  } catch (error) {
    console.error('Erreur lors de la création du rendez-vous:', error);
    await message.reply('Une erreur est survenue lors de la création du rendez-vous.');
  }
}