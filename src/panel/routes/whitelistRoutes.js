import express from 'express';
import { authenticate } from '../../auth/middleware.js';
import db from '../../database/db.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const whitelist = await db.all(`
      SELECT w.*, u.tag as username, a.tag as added_by_username
      FROM whitelist w
      LEFT JOIN users u ON w.user_id = u.id
      LEFT JOIN users a ON w.added_by = a.id
      WHERE w.guild_id = ?
      ORDER BY w.created_at DESC
    `, req.user.guildId);

    res.json(whitelist);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;