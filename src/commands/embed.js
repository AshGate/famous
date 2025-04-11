import { EmbedBuilder } from 'discord.js';

export async function handleEmbedCommand(message) {
  const args = message.content.split(' ');
  
  // Supprime la commande !embed du tableau
  args.shift();
  
  // Récupère le salon mentionné
  const channel = message.mentions.channels.first();
  if (!channel) {
    return message.reply('Veuillez mentionner un salon valide !');
  }
  
  // Supprime la mention du salon du tableau
  args.splice(args.findIndex(arg => arg.startsWith('<#')), 1);
  
  // Trouve l'index du lien, du crédit et de la couleur
  const linkIndex = args.findIndex(arg => arg.startsWith('lien:'));
  const creditIndex = args.findIndex(arg => arg.startsWith(':crédit'));
  const colorIndex = args.findIndex(arg => arg.startsWith('couleur:'));
  
  // Récupère le lien de l'image si présent
  let imageUrl = null;
  if (linkIndex !== -1) {
    imageUrl = args[linkIndex].replace('lien:', '').trim();
    args.splice(linkIndex, 1);
  }
  
  // Récupère le crédit si présent
  let credit = null;
  if (creditIndex !== -1) {
    credit = args.slice(creditIndex + 1).join(' ');
    args.splice(creditIndex);
  }

  // Récupère la couleur si présente
  let color = '#2b2d31';
  if (colorIndex !== -1) {
    color = args[colorIndex].replace('couleur:', '').trim();
    args.splice(colorIndex, 1);
  }
  
  // Récupère le titre et la description
  const title = args.shift();
  const description = args.join(' ');
  
  if (!title || !description) {
    return message.reply('Format incorrect. Utilisez : !embed "titre" "description" #salon lien: URL :crédit votre_crédit couleur: #hexcode');
  }

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp();

  if (imageUrl) {
    embed.setImage(imageUrl);
  }
  
  if (credit) {
    embed.setFooter({ text: credit });
  }

  await channel.send({ embeds: [embed] });
  await message.reply('L\'embed a été créé avec succès !');
}