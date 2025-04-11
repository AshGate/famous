import express from 'express';
import { authenticate } from '../../auth/middleware.js';
import db from '../../database/db.js';
import { EmbedBuilder } from 'discord.js';
import { getDiscordClient } from '../../utils/discord.js';

const router = express.Router();

// Route pour récupérer la liste des salons
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
    console.error('Erreur lors de la récupération des salons:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour récupérer la liste des rôles
router.get('/roles', authenticate, async (req, res) => {
  try {
    const client = getDiscordClient();
    const guild = await client.guilds.fetch(req.user.guildId);
    
    const roles = guild.roles.cache
      .filter(role => role.id !== guild.id)
      .map(role => ({
        id: role.id,
        name: role.name,
        color: role.hexColor
      }));

    res.json(roles);
  } catch (error) {
    console.error('Erreur lors de la récupération des rôles:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour récupérer le statut actuel
router.get('/status', authenticate, async (req, res) => {
  try {
    const stmt = await db.prepare(`
      SELECT channel_id, role_id, is_open 
      FROM recruitment
      WHERE guild_id = ?
    `);

    const status = await stmt.get(req.user.guildId);
    res.json({
      isOpen: status ? status.is_open === 1 : false,
      channelId: status?.channel_id || '',
      roleId: status?.role_id || ''
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour mettre à jour le statut
router.post('/update', authenticate, async (req, res) => {
  try {
    const { channelId, roleId, status } = req.body;
    const isOpen = status === 'open' ? 1 : 0;
    const client = getDiscordClient();
    
    const channel = await client.channels.fetch(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Canal introuvable' });
    }

    const stmt = await db.prepare(`
      INSERT OR REPLACE INTO recruitment (guild_id, channel_id, role_id, is_open)
      VALUES (?, ?, ?, ?)
    `);

    await stmt.run(req.user.guildId, channelId, roleId, isOpen);

    const embed = new EmbedBuilder()
      .setTitle(isOpen ? '🟢 Recrutements Ouverts' : '🔴 Recrutements Fermés')
      .setDescription(isOpen ? 
        `<@&${roleId}> Les candidatures sont maintenant ouvertes !\nVous pouvez postuler dans ce salon.` :
        `<@&${roleId}> Les candidatures sont maintenant fermées.\nMerci de votre compréhension.`)
      .setColor('#2b2d31')
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;