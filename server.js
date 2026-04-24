/**
 * Mobile Payment API - Node.js Server
 * Simulateur d'API de paiement mobile pour M-Pesa, Airtel Money et Orange Money
 * 
 * Installation:
 *   npm install
 * 
 * Démarrage:
 *   npm start
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const TRANSACTIONS_FILE = path.join(__dirname, 'transactions.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, '..')));  // Servir le dossier parent (exame-ecommerce)

// Helper: Charger les transactions
function loadTransactions() {
    try {
        if (fs.existsSync(TRANSACTIONS_FILE)) {
            const data = fs.readFileSync(TRANSACTIONS_FILE, 'utf8');
            return JSON.parse(data);
        }
        return [];
    } catch (error) {
        console.error('Erreur lors du chargement des transactions:', error);
        return [];
    }
}

// Helper: Sauvegarder les transactions
function saveTransactions(transactions) {
    try {
        fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify(transactions, null, 2));
        return true;
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des transactions:', error);
        return false;
    }
}

// Helper: Générer une référence unique
function generateReference(service) {
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const hash = Math.random().toString(36).substring(2, 10);
    return `${service.toUpperCase()}_${timestamp}_${hash}`;
}

// ==========================================
// API ENDPOINTS
// ==========================================

/**
 * POST /api/initiate_pay
 * Initialise un paiement mobile
 */
app.post('/api/initiate_pay', (req, res) => {
    const { amount, phone, service } = req.body;

    // Validation
    if (!amount || !phone || !service) {
        return res.status(400).json({
            success: false,
            message: 'Paramètres manquants: amount, phone, service requis'
        });
    }

    const validServices = ['mpesa', 'airtel', 'orange'];
    if (!validServices.includes(service.toLowerCase())) {
        return res.status(400).json({
            success: false,
            message: 'Service invalide. Services disponibles: mpesa, airtel, orange'
        });
    }

    if (!isNumeric(amount) || amount <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Montant invalide'
        });
    }

    // Créer la transaction
    const reference = generateReference(service);
    const transactions = loadTransactions();

    const transaction = {
        reference,
        amount: parseFloat(amount),
        phone,
        service: service.toLowerCase(),
        status: 'waiting',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    transactions.push(transaction);
    saveTransactions(transactions);

    res.json({
        success: true,
        reference,
        message: 'Transaction initiée avec succès',
        transaction
    });
});

/**
 * GET /api/check_request
 * Vérifie le statut d'une transaction
 */
app.get('/api/check_request', (req, res) => {
    const { reference } = req.query;

    if (!reference) {
        return res.status(400).json({
            success: false,
            message: 'Paramètre manquant: reference requis'
        });
    }

    const transactions = loadTransactions();
    const transaction = transactions.find(t => t.reference === reference);

    if (!transaction) {
        return res.status(404).json({
            success: false,
            message: 'Transaction non trouvée'
        });
    }

    res.json({
        success: true,
        transaction,
        status: transaction.status
    });
});

/**
 * GET /api/check_request/all
 * Récupère toutes les transactions (pour le simulateur)
 */
app.get('/api/check_request/all', (req, res) => {
    const transactions = loadTransactions();
    res.json({
        success: true,
        transactions
    });
});

/**
 * POST /api/update_status
 * Met à jour le statut d'une transaction
 */
app.post('/api/update_status', (req, res) => {
    const { reference, status } = req.body;

    if (!reference || !status) {
        return res.status(400).json({
            success: false,
            message: 'Paramètres manquants: reference et status requis'
        });
    }

    const validStatuses = ['SUCCESS', 'CANCELLED'];
    if (!validStatuses.includes(status.toUpperCase())) {
        return res.status(400).json({
            success: false,
            message: 'Statut invalide. Statuts disponibles: SUCCESS, CANCELLED'
        });
    }

    const transactions = loadTransactions();
    const transactionIndex = transactions.findIndex(t => t.reference === reference);

    if (transactionIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Transaction non trouvée'
        });
    }

    // Mettre à jour
    transactions[transactionIndex].status = status.toUpperCase();
    transactions[transactionIndex].updated_at = new Date().toISOString();
    saveTransactions(transactions);

    res.json({
        success: true,
        message: 'Statut mis à jour avec succès',
        reference,
        status: status.toUpperCase()
    });
});

/**
 * GET /api/transactions
 * Récupère toutes les transactions
 */
app.get('/api/transactions', (req, res) => {
    const transactions = loadTransactions();
    res.json({
        success: true,
        transactions
    });
});

/**
 * DELETE /api/transactions
 * Supprime toutes les transactions (reset)
 */
app.delete('/api/transactions', (req, res) => {
    saveTransactions([]);
    res.json({
        success: true,
        message: 'Transactions réinitialisées'
    });
});

// ==========================================
// SERVEUR
// ==========================================

app.listen(PORT, '0.0.0.0', () => {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║     Mobile Payment API - Node.js Server                   ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    console.log(`� Site e-commerce: http://localhost:${PORT}/Pannier.html`);
    console.log(`�� Simulateur: http://localhost:${PORT}/simulateur.html`);
    console.log(`🔌 API Base: http://localhost:${PORT}/api`);
    console.log('');
    console.log('Endpoints disponibles:');
    console.log('  POST   /api/initiate_pay');
    console.log('  GET    /api/check_request?reference={ref}');
    console.log('  GET    /api/check_request/all');
    console.log('  POST   /api/update_status');
    console.log('  GET    /api/transactions');
    console.log('  DELETE /api/transactions');
    console.log('');
});

// Helper function
function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}
