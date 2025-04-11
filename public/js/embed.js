// Initialisation des variables
let selectedColor = '#2b2d31';
const colors = {
  'Rouge': '#ff0000',
  'Vert': '#00ff00',
  'Bleu': '#0000ff',
  'Jaune': '#ffff00',
  'Cyan': '#00ffff',
  'Rose': '#ff69b4',
  'Violet': '#8a2be2',
  'Orange': '#ffa500'
};

// Charge les salons
async function loadEmbedChannels() {
  try {
    const response = await fetch('/api/embeds/channels');
    const channels = await response.json();
    
    const select = document.getElementById('embedChannel');
    if (!select) {
      console.error('Élément embedChannel non trouvé');
      return;
    }

    // Groupe les salons par catégorie
    const categorizedChannels = channels.reduce((acc, channel) => {
      const category = channel.parent || 'Sans catégorie';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(channel);
      return acc;
    }, {});

    // Construit le HTML
    let html = '<option value="">Sélectionnez un salon</option>';
    
    // Ajoute les salons groupés par catégorie
    Object.entries(categorizedChannels).forEach(([category, channels]) => {
      html += `<optgroup label="${category}">`;
      channels.forEach(channel => {
        html += `<option value="${channel.id}">#${channel.name}</option>`;
      });
      html += '</optgroup>';
    });
    
    select.innerHTML = html;
  } catch (error) {
    console.error('Erreur lors du chargement des salons:', error);
    showMessage('Erreur lors du chargement des salons', 'error');
  }
}

// Met à jour la prévisualisation de l'embed
function updateEmbedPreview() {
  const title = document.getElementById('embedTitle').value;
  const description = document.getElementById('embedDescription').value;
  const image = document.getElementById('embedImage').value;
  const footer = document.getElementById('embedFooter').value;

  const preview = document.getElementById('embedPreview');
  preview.innerHTML = `
    <div style="border-left: 4px solid ${selectedColor}; padding-left: 1rem;">
      <h3 style="color: ${selectedColor};">${title || 'Titre de l\'embed'}</h3>
      <p>${description || 'Description de l\'embed'}</p>
      ${image ? `<img src="${image}" style="max-width: 100%; margin-top: 1rem;">` : ''}
      ${footer ? `<p style="color: #72767d; margin-top: 1rem; font-size: 0.9em;">${footer}</p>` : ''}
      <p style="color: #72767d; margin-top: 0.5rem; font-size: 0.8em;">${new Date().toLocaleString()}</p>
    </div>
  `;
}

// Envoie l'embed
async function sendEmbed(event) {
  event.preventDefault();
  
  const channelId = document.getElementById('embedChannel').value;
  if (!channelId) {
    showMessage('Veuillez sélectionner un salon', 'error');
    return;
  }

  const data = {
    title: document.getElementById('embedTitle').value,
    description: document.getElementById('embedDescription').value,
    channelId: channelId,
    color: selectedColor,
    image: document.getElementById('embedImage').value,
    footer: document.getElementById('embedFooter').value
  };

  try {
    const response = await fetch('/api/embeds/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      showMessage('Embed envoyé avec succès!', 'success');
      document.getElementById('embedForm').reset();
      updateEmbedPreview();
    } else {
      throw new Error('Erreur lors de l\'envoi');
    }
  } catch (error) {
    showMessage(error.message, 'error');
  }
}

function showMessage(message, type) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message-${type}`;
  messageDiv.textContent = message;
  document.getElementById('embedForm').appendChild(messageDiv);
  setTimeout(() => messageDiv.remove(), 3000);
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
  // Charge les salons
  loadEmbedChannels();
  
  // Initialise le sélecteur de couleurs
  const picker = document.getElementById('colorPicker');
  Object.entries(colors).forEach(([name, color]) => {
    const option = document.createElement('div');
    option.style.width = '30px';
    option.style.height = '30px';
    option.style.backgroundColor = color;
    option.style.cursor = 'pointer';
    option.style.borderRadius = '4px';
    option.style.margin = '2px';
    option.title = name;
    option.onclick = () => {
      selectedColor = color;
      document.querySelectorAll('#colorPicker div').forEach(div => {
        div.style.border = 'none';
      });
      option.style.border = '2px solid white';
      updateEmbedPreview();
    };
    picker.appendChild(option);
  });

  // Gestionnaires d'événements
  document.getElementById('embedForm').addEventListener('submit', sendEmbed);
  ['embedTitle', 'embedDescription', 'embedImage', 'embedFooter'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateEmbedPreview);
  });

  // Initialise la prévisualisation
  updateEmbedPreview();
});