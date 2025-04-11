// État global pour les articles
let invoiceItems = [];

// Ajoute un article à la facture
function addInvoiceItem() {
  const name = document.getElementById('itemName').value;
  const quantity = parseFloat(document.getElementById('itemQuantity').value);
  const unitPrice = parseFloat(document.getElementById('itemPrice').value);

  if (!name || isNaN(quantity) || isNaN(unitPrice)) {
    showMessage('Veuillez remplir tous les champs correctement', 'error');
    return;
  }

  invoiceItems.push({ name, quantity, unitPrice });
  updateItemsTable();
  clearItemForm();
}

// Met à jour le tableau des articles
function updateItemsTable() {
  const tbody = document.getElementById('itemsTableBody');
  tbody.innerHTML = invoiceItems.map((item, index) => `
    <tr>
      <td>${item.name}</td>
      <td>${item.quantity}</td>
      <td>${item.unitPrice.toFixed(2)}€</td>
      <td>${(item.quantity * item.unitPrice).toFixed(2)}€</td>
      <td>
        <button type="button" class="btn-delete" onclick="removeItem(${index})">
          🗑️
        </button>
      </td>
    </tr>
  `).join('');

  updateTotal();
}

// Supprime un article
function removeItem(index) {
  invoiceItems.splice(index, 1);
  updateItemsTable();
}

// Met à jour le total
function updateTotal() {
  const totalHT = invoiceItems.reduce((sum, item) => 
    sum + (item.quantity * item.unitPrice), 0
  );
  const totalTTC = totalHT * 1.20;

  document.getElementById('totalHT').textContent = totalHT.toFixed(2) + '€';
  document.getElementById('totalTTC').textContent = totalTTC.toFixed(2) + '€';
}

// Vide le formulaire d'article
function clearItemForm() {
  document.getElementById('itemName').value = '';
  document.getElementById('itemQuantity').value = '';
  document.getElementById('itemPrice').value = '';
}

// Crée et envoie la facture
async function createInvoice(event) {
  event.preventDefault();

  if (invoiceItems.length === 0) {
    showMessage('Ajoutez au moins un article à la facture', 'error');
    return;
  }

  const data = {
    companyName: document.getElementById('companyName').value,
    address: document.getElementById('address').value,
    phone: document.getElementById('phone').value,
    items: invoiceItems,
    comments: document.getElementById('comments').value
  };

  try {
    const response = await fetch('/api/invoices/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la création de la facture');
    }

    const result = await response.json();
    
    if (result.success) {
      // Affiche l'image de la facture dans une nouvelle fenêtre
      window.open(result.imageUrl, '_blank');
      
      showMessage('Facture générée avec succès!', 'success');
      resetForm();
    }
  } catch (error) {
    showMessage(error.message, 'error');
  }
}

// Réinitialise le formulaire
function resetForm() {
  document.getElementById('invoiceForm').reset();
  invoiceItems = [];
  updateItemsTable();
}

function showMessage(message, type) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message-${type}`;
  messageDiv.textContent = message;
  document.getElementById('invoiceForm').appendChild(messageDiv);
  setTimeout(() => messageDiv.remove(), 3000);
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('addItemBtn').addEventListener('click', addInvoiceItem);
  document.getElementById('invoiceForm').addEventListener('submit', createInvoice);
});