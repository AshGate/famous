import { EmbedBuilder } from 'discord.js';
import puppeteer from 'puppeteer';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr/index.js';
import db from '../database/db.js';

export const invoiceCreationState = new Map();

export async function handleInvoiceCreate(message) {
  const userId = message.author.id;
  
  invoiceCreationState.set(userId, {
    step: 'company',
    data: {
      guild_id: message.guild.id,
      created_by: userId,
      items: [],
      currency: '$'
    }
  });

  await message.reply('Création d\'une nouvelle facture.\nNom de l\'entreprise :');
}

export async function handleInvoiceCreation(message) {
  const userId = message.author.id;
  const state = invoiceCreationState.get(userId);
  
  if (!state) return;
  
  const content = message.content.trim();

  switch (state.step) {
    case 'company':
      state.data.company_name = content;
      state.step = 'address';
      await message.reply('Adresse de l\'entreprise :');
      break;

    case 'address':
      state.data.address = content;
      state.step = 'phone';
      await message.reply('Numéro de téléphone (ou "skip" pour passer) :');
      break;

    case 'phone':
      if (content.toLowerCase() !== 'skip') {
        state.data.phone = content;
      }
      state.step = 'payment';
      await message.reply('Mode de paiement :');
      break;

    case 'payment':
      state.data.payment_method = content;
      state.step = 'logo';
      await message.reply('URL du logo (ou "skip" pour passer) :');
      break;

    case 'logo':
      if (content.toLowerCase() !== 'skip') {
        if (!content.startsWith('http')) {
          await message.reply('L\'URL du logo doit commencer par http:// ou https://\nVeuillez réessayer ou taper "skip" :');
          return;
        }
        try {
          const response = await fetch(content);
          if (!response.ok) {
            await message.reply('URL invalide. Veuillez réessayer ou taper "skip" :');
            return;
          }
          state.data.logo_url = content;
        } catch (error) {
          await message.reply('URL invalide. Veuillez réessayer ou taper "skip" :');
          return;
        }
      }
      state.step = 'items';
      await message.reply('Ajoutez les articles au format : nom;quantité;prix_unitaire_ht\nTapez "done" quand vous avez terminé.');
      break;

    case 'items':
      if (content.toLowerCase() === 'done') {
        if (state.data.items.length === 0) {
          await message.reply('Vous devez ajouter au moins un article.');
          return;
        }
        state.step = 'comments';
        await message.reply('Voulez-vous ajouter des commentaires ? (ou "skip" pour passer)');
      } else {
        const [name, quantity, unitPrice] = content.split(';');
        if (!name || !quantity || !unitPrice || isNaN(quantity) || isNaN(unitPrice)) {
          await message.reply('Format invalide. Utilisez : nom;quantité;prix_unitaire_ht');
          return;
        }
        state.data.items.push({
          name,
          quantity: parseInt(quantity),
          unit_price: parseFloat(unitPrice)
        });
        await message.reply('Article ajouté. Continuez ou tapez "done" pour terminer.');
      }
      break;

    case 'comments':
      if (content.toLowerCase() !== 'skip') {
        state.data.comments = content;
      }
      state.step = 'blocked_funds';
      await message.reply('Montant des fonds bloqués (ou "skip" pour passer) :');
      break;

    case 'blocked_funds':
      if (content.toLowerCase() !== 'skip') {
        const amount = parseFloat(content);
        if (isNaN(amount)) {
          await message.reply('Montant invalide. Veuillez entrer un nombre ou "skip" :');
          return;
        }
        state.data.blocked_funds = amount;
      }

      const totalHT = state.data.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      state.data.total_ht = totalHT;
      state.data.total_ttc = totalHT * 1.20;

      try {
        // Création de la facture
        const invoiceResult = await db.prepare(`
          INSERT INTO invoices (
            guild_id, created_by, company_name, address, phone,
            payment_method, comments, blocked_funds, total_ht,
            total_ttc, logo_url, currency
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          RETURNING id
        `).get(
          state.data.guild_id,
          state.data.created_by,
          state.data.company_name,
          state.data.address,
          state.data.phone || null,
          state.data.payment_method,
          state.data.comments || null,
          state.data.blocked_funds || 0,
          state.data.total_ht,
          state.data.total_ttc,
          state.data.logo_url || null,
          state.data.currency
        );

        const invoiceId = invoiceResult.id;

        // Ajout des articles
        for (const item of state.data.items) {
          await db.prepare(`
            INSERT INTO invoice_items (invoice_id, name, quantity, unit_price)
            VALUES (?, ?, ?, ?)
          `).run(invoiceId, item.name, item.quantity, item.unit_price);
        }

        const embed = new EmbedBuilder()
          .setTitle('✅ Facture créée')
          .setColor('#2b2d31')
          .addFields(
            { name: 'ID', value: invoiceId.toString() },
            { name: 'Entreprise', value: state.data.company_name },
            { name: 'Total HT', value: `${state.data.total_ht}${state.data.currency}` },
            { name: 'Total TTC', value: `${state.data.total_ttc}${state.data.currency}` }
          )
          .setTimestamp();

        await message.reply({ embeds: [embed] });
      } catch (error) {
        console.error('Erreur lors de la création de la facture:', error);
        await message.reply('Une erreur est survenue lors de la création de la facture.');
      } finally {
        invoiceCreationState.delete(userId);
      }
      break;
  }
}

