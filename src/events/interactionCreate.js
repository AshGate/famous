import { ChannelType, PermissionFlagsBits, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import { createTranscript } from 'discord-html-transcripts';
import db from '../database/db.js';
import fs from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TRANSCRIPTS_DIR = join(__dirname, '../../transcripts');

// Assure que le dossier transcripts existe
if (!fs.existsSync(TRANSCRIPTS_DIR)) {
  fs.mkdirSync(TRANSCRIPTS_DIR, { recursive: true });
}

async function saveTranscript(html, ticketNumber, guildId) {
  try {
    // Crée le dossier pour le serveur s'il n'existe pas
    const guildDir = join(TRANSCRIPTS_DIR, guildId);
    if (!fs.existsSync(guildDir)) {
      fs.mkdirSync(guildDir, { recursive: true });
    }

    const fileName = `ticket-${ticketNumber}-${Date.now()}.html`;
    const filePath = join(guildDir, fileName);

    // Vérifie les permissions d'écriture
    try {
      fs.accessSync(dirname(filePath), fs.constants.W_OK);
    } catch (error) {
      console.error(`Erreur de permissions: ${error}`);
      throw new Error('Erreur de permissions pour l\'écriture du fichier');
    }

    // Écrit le fichier
    fs.writeFileSync(filePath, html, 'utf8');

    return {
      success: true,
      fileName,
      url: `/transcripts/${guildId}/${fileName}`
    };
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du transcript:', error);
    throw error;
  }
}

// Map pour stocker les compteurs de tickets par serveur
const ticketCounters = new Map();

function getNextTicketNumber(guildId) {
  const currentCount = ticketCounters.get(guildId) || 0;
  const nextCount = currentCount + 1;
  ticketCounters.set(guildId, nextCount);
  return nextCount;
}

async function getOrCreateLogsChannels(guild) {
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

  return { logsChannel };
}

async function logTicketAction(guild, ticketNumber, userId, action, details = null) {
  const { logsChannel } = await getOrCreateLogsChannels(guild);
  
  const embed = new EmbedBuilder()
    .setColor(action === 'create' ? '#2b2d31' : '#ff0000')
    .setTitle(action === 'create' ? '📩 Nouveau Ticket' : '🔒 Ticket Fermé')
    .addFields(
      { name: 'Utilisateur', value: `<@${userId}>`, inline: true },
      { name: 'Ticket', value: `ticket-${ticketNumber}`, inline: true }
    )
    .setTimestamp();

  if (details) {
    embed.addFields(
      { name: 'Détails', value: details, inline: false }
    );
  }

  await logsChannel.send({ embeds: [embed] });

  // Log dans la base de données
  const stmt = db.prepare(`
    INSERT INTO ticket_logs (
      guild_id, ticket_id, ticket_number, user_id, action, details
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    guild.id,
    `ticket-${ticketNumber}`,
    ticketNumber,
    userId,
    action,
    details || null
  );
}

export async function handleInteraction(interaction) {
  // Gestion du bouton d'acceptation des règles
  if (interaction.isButton() && interaction.customId === 'accept_rules') {
    try {
      const stmt = db.prepare(`
        SELECT role_id FROM rules
        WHERE guild_id = ?
      `);
      
      const result = stmt.get(interaction.guild.id);
      
      if (!result) {
        return interaction.reply({
          content: 'Configuration des règles introuvable.',
          flags: [MessageFlags.Ephemeral]
        });
      }

      const role = interaction.guild.roles.cache.get(result.role_id);
      if (!role) {
        return interaction.reply({
          content: 'Le rôle associé n\'existe plus.',
          flags: [MessageFlags.Ephemeral]
        });
      }

      // Ajoute le rôle à l'utilisateur
      await interaction.member.roles.add(role);

      // Envoie une confirmation
      await interaction.reply({
        content: '✅ Vous avez accepté le règlement et obtenu l\'accès aux salons !',
        flags: [MessageFlags.Ephemeral]
      });

    } catch (error) {
      console.error('Erreur lors de l\'acceptation des règles:', error);
      await interaction.reply({
        content: 'Une erreur est survenue lors de l\'acceptation des règles.',
        flags: [MessageFlags.Ephemeral]
      });
    }
  }

  if (interaction.isButton() && interaction.customId === 'create_ticket') {
    const modal = new ModalBuilder()
      .setCustomId('ticket_modal')
      .setTitle('Création de ticket');

    const nomInput = new TextInputBuilder()
      .setCustomId('nom')
      .setLabel('Nom')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const prenomInput = new TextInputBuilder()
      .setCustomId('prenom')
      .setLabel('Prénom')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const numeroInput = new TextInputBuilder()
      .setCustomId('numero')
      .setLabel('Numéro')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const entrepriseInput = new TextInputBuilder()
      .setCustomId('entreprise')
      .setLabel('Entreprise / Grade')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const demandeInput = new TextInputBuilder()
      .setCustomId('demande')
      .setLabel('Demande')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const firstRow = new ActionRowBuilder().addComponents(nomInput);
    const secondRow = new ActionRowBuilder().addComponents(prenomInput);
    const thirdRow = new ActionRowBuilder().addComponents(numeroInput);
    const fourthRow = new ActionRowBuilder().addComponents(entrepriseInput);
    const fifthRow = new ActionRowBuilder().addComponents(demandeInput);

    modal.addComponents(firstRow, secondRow, thirdRow, fourthRow, fifthRow);
    await interaction.showModal(modal);
  }

  if (interaction.isModalSubmit() && interaction.customId === 'ticket_modal') {
    const nom = interaction.fields.getTextInputValue('nom');
    const prenom = interaction.fields.getTextInputValue('prenom');
    const numero = interaction.fields.getTextInputValue('numero');
    const entreprise = interaction.fields.getTextInputValue('entreprise');
    const demande = interaction.fields.getTextInputValue('demande');

    const guild = interaction.guild;
    const member = interaction.member;
    const ticketNumber = getNextTicketNumber(guild.id);

    let category = guild.channels.cache.find(c => c.name === "Tickets" && c.type === ChannelType.GuildCategory);
    if (!category) {
      category = await guild.channels.create({
        name: 'Tickets',
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          }
        ]
      });
    }

    const channel = await guild.channels.create({
      name: `ticket-${ticketNumber}`,
      type: ChannelType.GuildText,
      parent: category,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: member.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
        }
      ],
    });

    const ticketEmbed = new EmbedBuilder()
      .setTitle(`📋 Ticket #${ticketNumber}`)
      .addFields(
        { name: '👤 Identité', value: `${nom} ${prenom}`, inline: true },
        { name: '📱 Numéro', value: numero, inline: true },
        { name: '🏢 Entreprise/Grade', value: entreprise, inline: true },
        { name: '📝 Demande', value: demande }
      )
      .setColor('#2b2d31')
      .setTimestamp();

    const closeButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('close_ticket')
          .setLabel('Fermer le ticket')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🔒')
      );

    await channel.send({ embeds: [ticketEmbed], components: [closeButton] });
    await interaction.reply({
      content: `Votre ticket a été créé : ${channel}`,
      flags: [MessageFlags.Ephemeral]
    });

    // Log l'action
    const details = `Nom: ${nom} ${prenom}\nNuméro: ${numero}\nEntreprise: ${entreprise}`;
    await logTicketAction(guild, ticketNumber, member.id, 'create', details);
  }

  if (interaction.isButton() && interaction.customId === 'close_ticket') {
    const ticketNumber = parseInt(interaction.channel.name.split('-')[1]);
    
    try {
      const transcript = await createTranscript(interaction.channel, {
        limit: -1,
        returnType: 'string',
        fileName: `ticket-${ticketNumber}.html`,
        saveImages: true,
        poweredBy: false
      });

      const result = await saveTranscript(transcript, ticketNumber, interaction.guild.id);
      
      if (result.success) {
        // Message simple dans le canal du ticket
        const embed = new EmbedBuilder()
          .setTitle('🔒 Ticket fermé')
          .setDescription('Le ticket va être fermé dans quelques secondes.')
          .setColor('#ff0000')
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        
        // Log l'action avec le transcript dans les logs
        await logTicketAction(
          interaction.guild,
          ticketNumber,
          interaction.user.id,
          'close',
          `Transcript: ${result.url}`
        );

        setTimeout(() => interaction.channel.delete(), 5000);
      } else {
        throw new Error('Échec de la sauvegarde du transcript');
      }
    } catch (error) {
      console.error('Erreur lors de la fermeture du ticket:', error);
      await interaction.reply({
        content: 'Une erreur est survenue lors de la fermeture du ticket.',
        flags: [MessageFlags.Ephemeral]
      });
    }
  }
}