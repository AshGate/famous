import { EmbedBuilder } from 'discord.js';
import { isWhitelisted } from './whitelist.js';

const commandCategories = {
  '🎫 Tickets': [
    { 
      name: '!ticket #salon', 
      description: 'Crée un message pour générer des tickets de support' 
    }
  ],
  '📝 Messages': [
    { 
      name: '!embed "titre" "description" #salon lien: URL :crédit texte couleur: #hexcode', 
      description: 'Crée un embed personnalisé avec titre, description, image, crédit et couleur' 
    },
    { 
      name: '!send message #salon', 
      description: 'Envoie un message dans le salon spécifié' 
    },
    { 
      name: '!say message', 
      description: 'Fait dire au bot le message voulu' 
    },
    { 
      name: '!clear', 
      description: 'Supprime les 10 derniers messages du salon' 
    }
  ],
  '📞 Annuaire': [
    {
      name: '!ajoutannuaire nom prénom numéro',
      description: 'Ajoute un contact dans l\'annuaire du serveur'
    },
    {
      name: '!recherche nom_ou_numero',
      description: 'Recherche un contact dans l\'annuaire par nom ou numéro'
    }
  ],
  '📅 Rendez-vous': [
    {
      name: '!rdv #salon JJ/MM/YYYY HH:mm lieu description',
      description: 'Crée un rendez-vous avec date, heure et lieu'
    }
  ],
  '⚙️ Gestion': [
    {
      name: '!renew [#salon]',
      description: 'Supprime et recrée un salon textuel (salon actuel si non spécifié)'
    },
    {
      name: '!theme couleur',
      description: 'Change la couleur des embeds (rouge, vert, bleu, jaune, cyan, rose, violet, orange)'
    },
    {
      name: '!recrutement ouvrir/fermer @role #salon',
      description: 'Ouvre ou ferme les candidatures dans un salon spécifique'
    }
  ],
  '🔍 Utilitaires': [
    { 
      name: '!pic ID_DISCORD', 
      description: 'Affiche l\'avatar d\'un utilisateur en grand format' 
    },
    {
      name: '!check',
      description: 'Vérifie l\'état du système et les permissions'
    }
  ],
  '📜 Règlement': [
    {
      name: '!rules #salon @role votre_règlement',
      description: 'Configure un système de règlement avec acceptation et attribution de rôle'
    }
  ],
  '💼 Factures': [
    {
      name: '!facture create',
      description: 'Crée une nouvelle facture interactive'
    },
    {
      name: '!facture export <id>',
      description: 'Exporte une facture au format image'
    }
  ],
  '🔧 Administration': [
    {
      name: '!panel',
      description: 'Accède au panneau de configuration web du bot'
    }
  ]
};

const adminCommands = {
  '👑 Administration': [
    {
      name: '!addwl @utilisateur',
      description: 'Ajoute un utilisateur à la whitelist de façon permanente'
    },
    {
      name: '!addwlday @utilisateur jours',
      description: 'Ajoute un utilisateur à la whitelist pour X jours'
    },
    {
      name: '!addwltime @utilisateur heures',
      description: 'Ajoute un utilisateur à la whitelist pour X heures'
    },
    {
      name: '!delwl @utilisateur',
      description: 'Retire un utilisateur de la whitelist'
    },
    {
      name: '!wliste',
      description: 'Affiche la liste des utilisateurs whitelistés'
    },
    {
      name: '!messagelog on #salon',
      description: 'Active les logs des messages dans un salon'
    },
    {
      name: '!messagelog off',
      description: 'Désactive les logs de messages'
    }
  ]
};

export async function handleHelpCommand(message) {
  const isAdmin = message.author.id === '619551502272561152';
  const categories = isAdmin ? { ...commandCategories, ...adminCommands } : commandCategories;

  const embed = new EmbedBuilder()
    .setAuthor({ 
      name: 'Système d\'aide',
      iconURL: message.client.user.displayAvatarURL()
    })
    .setTitle('📚 Liste des Commandes')
    .setDescription('Voici la liste complète des commandes disponibles sur le serveur.\nUtilisez le préfixe `!` pour exécuter une commande.')
    .setColor('#2b2d31')
    .setThumbnail(message.guild.iconURL({ dynamic: true, size: 512 }))
    .setFooter({ 
      text: 'Développé avec ❤️ par H-Gate',
      iconURL: message.client.user.displayAvatarURL()
    })
    .setTimestamp();

  // Ajoute chaque catégorie comme un field séparé
  for (const [category, commands] of Object.entries(categories)) {
    embed.addFields({
      name: `${category} ${'-'.repeat(40 - category.length)}`,
      value: commands.map(cmd => `> **${cmd.name}**\n> *${cmd.description}*`).join('\n\n'),
      inline: false
    });
  }

  await message.channel.send({ embeds: [embed] });
}