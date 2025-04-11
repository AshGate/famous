import { REST, Routes, EmbedBuilder, MessageFlags } from 'discord.js';
import { config } from '../config.js';
import { commands } from '../commands/slashCommands.js';

export async function registerSlashCommands(client) {
  try {
    const rest = new REST({ version: '10' }).setToken(config.token);
    
    console.log('Début du rafraîchissement des commandes slash...');
    
    // Enregistre les commandes globalement pour tous les serveurs
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    
    // Enregistre aussi les commandes pour chaque serveur individuellement
    for (const guild of client.guilds.cache.values()) {
      await rest.put(
        Routes.applicationGuildCommands(client.user.id, guild.id),
        { body: commands }
      );
    }
    
    console.log('Commandes slash enregistrées avec succès!');
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des commandes slash:', error);
  }
}

export async function handleSlashCommand(interaction) {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === 'ajouter') {
    // Vérifie si la commande est utilisée dans un ticket
    if (!interaction.channel.name.startsWith('ticket-')) {
      return await interaction.reply({
        content: 'Cette commande ne peut être utilisée que dans un ticket!',
        flags: [MessageFlags.Ephemeral]
      });
    }

    const member = interaction.options.getMember('membre');
    if (!member) {
      return await interaction.reply({
        content: 'Membre non trouvé!',
        flags: [MessageFlags.Ephemeral]
      });
    }

    try {
      // Ajoute les permissions pour le nouveau membre
      await interaction.channel.permissionOverwrites.edit(member, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true
      });

      const embed = new EmbedBuilder()
        .setTitle('✅ Membre ajouté')
        .setDescription(`${member} a été ajouté au ticket.`)
        .setColor('#2b2d31')
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Erreur lors de l\'ajout du membre:', error);
      await interaction.reply({
        content: 'Une erreur est survenue lors de l\'ajout du membre.',
        flags: [MessageFlags.Ephemeral]
      });
    }
  }
}