import { isWhitelisted } from './whitelist.js';

export async function handleSayCommand(message) {
  // Vérifie si l'utilisateur est whitelisté
  if (!isWhitelisted(message.guild.id, message.author.id)) {
    return message.reply('Vous n\'avez pas la permission d\'utiliser cette commande.');
  }

  // Supprime la commande !say du message
  const args = message.content.split(' ');
  args.shift();
  
  // Vérifie si un message est fourni
  if (args.length === 0) {
    return message.reply('Format incorrect. Utilisez : !say <message>');
  }

  const messageToSay = args.join(' ');

  try {
    // Supprime le message de commande
    await message.delete();
    
    // Envoie le message
    await message.channel.send(messageToSay);
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    await message.reply('Une erreur est survenue lors de l\'envoi du message.');
  }
}