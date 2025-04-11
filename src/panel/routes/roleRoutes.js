import express from 'express';
import { authenticate } from '../../auth/middleware.js';
import { getGuildRoles } from '../../services/discord.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const roles = await getGuildRoles(req.user.guildId);
    res.json(roles);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;