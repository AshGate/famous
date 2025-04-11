import { Client } from 'discord.js';

let client = null;

export function initDiscordClient(discordClient) {
  client = discordClient;
}

export function getDiscordClient() {
  if (!client) {
    throw new Error('Client Discord non initialisé');
  }
  return client;
}