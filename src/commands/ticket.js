import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ChannelType, PermissionFlagsBits } from 'discord.js';
import db from '../database/db.js';

async function getOrCreateLogsChannel(guild) {
  let logsCategory = guild.channels.cache.find(c => c.name === "Logs" && c.type === ChannelType.GuildCategory);
  
  if (!logsCategory) {
    logsCategory = await guild.channels.create({
      name: 'Logs',
      type: ChannelType.GuildCategory,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        }
      ]
    });
  }

  let logsChannel = guild.channels.cache.find(c => 
    c.name === "logs-tickets" && 
    c.type === ChannelType.GuildText &&
    c.parentId === logsCategory.id
  );

  if (!logsChannel) {
    logsChannel = await guild.channels.create({
      name: 'logs-tickets',
      type: ChannelType.GuildText,
      parent: logsCategory,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        }
      ]
    });
  }

  return logsChannel;
}

export async function handleTicketCommand(message) {
  const channel = message.mentions.channels.first();
  if (!channel) {
    return message.reply('Format incorrect. Utilisez : !ticket #salon');
  }

  try {
    // Récupère les paramètres personnalisés ou utilise les valeurs par défaut
    const settings = await db.prepare(`
      SELECT * FROM ticket_settings 
      WHERE guild_id = ?
    `).get(message.guild.id);

    const defaultSettings = {
      title: 'Contactez notre entreprise',
      description: 'Afin de prendre contact avec notre secrétariat, utilisez l\'onglet ci-dessous 📩',
      button_text: 'Créer un ticket',
      button_color: 'Primary',
      button_emoji: '📩'
    };

    const finalSettings = settings || defaultSettings;

    // Map des styles de boutons valides
    const buttonStyles = {
      'Primary': ButtonStyle.Primary,
      'Secondary': ButtonStyle.Secondary,
      'Success': ButtonStyle.Success,
      'Danger': ButtonStyle.Danger
    };
    
    const embed = new EmbedBuilder()
      .setTitle(finalSettings.title)
      .setDescription(finalSettings.description)
      .setColor('#2b2d31');

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('create_ticket')
          .setLabel(finalSettings.button_text)
          .setStyle(buttonStyles[finalSettings.button_color] || ButtonStyle.Primary)
          .setEmoji(finalSettings.button_emoji)
      );

    const ticketMessage = await channel.send({
      embeds: [embed],
      components: [row]
    });

    // Crée ou récupère le salon de logs
    const logsChannel = await getOrCreateLogsChannel(message.guild);

    // Log de création du message de ticket
    const logEmbed = new EmbedBuilder()
      .setTitle('📋 Configuration système de tickets')
      .setDescription('Un nouveau point d\'entrée pour les tickets a été créé')
      .addFields(
        { name: 'Créé par', value: `<@${message.author.id}>`, inline: true },
        { name: 'Salon', value: `<#${channel.id}>`, inline: true },
        { name: 'Message ID', value: ticketMessage.id, inline: true }
      )
      .setColor('#2b2d31')
      .setTimestamp();

    await logsChannel.send({ embeds: [logEmbed] });

    // Log dans la base de données
    const logStmt = db.prepare(`
      INSERT INTO ticket_logs (guild_id, ticket_id, ticket_number, user_id, action, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    await logStmt.run(
      message.guild.id,
      channel.id,
      0,
      message.author.id,
      'setup',
      `Canal: ${channel.name} (${channel.id})`
    );

    await message.reply(`✅ Le système de tickets a été configuré dans ${channel}`);
  } catch (error) {
    console.error('Erreur lors de la configuration des tickets:', error);
    await message.reply('Une erreur est survenue lors de la configuration des tickets.');
  }
}