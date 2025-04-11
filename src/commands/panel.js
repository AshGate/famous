import { EmbedBuilder } from 'discord.js';
import { isWhitelisted } from './whitelist.js';

export async function handlePanelCommand(message) {
  const isAdmin = message.author.id === '619551502272561152';
  const isUserWhitelisted = await isWhitelisted(message.guild.id, message.author.id);

  if (!isAdmin && !isUserWhitelisted) {
    return message.reply('Vous n\'avez pas la permission d\'utiliser cette commande.');
  }

  const embed = new EmbedBuilder()
    .setTitle('🔧 Panneau de Configuration')
    .setDescription('Accédez au panneau de configuration du bot via le lien ci-dessous.')
    .addFields(
      { 
        name: 'URL du Panel', 
        value: `http://217.65.144.70:3001/login?guild=${message.guild.id}\nUtilisez votre ID Discord: ${message.author.id}` 
      },
      {
        name: '⚠️ Important',
        value: 'Ne partagez jamais ce lien avec d\'autres personnes!'
      }
    )
    .setColor('#2b2d31')
    .setTimestamp();

  try {
    await message.author.send({ embeds: [embed] });
    await message.reply('Je vous ai envoyé les informations de connexion en message privé.');
  } catch (error) {
    await message.reply('Je n\'ai pas pu vous envoyer de message privé. Vérifiez que vous acceptez les messages privés de ce serveur.');
  }
}