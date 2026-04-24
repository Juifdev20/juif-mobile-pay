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
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const TRANSACTIONS_FILE = path.join(__dirname, 'transactions.json');
const API_KEYS_FILE = path.join(__dirname, 'api_keys.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, '..')));  // Servir le dossier parent (exame-ecommerce)

// Créer transactions.json s'il n'existe pas
if (!fs.existsSync(TRANSACTIONS_FILE)) {
    fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify([], null, 2));
    console.log('Fichier transactions.json créé');
}

// Créer api_keys.json s'il n'existe pas
if (!fs.existsSync(API_KEYS_FILE)) {
    fs.writeFileSync(API_KEYS_FILE, JSON.stringify([], null, 2));
    console.log('Fichier api_keys.json créé');
}

// Helper: Charger les clés API
function loadApiKeys() {
    try {
        if (fs.existsSync(API_KEYS_FILE)) {
            const data = fs.readFileSync(API_KEYS_FILE, 'utf8');
            return JSON.parse(data);
        }
        return [];
    } catch (error) {
        console.error('Erreur lors du chargement des clés API:', error);
        return [];
    }
}

// Helper: Sauvegarder les clés API
function saveApiKeys(apiKeys) {
    try {
        fs.writeFileSync(API_KEYS_FILE, JSON.stringify(apiKeys, null, 2));
        return true;
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des clés API:', error);
        return false;
    }
}

// Helper: Générer une clé API unique
function generateApiKey() {
    return 'jpay_' + crypto.randomBytes(16).toString('hex');
}

// Helper: Vérifier la clé API
function isValidApiKey(apiKey) {
    const apiKeys = loadApiKeys();
    return apiKeys.some(key => key.key === apiKey && key.active);
}

// Middleware: Vérifier la clé API (sauf pour les routes publiques)
function checkApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    
    // Routes publiques (pas besoin de clé API)
    const publicRoutes = ['/api/generate_key', '/api/verify_key'];
    if (publicRoutes.some(route => req.path.startsWith(route))) {
        return next();
    }
    
    if (!apiKey) {
        return res.status(401).json({
            success: false,
            message: 'Clé API manquante. Ajoutez le header "x-api-key" à vos requêtes.'
        });
    }
    
    if (!isValidApiKey(apiKey)) {
        return res.status(401).json({
            success: false,
            message: 'Clé API invalide ou inactive.'
        });
    }
    
    // Ajouter l'API key à la requête pour utilisation ultérieure
    req.apiKey = apiKey;
    next();
}

// Appliquer le middleware à toutes les routes API
app.use('/api', checkApiKey);

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
 * POST /api/generate_key
 * Génère une nouvelle clé API
 * Route publique (pas besoin de clé API)
 */
app.post('/api/generate_key', (req, res) => {
    const { name, email } = req.body;
    
    if (!name || !email) {
        return res.status(400).json({
            success: false,
            message: 'Paramètres manquants: name et email requis'
        });
    }
    
    const apiKeys = loadApiKeys();
    const newKey = generateApiKey();
    
    const apiKeyData = {
        key: newKey,
        name,
        email,
        created_at: new Date().toISOString(),
        active: true
    };
    
    apiKeys.push(apiKeyData);
    saveApiKeys(apiKeys);
    
    res.json({
        success: true,
        message: 'Clé API générée avec succès',
        api_key: newKey,
        name,
        email,
        created_at: apiKeyData.created_at
    });
});

/**
 * POST /api/verify_key
 * Vérifie si une clé API est valide
 * Route publique (pas besoin de clé API)
 */
app.post('/api/verify_key', (req, res) => {
    const { api_key } = req.body;
    
    if (!api_key) {
        return res.status(400).json({
            success: false,
            message: 'Paramètre manquant: api_key requis'
        });
    }
    
    const apiKeys = loadApiKeys();
    const keyData = apiKeys.find(k => k.key === api_key);
    
    if (!keyData) {
        return res.status(404).json({
            success: false,
            message: 'Clé API non trouvée'
        });
    }
    
    res.json({
        success: true,
        valid: keyData.active,
        name: keyData.name,
        email: keyData.email
    });
});

/**
 * POST /api/initiate_pay
 * Initialise un paiement mobile
 */
app.post('/api/initiate_pay', (req, res) => {
    const { amount, phone, service } = req.body;
    const apiKey = req.apiKey;

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

    // Créer la transaction avec la clé API
    const reference = generateReference(service);
    const transactions = loadTransactions();

    const transaction = {
        reference,
        amount: parseFloat(amount),
        phone,
        service: service.toLowerCase(),
        status: 'waiting',
        api_key: apiKey, // Associer la transaction à la clé API
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
    const apiKey = req.apiKey;

    if (!reference) {
        return res.status(400).json({
            success: false,
            message: 'Paramètre manquant: reference requis'
        });
    }

    const transactions = loadTransactions();
    const transaction = transactions.find(t => t.reference === reference && t.api_key === apiKey);

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
    const apiKey = req.apiKey;
    const transactions = loadTransactions();
    // Filtrer par clé API
    const userTransactions = transactions.filter(t => t.api_key === apiKey);
    res.json({
        success: true,
        transactions: userTransactions
    });
});

/**
 * POST /api/update_status
 * Met à jour le statut d'une transaction
 */
app.post('/api/update_status', (req, res) => {
    const { reference, status } = req.body;
    const apiKey = req.apiKey;

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
    const transactionIndex = transactions.findIndex(t => t.reference === reference && t.api_key === apiKey);

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
    const apiKey = req.apiKey;
    const transactions = loadTransactions();
    // Filtrer par clé API
    const userTransactions = transactions.filter(t => t.api_key === apiKey);
    res.json({
        success: true,
        transactions: userTransactions
    });
});

/**
 * DELETE /api/transactions
 * Supprime toutes les transactions (reset)
 */
app.delete('/api/transactions', (req, res) => {
    const apiKey = req.apiKey;
    const transactions = loadTransactions();
    // Ne supprimer que les transactions de cette clé API
    const userTransactions = transactions.filter(t => t.api_key !== apiKey);
    saveTransactions(userTransactions);
    res.json({
        success: true,
        message: 'Transactions réinitialisées pour cette clé API'
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
