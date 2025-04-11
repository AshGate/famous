import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import session from 'express-session';
import { config } from './config.js';
import { Client, GatewayIntentBits } from 'discord.js';
import authRoutes from './auth/routes.js';
import panelRoutes from './panel/routes/index.js';
import { initDiscordClient } from './utils/discord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

initDiscordClient(client);
client.login(config.token);

app.use(session({
  secret: config.jwtSecret,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration des dossiers statiques
const publicDir = join(__dirname, '../public');
const transcriptsDir = join(__dirname, '../transcripts');

[publicDir, transcriptsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

app.use(express.static(publicDir));
app.use('/transcripts', express.static(transcriptsDir));

// Routes
app.use('/', authRoutes);
app.use('/', panelRoutes);

app.get('/dashboard', (req, res) => {
  res.sendFile(join(publicDir, 'dashboard.html'));
});

app.listen(3001, '0.0.0.0', () => {
  console.log('Serveur démarré sur http://217.65.144.70:3001');
});

export default app;