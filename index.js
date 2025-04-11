import { Client, GatewayIntentBits } from 'discord.js';
import { config } from './src/config.js';
import { setupEventHandlers } from './src/handlers/eventHandler.js';
import './src/server.js';
import './src/utils/transcriptCleaner.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildPresences
  ]
});

setupEventHandlers(client);
client.login(config.token);