import { PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { isWhitelisted } from './whitelist.js';

export async function handleRenewCommand(message) {
  try {
    // Vérifie si l'utilisateur est whitelisté
    if (!isWhitelisted(message.guild.id, message.author.id)) {
      return message.reply('Vous n\'avez pas la permission d\'utiliser cette commande.');
    }

    // Vérifie les permissions du bot
    if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return message.reply('Je n\'ai pas la permission de gérer les salons.');
    }

    // Récupère le salon mentionné ou utilise le salon actuel
    const channel = message.mentions.channels.first() || message.channel;
    
    // Vérifie que c'est un salon textuel
    if (!channel || channel.type !== 0) { // 0 = GUILD_TEXT
      return message.reply('Cette commande ne fonctionne qu\'avec les salons textuels.');
    }

    // Sauvegarde les informations du salon
    const channelInfo = {
      name: channel.name,
      topic: channel.topic,
      nsfw: channel.nsfw,
      parent: channel.parent,
      permissionOverwrites: channel.permissionOverwrites.cache,
      position: channel.position,
      rateLimitPerUser: channel.rateLimitPerUser
    };

    // Crée un embed pour informer de la suppression
    const deleteEmbed = new EmbedBuilder()
      .setTitle('🔄 Renouvellement du salon')
      .setDescription('Le salon va être supprimé et recréé dans quelques secondes...')
      .setColor('#2b2d31')
      .setTimestamp();

    const notificationChannel = channel.id === message.channel.id ? 
      await message.guild.channels.cache.find(c => c.type === 0 && c.id !== channel.id) : 
      message.channel;

    if (notificationChannel) {
      await notificationChannel.send({ embeds: [deleteEmbed] });
    }

    // Supprime le salon
    await channel.delete();

    // Recrée le salon avec les mêmes paramètres
    const newChannel = await message.guild.channels.create({
      name: channelInfo.name,
      type: 0,
      topic: channelInfo.topic,
      nsfw: channelInfo.nsfw,
      parent: channelInfo.parent,
      permissionOverwrites: Array.from(channelInfo.permissionOverwrites.values()),
      position: channelInfo.position,
      rateLimitPerUser: channelInfo.rateLimitPerUser
    });

    // Crée un embed pour confirmer la recréation
    const successEmbed = new EmbedBuilder()
      .setTitle('✅ Salon renouvelé')
      .setDescription(`Le salon a été recréé avec succès : ${newChannel}`)
      .setColor('#2b2d31')
      .setTimestamp();

    if (notificationChannel && notificationChannel.id !== channel.id) {
      await notificationChannel.send({ embeds: [successEmbed] });
    } else {
      await newChannel.send({ embeds: [successEmbed] });
    }

  } catch (error) {
    console.error('Erreur lors du renouvellement du salon:', error);
    
    // Trouve un salon valide pour envoyer le message d'erreur
    const errorChannel = message.channel.id ? message.channel :
      await message.guild.channels.cache.find(c => c.type === 0);

    if (errorChannel) {
      await errorChannel.send('Une erreur est survenue lors du renouvellement du salon.');
    }
  }
}