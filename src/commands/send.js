import { EmbedBuilder } from 'discord.js';

export async function handleSendCommand(message) {
  const args = message.content.split(' ');
  
  // Supprime la commande !send du tableau
  args.shift();
  
  // Récupère le salon mentionné
  const channel = message.mentions.channels.first();
  if (!channel) {
    return message.reply('Veuillez mentionner un salon valide !');
  }
  
  // Supprime la mention du salon du tableau
  args.splice(args.findIndex(arg => arg.startsWith('<#')), 1);
  
  // Récupère le message à envoyer
  const messageToSend = args.join(' ');
  
  if (!messageToSend) {
    return message.reply('Format incorrect. Utilisez : !send votre_message #salon');
  }

  try {
    await channel.send(messageToSend);
    await message.reply(`Message envoyé avec succès dans ${channel} !`);
  } catch (error) {
    await message.reply('Une erreur est survenue lors de l\'envoi du message.');
  }
}