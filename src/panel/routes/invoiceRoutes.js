import express from 'express';
import { authenticate } from '../../auth/middleware.js';
import db from '../../database/db.js';
import puppeteer from 'puppeteer';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/index.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Assure que le dossier pour les factures existe
const invoicesDir = join(__dirname, '../../../public/invoices');
if (!fs.existsSync(invoicesDir)) {
  fs.mkdirSync(invoicesDir, { recursive: true });
  console.log('Dossier des factures créé:', invoicesDir);
}

router.post('/create', authenticate, async (req, res) => {
  console.log('Début de la création de facture');
  try {
    const { companyName, address, phone, items, comments } = req.body;
    console.log('Données reçues:', { companyName, address, items: items.length });

    const totalHT = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const totalTTC = totalHT * 1.20;

    console.log('Création de la facture dans la base de données...');
    // Crée la facture dans la base de données
    const stmt = await db.prepare(`
      INSERT INTO invoices (
        guild_id, created_by, company_name, address, phone,
        comments, total_ht, total_ttc, currency
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id
    `);

    const result = await stmt.run(
      req.user.guildId,
      req.user.userId,
      companyName,
      address,
      phone || null,
      comments || null,
      totalHT,
      totalTTC,
      '€'
    );

    const invoiceId = result.lastID;
    console.log('Facture créée avec ID:', invoiceId);

    console.log('Ajout des articles...');
    // Ajoute les articles
    const itemStmt = await db.prepare(`
      INSERT INTO invoice_items (invoice_id, name, quantity, unit_price)
      VALUES (?, ?, ?, ?)
    `);

    for (const item of items) {
      await itemStmt.run(invoiceId, item.name, item.quantity, item.unitPrice);
    }
    console.log('Articles ajoutés');

    console.log('Lancement de Puppeteer...');
    // Génère l'image de la facture
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log('Navigateur lancé');
    
    const page = await browser.newPage();
    console.log('Nouvelle page créée');

    await page.setViewport({
      width: 1200,
      height: 1600,
      deviceScaleFactor: 2
    });
    console.log('Viewport configuré');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Facture #${String(invoiceId).padStart(5, '0')}</title>
        <style>
          body {
            font-family: 'Segoe UI', 'Open Sans', sans-serif;
            margin: 0;
            padding: 40px;
            background: white;
          }
          .invoice-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
          }
          .company-info {
            font-size: 14px;
          }
          .invoice-number {
            font-size: 24px;
            color: #2b2d31;
            margin-bottom: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #eee;
          }
          th {
            background: #f8f9fa;
            font-weight: 600;
          }
          .totals {
            margin-top: 40px;
            text-align: right;
          }
          .total-ttc {
            font-size: 20px;
            font-weight: bold;
            color: #2b2d31;
            margin-top: 10px;
          }
          .comments {
            margin-top: 40px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
          }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <div class="company-info">
            <h2>${companyName}</h2>
            <p>${address}</p>
            ${phone ? `<p>Tél: ${phone}</p>` : ''}
          </div>
          <div>
            <div class="invoice-number">Facture #${String(invoiceId).padStart(5, '0')}</div>
            <div>Date: ${format(new Date(), 'dd/MM/yyyy')}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantité</th>
              <th>Prix unitaire HT</th>
              <th>Total HT</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>${item.unitPrice.toFixed(2)}€</td>
                <td>${(item.quantity * item.unitPrice).toFixed(2)}€</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div>Total HT: ${totalHT.toFixed(2)}€</div>
          <div>TVA (20%): ${(totalTTC - totalHT).toFixed(2)}€</div>
          <div class="total-ttc">Total TTC: ${totalTTC.toFixed(2)}€</div>
        </div>

        ${comments ? `
          <div class="comments">
            <strong>Commentaires:</strong><br>
            ${comments}
          </div>
        ` : ''}
      </body>
      </html>
    `;

    await page.setContent(htmlContent);
    console.log('Contenu HTML défini');

    const imageBuffer = await page.screenshot({
      fullPage: true,
      type: 'png',
      omitBackground: false
    });
    console.log('Screenshot capturé');

    await browser.close();
    console.log('Navigateur fermé');

    // Sauvegarde l'image
    const imageName = `facture-${invoiceId}.png`;
    const imagePath = join(invoicesDir, imageName);
    fs.writeFileSync(imagePath, imageBuffer);
    console.log('Image sauvegardée:', imagePath);

    res.json({
      success: true,
      invoiceId,
      imageUrl: `/invoices/${imageName}`
    });
  } catch (error) {
    console.error('Erreur détaillée lors de la création de la facture:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;