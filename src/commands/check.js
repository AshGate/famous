import { EmbedBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import db from '../database/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REQUIRED_FILES = [
  'index.js',
  'package.json',
  'src/config.js',
  'src/server.js',
  '.env'
];

const REQUIRED_DIRECTORIES = [
  'src/commands',
  'src/events',
  'src/handlers',
  'src/database',
  'src/utils',
  'data',
  'transcripts'
];

export async function handleCheckCommand(message) {
  try {
    const embed = new EmbedBuilder()
      .setTitle('🔍 Vérification du système')
      .setColor('#2b2d31')
      .setTimestamp();

    // Vérification des fichiers requis
    const fileChecks = [];
    for (const file of REQUIRED_FILES) {
      const exists = fs.existsSync(path.join(process.cwd(), file));
      fileChecks.push(`${exists ? '✅' : '❌'} ${file}`);
    }

    // Vérification des dossiers requis
    const dirChecks = [];
    for (const dir of REQUIRED_DIRECTORIES) {
      const exists = fs.existsSync(path.join(process.cwd(), dir));
      dirChecks.push(`${exists ? '✅' : '❌'} ${dir}`);
    }

    // Vérification de la base de données
    let dbStatus = '✅ Connectée';
    try {
      await db.prepare('SELECT 1').get();
    } catch (error) {
      dbStatus = '❌ Erreur de connexion';
    }

    // Vérification des permissions du bot
    const botMember = message.guild.members.me;
    const requiredPermissions = [
      'ViewChannel',
      'SendMessages',
      'ManageMessages',
      'ManageChannels',
      'CreatePublicThreads',
      'EmbedLinks',
      'AttachFiles'
    ];

    const permissionChecks = requiredPermissions.map(perm => {
      const has = botMember.permissions.has(perm);
      return `${has ? '✅' : '❌'} ${perm}`;
    });

    // Vérification de la configuration
    const configChecks = [];
    try {
      const { config } = await import('../config.js');
      configChecks.push(`✅ Token Discord configuré`);
      configChecks.push(`✅ Préfixe configuré: ${config.prefix}`);
    } catch (error) {
      configChecks.push('❌ Erreur de configuration');
    }

    embed.addFields(
      { 
        name: '📁 Fichiers Requis', 
        value: fileChecks.join('\n'),
        inline: false 
      },
      { 
        name: '📂 Dossiers Requis', 
        value: dirChecks.join('\n'),
        inline: false 
      },
      { 
        name: '🗄️ Base de données', 
        value: dbStatus,
        inline: false 
      },
      { 
        name: '⚙️ Configuration', 
        value: configChecks.join('\n'),
        inline: false 
      },
      { 
        name: '🔑 Permissions', 
        value: permissionChecks.join('\n'),
        inline: false 
      }
    );

    await message.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
    await message.reply('Une erreur est survenue lors de la vérification du système.');
  }
}