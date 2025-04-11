import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { isWhitelisted } from '../commands/whitelist.js';

export const authenticate = (req, res, next) => {
  const token = req.session.token;
  if (!token) {
    return res.redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    res.redirect('/login');
  }
};

export const checkAuth = async (userId, guildId) => {
  const isAdmin = userId === '619551502272561152';
  const userWhitelisted = isWhitelisted(guildId, userId);

  return {
    isAuthorized: isAdmin || userWhitelisted,
    role: isAdmin ? 'admin' : 'user'
  };
};