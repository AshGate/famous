import { PermissionFlagsBits } from 'discord.js';

export async function handleClearCommand(message) {
  // Vérifie si le bot a la permission de gérer les messages
  if (!message.channel.permissionsFor(message.client.user).has(PermissionFlagsBits.ManageMessages)) {
    return message.reply('Je n\'ai pas la permission de supprimer les messages dans ce salon.');
  }

  try {
    // Supprime le message de commande
    await message.delete();
    
    // Récupère et supprime les 10 derniers messages
    const messages = await message.channel.messages.fetch({ limit: 10 });
    await message.channel.bulkDelete(messages, true);
    
    // Envoie une confirmation qui s'auto-détruit après 3 secondes
    const confirmMessage = await message.channel.send('✅ 10 messages ont été supprimés.');
    setTimeout(() => confirmMessage.delete(), 3000);
  } catch (error) {
    console.error('Erreur lors de la suppression des messages:', error);
    const errorMessage = await message.channel.send('Une erreur est survenue lors de la suppression des messages.');
    setTimeout(() => errorMessage.delete(), 3000);
  }
}