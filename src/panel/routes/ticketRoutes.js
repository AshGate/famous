import express from 'express';
import { authenticate } from '../../auth/middleware.js';
import db from '../../database/db.js';
import { getGuildChannels } from '../../services/discord.js';
import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { getDiscordClient } from '../../utils/discord.js';

const router = express.Router();

// Route pour récupérer la liste des salons
router.get('/channels', authenticate, async (req, res) => {
  try {
    const channels = await getGuildChannels(req.user.guildId);
    res.json(channels);
  } catch (error) {
    console.error('Erreur lors de la récupération des salons:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour récupérer la configuration actuelle
router.get('/config', authenticate, async (req, res) => {
  try {
    const stmt = await db.prepare(`
      SELECT * FROM ticket_settings
      WHERE guild_id = ?
    `);
    
    const result = await stmt.get(req.user.guildId);
    
    res.json(result || {
      title: 'Contactez notre entreprise',
      description: 'Afin de prendre contact avec notre secrétariat, utilisez l\'onglet ci-dessous 📩'
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour mettre à jour la configuration
router.post('/config', authenticate, async (req, res) => {
  try {
    const { channelId, title, description } = req.body;
    
    // Vérifie que le salon existe
    const client = getDiscordClient();
    const channel = await client.channels.fetch(channelId);
    
    if (!channel) {
      return res.status(404).json({ error: 'Salon introuvable' });
    }

    // Met à jour la configuration dans la base de données
    const stmt = await db.prepare(`
      INSERT OR REPLACE INTO ticket_settings (guild_id, channel_id, title, description)
      VALUES (?, ?, ?, ?)
    `);

    await stmt.run(req.user.guildId, channelId, title, description);

    // Crée et envoie l'embed de ticket
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor('#2b2d31')
      .setTimestamp();

    const button = new ButtonBuilder()
      .setCustomId('create_ticket')
      .setLabel('Créer un ticket')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('📩');

    const row = new ActionRowBuilder().addComponents(button);

    await channel.send({
      embeds: [embed],
      components: [row]
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ 
      error: 'Erreur serveur',
      details: error.message 
    });
  }
});

export default router;