import { handleCommand } from './commandHandler.js';
import { handleInteraction } from '../events/interactionCreate.js';
import { handleMessageDelete, handleMessageUpdate, handleMessage } from '../events/messageEvents.js';
import { registerSlashCommands, handleSlashCommand } from './slashCommandHandler.js';
import { config } from '../config.js';

export function setupEventHandlers(client) {
  client.once('ready', async () => {
    console.log(`Bot connecté en tant que ${client.user.tag}`);
    await registerSlashCommands(client);
  });

  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    
    if (message.content.startsWith(config.prefix)) {
      await handleCommand(message);
    } else {
      await handleMessage(message);
    }
  });
  
  client.on('interactionCreate', async (interaction) => {
    if (interaction.isCommand()) {
      await handleSlashCommand(interaction);
    } else {
      await handleInteraction(interaction);
    }
  });

  client.on('messageDelete', handleMessageDelete);
  client.on('messageUpdate', handleMessageUpdate);
}