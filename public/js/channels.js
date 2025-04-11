// Fonction pour charger les salons avec les catégories
async function loadChannels(selectId) {
  try {
    const response = await fetch('/api/channels');
    const channels = await response.json();
    
    const select = document.getElementById(selectId);
    if (!select) {
      console.error(`Élément avec l'ID ${selectId} non trouvé`);
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
  }
}

// Fonction pour charger les rôles
async function loadRoles(selectId) {
  try {
    const response = await fetch('/api/roles');
    const roles = await response.json();
    
    const select = document.getElementById(selectId);
    if (!select) {
      console.error(`Élément avec l'ID ${selectId} non trouvé`);
      return;
    }

    select.innerHTML = '<option value="">Sélectionnez un rôle</option>' + 
      roles.map(role => 
        `<option value="${role.id}" style="color: ${role.color}">@${role.name}</option>`
      ).join('');
  } catch (error) {
    console.error('Erreur lors du chargement des rôles:', error);
  }
}