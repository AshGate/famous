import { EmbedBuilder } from 'discord.js';

export async function handleAvatarCommand(message) {
  const args = message.content.split(' ');
  
  // Supprime la commande !pic du tableau
  args.shift();
  
  const userId = args[0];
  if (!userId) {
    return message.reply('Veuillez fournir un ID Discord valide !');
  }

  try {
    const user = await message.client.users.fetch(userId);
    const avatarUrl = user.displayAvatarURL({ size: 4096, dynamic: true });

    const embed = new EmbedBuilder()
      .setTitle(`Avatar de ${user.username}`)
      .setImage(avatarUrl)
      .setColor('#2b2d31')
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });
  } catch (error) {
    await message.reply('Impossible de trouver cet utilisateur. Vérifiez que l\'ID est correct.');
  }
}