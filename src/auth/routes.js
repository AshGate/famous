import express from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { checkAuth } from './middleware.js';
import { getDiscordClient } from '../utils/discord.js';
import crypto from 'crypto';

const router = express.Router();
const verificationCodes = new Map();

const VERIFICATION_TIMEOUT = 5 * 60 * 1000; // 5 minutes en millisecondes

router.get('/login', (req, res) => {
  if (req.session.token) {
    return res.redirect('/dashboard');
  }
  res.sendFile('login.html', { root: './public' });
});

router.post('/login', async (req, res) => {
  const { userId, guildId } = req.body;
  
  if (!userId || !/^\d+$/.test(userId) || !guildId) {
    return res.redirect('/login?error=1');
  }

  const client = getDiscordClient();
  try {
    const guild = await client.guilds.fetch(guildId);
    if (!guild) {
      return res.redirect('/login?error=1');
    }

    const auth = await checkAuth(userId, guildId);
    if (!auth.isAuthorized) {
      return res.redirect('/login?error=1');
    }

    // Génère un code de vérification
    const verificationCode = crypto.randomBytes(3).toString('hex').toUpperCase();
    
    // Stocke le code avec un timestamp
    verificationCodes.set(userId, {
      code: verificationCode,
      timestamp: Date.now(),
      guildId,
      role: auth.role
    });

    // Envoie le code en MP
    try {
      const user = await client.users.fetch(userId);
      await user.send(`Votre code de vérification pour le panel admin est : **${verificationCode}**\nCe code expirera dans 5 minutes.`);
      
      // Nettoie le code après 5 minutes
      setTimeout(() => {
        verificationCodes.delete(userId);
      }, VERIFICATION_TIMEOUT);

      res.redirect(`/verify?userId=${userId}`);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du code:', error);
      res.redirect('/login?error=3');
    }
  } catch (error) {
    console.error('Erreur de connexion:', error);
    res.redirect('/login?error=1');
  }
});

router.get('/verify', (req, res) => {
  const { userId } = req.query;
  if (!userId || !verificationCodes.has(userId)) {
    return res.redirect('/login?error=1');
  }
  res.sendFile('verify.html', { root: './public' });
});

router.post('/verify', (req, res) => {
  const { code, userId } = req.body;
  const verification = verificationCodes.get(userId);

  if (!verification) {
    return res.redirect('/login?error=4');
  }

  if (Date.now() - verification.timestamp > VERIFICATION_TIMEOUT) {
    verificationCodes.delete(userId);
    return res.redirect('/login?error=4');
  }

  if (code.toUpperCase() !== verification.code) {
    return res.redirect(`/verify?userId=${userId}&error=1`);
  }

  // Crée le token JWT
  const token = jwt.sign({ 
    userId,
    role: verification.role,
    guildId: verification.guildId
  }, config.jwtSecret, { expiresIn: '24h' });

  // Supprime le code de vérification
  verificationCodes.delete(userId);
  
  req.session.token = token;
  res.redirect('/dashboard');
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

export default router;