export async function handleInvoiceExport(message, invoiceId) {
  try {
    const invoice = await db.prepare(`
      SELECT *
      FROM invoices
      WHERE id = ? AND guild_id = ?
    `).get(invoiceId, message.guild.id);

    if (!invoice) {
      return message.reply('Facture non trouvée.');
    }

    const items = await db.prepare(`
      SELECT name, quantity, unit_price
      FROM invoice_items
      WHERE invoice_id = ?
    `).all(invoiceId);

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    await page.setViewport({
      width: 800,
      height: 1000,
      deviceScaleFactor: 2
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Facture #${String(invoice.id).padStart(5, '0')}</title>
        <style>
          body {
            background-color: #f4f4f4;
            display: flex;
            justify-content: center;
            padding: 20px;
            font-family: 'Segoe UI', 'Open Sans', sans-serif;
            margin: 0;
          }
          .invoice-container {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            width: 700px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
          }
          .logo {
            max-width: 80px;
            max-height: 80px;
            margin-bottom: 8px;
          }
          .company-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 4px;
          }
          .company-info {
            font-size: 12px;
            line-height: 1.4;
          }
          .invoice-info {
            text-align: right;
            font-size: 12px;
          }
          .invoice-number {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 4px;
          }
          table {
            width: 100%;
            margin-top: 20px;
            border-collapse: collapse;
            font-size: 12px;
          }
          th {
            background: #f0f0f0;
            padding: 8px;
            text-align: left;
          }
          td {
            padding: 8px;
            border-bottom: 1px solid #ddd;
          }
          .bottom {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
            background: #f8f8f8;
            padding: 15px;
            border-radius: 6px;
            font-size: 12px;
          }
          .totals {
            text-align: right;
          }
          .totals div {
            margin-bottom: 6px;
          }
          .total-ttc {
            font-size: 16px;
            font-weight: bold;
            background-color: #2d2d63;
            color: white;
            padding: 8px 15px;
            border-radius: 4px;
            display: inline-block;
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <div>
              <img src="${invoice.logo_url || 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/No_image_available.svg/768px-No_image_available.svg.png'}" class="logo"><br>
              <div class="company-name">${invoice.company_name}</div>
              <div class="company-info">${invoice.address}<br>${invoice.phone ? `Tél: ${invoice.phone}` : ''}</div>
            </div>
            <div class="invoice-info">
              <div class="invoice-number">Facture N°${String(invoice.id).padStart(5, '0')}</div>
              <div>${format(new Date(invoice.created_at), 'HH:mm:ss - dd/MM/yyyy', { locale: fr })}</div>
              <div>Moyen de paiement : ${invoice.payment_method}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>DÉSIGNATION</th>
                <th>QTÉ</th>
                <th>PRIX UNITAIRE H.T.</th>
                <th>MONTANT H.T.</th>
                <th>MONTANT T.T.C.</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => {
                const montantHT = item.quantity * item.unit_price;
                const montantTTC = montantHT * 1.20;
                return `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity.toFixed(2)}</td>
                  <td>${item.unit_price}${invoice.currency}</td>
                  <td>${montantHT.toFixed(2)}${invoice.currency}</td>
                  <td>${montantTTC.toFixed(2)}${invoice.currency}</td>
                </tr>
                `;
              }).join('\n')}
            </tbody>
          </table>

          <div class="bottom">
            <div><strong>COMMENTAIRE</strong><br>${invoice.comments || 'N/A'}</div>
            <div class="totals">
              <div><strong>TOTAL H.T.</strong> ${invoice.total_ht.toFixed(2)}${invoice.currency}</div>
              ${invoice.blocked_funds > 0 ? 
                `<div><strong>FONDS BLOQUÉS</strong> ${invoice.blocked_funds.toFixed(2)}${invoice.currency}</div>` : ''}
              <div class="total-ttc">TOTAL ${invoice.total_ttc.toFixed(2)}${invoice.currency}</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await page.setContent(htmlContent);

    await page.evaluate(() => {
      return Promise.all(
        Array.from(document.images)
          .filter(img => !img.complete)
          .map(img => new Promise(resolve => {
            img.onload = img.onerror = resolve;
          }))
      );
    });

    const imageBuffer = await page.screenshot({
      type: 'png',
      fullPage: true,
      omitBackground: true
    });

    await browser.close();

    await message.reply({
      content: `Voici la facture #${invoice.id} :`,
      files: [{
        attachment: imageBuffer,
        name: `facture-${invoice.id}.png`
      }]
    });
  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
    await message.reply('Une erreur est survenue lors de l\'export de la facture.');
  }
}