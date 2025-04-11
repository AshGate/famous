let calendar;

// Charge les salons au chargement de la page
async function loadChannels() {
  try {
    const response = await fetch('/api/appointments/channels');
    const channels = await response.json();
    
    const select = document.getElementById('appointmentChannel');
    select.innerHTML = '<option value="">Sélectionnez un salon</option>' + 
      channels.map(channel => 
        `<option value="${channel.id}">#${channel.name}</option>`
      ).join('');
  } catch (error) {
    console.error('Erreur lors du chargement des salons:', error);
  }
}

// Initialise le calendrier
function initializeCalendar() {
  const calendarEl = document.getElementById('calendar');
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'fr',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    buttonText: {
      today: 'Aujourd\'hui',
      month: 'Mois',
      week: 'Semaine',
      day: 'Jour'
    },
    events: '/api/appointments',
    eventClick: function(info) {
      showAppointmentDetails(info.event);
    },
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    firstDay: 1,
    allDayText: 'Toute la journée',
    dayMaxEvents: true,
    eventColor: '#5865f2'
  });
  calendar.render();
}

// Affiche les détails d'un rendez-vous
function showAppointmentDetails(event) {
  const modal = document.getElementById('appointmentModal');
  const details = document.getElementById('appointmentDetails');
  
  const date = new Date(event.start);
  details.innerHTML = `
    <div style="margin-bottom: 20px;">
      <p><strong>Date:</strong> ${date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      <p><strong>Heure:</strong> ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
      <p><strong>Lieu:</strong> ${event.extendedProps.location}</p>
      <p><strong>Description:</strong> ${event.extendedProps.description}</p>
    </div>
    <button onclick="deleteAppointment(${event.id})" class="btn" style="background-color: var(--danger-color);">
      Supprimer le rendez-vous
    </button>
  `;
  
  modal.style.display = 'block';
}

// Supprime un rendez-vous
async function deleteAppointment(id) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) {
    return;
  }

  try {
    const response = await fetch(`/api/appointments/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      document.getElementById('appointmentModal').style.display = 'none';
      calendar.refetchEvents();
      showMessage('Rendez-vous supprimé avec succès!', 'success');
    } else {
      throw new Error('Erreur lors de la suppression');
    }
  } catch (error) {
    showMessage(error.message, 'error');
  }
}

// Crée un nouveau rendez-vous
async function createAppointment(event) {
  event.preventDefault();
  
  const channelId = document.getElementById('appointmentChannel').value;
  if (!channelId) {
    showMessage('Veuillez sélectionner un salon', 'error');
    return;
  }

  const data = {
    channelId: channelId,
    date: document.getElementById('appointmentDate').value,
    time: document.getElementById('appointmentTime').value,
    location: document.getElementById('appointmentLocation').value,
    description: document.getElementById('appointmentDescription').value
  };

  try {
    const response = await fetch('/api/appointments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      showMessage('Rendez-vous créé avec succès!', 'success');
      document.getElementById('appointmentForm').reset();
      calendar.refetchEvents();
    } else {
      throw new Error('Erreur lors de la création du rendez-vous');
    }
  } catch (error) {
    showMessage(error.message, 'error');
  }
}

function showMessage(message, type) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message-${type}`;
  messageDiv.textContent = message;
  document.getElementById('appointmentForm').appendChild(messageDiv);
  setTimeout(() => messageDiv.remove(), 3000);
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
  loadChannels();
  initializeCalendar();
  
  document.getElementById('appointmentForm').addEventListener('submit', createAppointment);
  
  // Gestion de la modal
  const modal = document.getElementById('appointmentModal');
  const span = document.getElementsByClassName('close')[0];
  
  span.onclick = () => modal.style.display = 'none';
  window.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };
});