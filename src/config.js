import 'dotenv/config';

export const config = {
  token: process.env.DISCORD_TOKEN || '',
  prefix: '!',
  jwtSecret: 'secret_key_panel_admin'
};

if (!config.token) {
  throw new Error('Le token Discord est manquant dans le fichier .env');
}