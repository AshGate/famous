// Charge les salons au chargement de la page
async function loadTicketChannels() {
  try {
    const response = await fetch('/api/tickets/channels');
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des salons');
    }
    
    const channels = await response.json();
    const select = document.getElementById('ticketChannel');
    
    if (!select) {
      console.error('Élément ticketChannel non trouvé');
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

// Charge la configuration actuelle des tickets
async function loadTicketConfig() {
  try {
    const response = await fetch('/api/tickets/config');
    if (!response.ok) {
      throw new Error('Erreur lors du chargement de la configuration');
    }
    
    const config = await response.json();
    
    if (config.channel_id) {
      document.getElementById('ticketChannel').value = config.channel_id;
    }
    if (config.title) {
      document.getElementById('ticketTitle').value = config.title;
    }
    if (config.description) {
      document.getElementById('ticketDescription').value = config.description;
    }
  } catch (error) {
    console.error('Erreur lors du chargement de la configuration:', error);
    showMessage('Erreur lors du chargement de la configuration', 'error');
  }
}

// Met à jour la configuration des tickets
async function updateTicketConfig(event) {
  event.preventDefault();
  
  const channelId = document.getElementById('ticketChannel').value;
  const title = document.getElementById('ticketTitle').value;
  const description = document.getElementById('ticketDescription').value;

  if (!channelId) {
    showMessage('Veuillez sélectionner un salon', 'error');
    return;
  }

  if (!title || !description) {
    showMessage('Veuillez remplir tous les champs', 'error');
    return;
  }

  try {
    const response = await fetch('/api/tickets/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channelId,
        title,
        description
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || 'Erreur lors de la mise à jour');
    }

    showMessage('Configuration mise à jour avec succès!', 'success');
  } catch (error) {
    console.error('Erreur:', error);
    showMessage(error.message, 'error');
  }
}

function showMessage(message, type) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message-${type}`;
  messageDiv.textContent = message;
  document.getElementById('ticketForm').appendChild(messageDiv);
  setTimeout(() => messageDiv.remove(), 3000);
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
  loadTicketChannels();
  loadTicketConfig();
  
  const form = document.getElementById('ticketForm');
  if (form) {
    form.addEventListener('submit', updateTicketConfig);
  }
});