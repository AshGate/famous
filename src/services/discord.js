import { getDiscordClient } from '../utils/discord.js';

export async function getGuildChannels(guildId) {
  try {
    const client = getDiscordClient();
    const guild = await client.guilds.fetch(guildId);
    
    return guild.channels.cache
      .filter(channel => channel.type === 0) // Uniquement les salons textuels
      .map(channel => ({
        id: channel.id,
        name: channel.name,
        parent: channel.parent?.name || 'Sans catégorie',
        position: channel.position
      }))
      .sort((a, b) => {
        // Trie d'abord par catégorie puis par position
        if (a.parent !== b.parent) {
          return a.parent.localeCompare(b.parent);
        }
        return a.position - b.position;
      });
  } catch (error) {
    console.error('Erreur lors de la récupération des salons:', error);
    throw error;
  }
}

export async function getGuildRoles(guildId) {
  try {
    const client = getDiscordClient();
    const guild = await client.guilds.fetch(guildId);
    
    return guild.roles.cache
      .filter(role => role.id !== guild.id) // Exclut le rôle @everyone
      .map(role => ({
        id: role.id,
        name: role.name,
        color: role.hexColor,
        position: role.position
      }))
      .sort((a, b) => b.position - a.position); // Trie par position (plus haute position en premier)
  } catch (error) {
    console.error('Erreur lors de la récupération des rôles:', error);
    throw error;
  }
}