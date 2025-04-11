// Charge les salons et les rôles au chargement de la page
async function loadChannelsAndRoles() {
  try {
    // Charge les salons
    const channelsResponse = await fetch('/api/recruitment/channels');
    const channels = await channelsResponse.json();
    
    const channelSelect = document.getElementById('recruitmentChannel');
    channelSelect.innerHTML = '<option value="">Sélectionnez un salon</option>' + 
      channels.map(channel => 
        `<option value="${channel.id}">#${channel.name}</option>`
      ).join('');

    // Charge les rôles
    const rolesResponse = await fetch('/api/recruitment/roles');
    const roles = await rolesResponse.json();
    
    const roleSelect = document.getElementById('recruitmentRole');
    roleSelect.innerHTML = '<option value="">Sélectionnez un rôle</option>' + 
      roles.map(role => 
        `<option value="${role.id}" style="color: ${role.color}">@${role.name}</option>`
      ).join('');

    // Charge la configuration actuelle
    const statusResponse = await fetch('/api/recruitment/status');
    const status = await statusResponse.json();

    if (status.channelId) {
      channelSelect.value = status.channelId;
    }
    if (status.roleId) {
      roleSelect.value = status.roleId;
    }
    document.getElementById('recruitmentStatus').value = status.isOpen ? 'open' : 'closed';
  } catch (error) {
    console.error('Erreur lors du chargement:', error);
    showMessage('Erreur lors du chargement des données', 'error');
  }
}

// Met à jour le statut des recrutements
async function updateRecruitmentStatus(event) {
  event.preventDefault();
  
  const channelId = document.getElementById('recruitmentChannel').value;
  const roleId = document.getElementById('recruitmentRole').value;
  
  if (!channelId || !roleId) {
    showMessage('Veuillez sélectionner un salon et un rôle', 'error');
    return;
  }

  const data = {
    channelId,
    roleId,
    status: document.getElementById('recruitmentStatus').value
  };

  try {
    const response = await fetch('/api/recruitment/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la mise à jour');
    }

    const result = await response.json();
    if (result.success) {
      showMessage('Statut des recrutements mis à jour avec succès!', 'success');
    }
  } catch (error) {
    console.error('Erreur:', error);
    showMessage(error.message, 'error');
  }
}

function showMessage(message, type) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message-${type}`;
  messageDiv.textContent = message;
  document.getElementById('recruitmentForm').appendChild(messageDiv);
  setTimeout(() => messageDiv.remove(), 3000);
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
  loadChannelsAndRoles();
  document.getElementById('recruitmentForm').addEventListener('submit', updateRecruitmentStatus);
});