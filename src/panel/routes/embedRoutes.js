import express from 'express';
import { authenticate } from '../../auth/middleware.js';
import { EmbedBuilder } from 'discord.js';
import { getDiscordClient } from '../../utils/discord.js';
import { getGuildChannels } from '../../services/discord.js';

const router = express.Router();

// Récupère la liste des salons
router.get('/channels', authenticate, async (req, res) => {
  try {
    const channels = await getGuildChannels(req.user.guildId);
    res.json(channels);
  } catch (error) {
    console.error('Erreur lors de la récupération des salons:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Crée un nouvel embed
router.post('/create', authenticate, async (req, res) => {
  try {
    const { title, description, channelId, color, image, footer } = req.body;
    const client = getDiscordClient();
    const channel = await client.channels.fetch(channelId);

    if (!channel) {
      return res.status(404).json({ error: 'Canal introuvable' });
    }

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(color || '#2b2d31')
      .setTimestamp();

    if (image) {
      embed.setImage(image);
    }

    if (footer) {
      embed.setFooter({ text: footer });
    }

    await channel.send({ embeds: [embed] });
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la création de l\'embed:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;