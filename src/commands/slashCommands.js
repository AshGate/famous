import { SlashCommandBuilder } from 'discord.js';

export const commands = [
  new SlashCommandBuilder()
    .setName('ajouter')
    .setDescription('Ajoute un membre au ticket actuel')
    .addUserOption(option =>
      option
        .setName('membre')
        .setDescription('Le membre à ajouter au ticket')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(null) // Permet à tous les membres d'utiliser la commande
    .setDMPermission(false) // Désactive la commande en MP
    .toJSON()
];