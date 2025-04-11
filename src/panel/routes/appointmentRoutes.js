import express from 'express';
import { authenticate } from '../../auth/middleware.js';
import db from '../../database/db.js';
import { EmbedBuilder } from 'discord.js';
import { getDiscordClient } from '../../utils/discord.js';
import { format, addHours, addDays } from 'date-fns';
import { fr } from 'date-fns/locale/index.js';

const router = express.Router();

// Récupère la liste des salons
router.get('/channels', authenticate, async (req, res) => {
  try {
    const client = getDiscordClient();
    const guild = await client.guilds.fetch(req.user.guildId);
    
    const channels = guild.channels.cache
      .filter(channel => channel.type === 0)
      .map(channel => ({
        id: channel.id,
        name: channel.name
      }));

    res.json(channels);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupère tous les rendez-vous
router.get('/', authenticate, async (req, res) => {
  try {
    const appointments = await db.all(`
      SELECT * FROM appointments
      WHERE guild_id = ?
      ORDER BY appointment_date ASC
    `, req.user.guildId);

    const events = appointments.map(appointment => ({
      id: appointment.id,
      title: appointment.description.substring(0, 30) + '...',
      start: appointment.appointment_date,
      location: appointment.location,
      description: appointment.description,
      allDay: false
    }));

    res.json(events);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Crée un nouveau rendez-vous
router.post('/create', authenticate, async (req, res) => {
  try {
    const { channelId, date, time, location, description } = req.body;
    const client = getDiscordClient();
    const channel = await client.channels.fetch(channelId);

    if (!channel) {
      return res.status(404).json({ error: 'Canal introuvable' });
    }

    const dateTime = new Date(`${date}T${time}`);

    // Crée le rendez-vous dans la base de données
    const result = await db.run(`
      INSERT INTO appointments (
        guild_id,
        channel_id,
        created_by,
        appointment_date,
        location,
        description
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, req.user.guildId, channelId, req.user.userId, dateTime.toISOString(), location, description);

    const appointmentId = result.lastID;

    // Crée les rappels (1 jour avant et 1 heure avant)
    const oneDayBefore = addDays(dateTime, -1);
    const oneHourBefore = addHours(dateTime, -1);

    await db.run(`
      INSERT INTO appointment_reminders (appointment_id, reminder_time)
      VALUES (?, ?)
    `, appointmentId, oneDayBefore.toISOString());

    await db.run(`
      INSERT INTO appointment_reminders (appointment_id, reminder_time)
      VALUES (?, ?)
    `, appointmentId, oneHourBefore.toISOString());

    // Envoie l'embed dans le salon Discord
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
          value: location,
          inline: true 
        },
        { 
          name: '👤 Organisateur', 
          value: `<@${req.user.userId}>`,
          inline: true 
        },
        { 
          name: '📝 Description', 
          value: description,
          inline: false 
        }
      )
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    res.json({ success: true, id: appointmentId });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprime un rendez-vous
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await db.run(`
      DELETE FROM appointments
      WHERE id = ? AND guild_id = ?
    `, req.params.id, req.user.guildId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;