import express from 'express';
import { authenticate } from '../../auth/middleware.js';
import { getGuildChannels } from '../../services/discord.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const channels = await getGuildChannels(req.user.guildId);
    res.json(channels);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;