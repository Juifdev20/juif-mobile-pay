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

// Servir le manifest.json avec le bon Content-Type
app.get('/manifest.json', (req, res) => {
    res.setHeader('Content-Type', 'application/manifest+json');
    res.sendFile(path.join(__dirname, 'manifest.json'));
});

// Servir le service worker avec le bon Content-Type
app.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'sw.js'));
});

// Servir les icônes PNG
app.get('/icon-192.png', (req, res) => {
    res.setHeader('Content-Type', 'image/png');
    res.sendFile(path.join(__dirname, 'icon-192.png'));
});

app.get('/icon-512.png', (req, res) => {
    res.setHeader('Content-Type', 'image/png');
    res.sendFile(path.join(__dirname, 'icon-512.png'));
});

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

// Fichier pour les configurations de routage
const ROUTING_CONFIG_FILE = path.join(__dirname, 'routing_configs.json');
if (!fs.existsSync(ROUTING_CONFIG_FILE)) {
    fs.writeFileSync(ROUTING_CONFIG_FILE, JSON.stringify({}, null, 2));
    console.log('Fichier routing_configs.json créé');
}

// Helper: Valider un numéro de téléphone
function isValidPhoneNumber(phone) {
    // Enlever les espaces et les + au début
    const cleanPhone = phone.replace(/\s/g, '').replace(/^\+/, '');
    // Vérifier si c'est un nombre et a au moins 9 chiffres
    return /^\d{9,}$/.test(cleanPhone);
}

// Helper: Charger les configurations de routage
function loadRoutingConfigs() {
    try {
        if (fs.existsSync(ROUTING_CONFIG_FILE)) {
            const data = fs.readFileSync(ROUTING_CONFIG_FILE, 'utf8');
            return JSON.parse(data);
        }
        return {};
    } catch (error) {
        console.error('Erreur lors du chargement des configs de routage:', error);
        return {};
    }
}

// Helper: Sauvegarder les configurations de routage
function saveRoutingConfigs(configs) {
    try {
        fs.writeFileSync(ROUTING_CONFIG_FILE, JSON.stringify(configs, null, 2));
        return true;
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des configs de routage:', error);
        return false;
    }
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
    const randomPart = crypto.randomBytes(16).toString('hex');
    return 'JUIFMOBILEPAYAPI_' + randomPart;
}

// Clé admin statique (en production, utiliser une variable d'environnement)
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'JUIFMOBILEPAYADMIN_super_secret_key_2024';

// Helper: Vérifier si c'est une clé admin
function isAdminApiKey(apiKey) {
    return apiKey === ADMIN_API_KEY;
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
    const publicRoutes = ['/generate_key', '/verify_key', '/admin/stats', '/admin/api_keys', '/check_request', '/initiate_pay', '/update_status'];
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
 * Initialise un paiement mobile avec routage vers compte spécifique
 */
app.post('/api/initiate_pay', (req, res) => {
    const { amount, phone, service, recipient_account, recipient_name } = req.body;
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

    // Validation du compte destinataire si fourni
    if (recipient_account && !isValidPhoneNumber(recipient_account)) {
        return res.status(400).json({
            success: false,
            message: 'Numéro de compte destinataire invalide'
        });
    }

    // Créer la transaction avec la clé API et le routage
    const reference = generateReference(service);
    const transactions = loadTransactions();

    const transaction = {
        reference,
        amount: parseFloat(amount),
        phone,
        service: service.toLowerCase(),
        recipient_account: recipient_account || phone, // Par défaut, le numéro du payeur
        recipient_name: recipient_name || null,
        status: 'waiting',
        api_key: apiKey, // Associer la transaction à la clé API
        routing_status: recipient_account ? 'routed' : 'default',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    transactions.push(transaction);
    saveTransactions(transactions);

    res.json({
        success: true,
        reference,
        message: recipient_account 
            ? 'Transaction initiée avec routage vers compte spécifique' 
            : 'Transaction initiée (routage par défaut)',
        transaction: {
            ...transaction,
            routing_info: recipient_account ? {
                recipient_account,
                recipient_name,
                message: 'Le paiement sera transféré vers ce compte après confirmation'
            } : {
                message: 'Le paiement sera effectué sur le numéro du payeur'
            }
        }
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
 * Récupère toutes les transactions (pour le simulateur/admin)
 * Retourne TOUTES les transactions sans filtre par clé API
 */
app.get('/api/check_request/all', (req, res) => {
    const transactions = loadTransactions();
    // Retourner toutes les transactions (sans filtre) pour que l'admin puisse voir tous les paiements
    res.json({
        success: true,
        transactions: transactions
    });
});

/**
 * POST /api/update_status
 * Met à jour le statut d'une transaction
 * Pour le simulateur/admin : permet de confirmer n'importe quelle transaction
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
    // Retirer le filtre par clé API pour permettre à l'admin de confirmer n'importe quelle transaction
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

/**
 * GET /api/admin/stats
 * Récupère les statistiques admin (nécessite clé admin)
 */
app.get('/api/admin/stats', (req, res) => {
    const apiKey = req.headers['x-api-key'];
    
    if (!isAdminApiKey(apiKey)) {
        return res.status(403).json({
            success: false,
            message: 'Accès refusé. Clé admin requise.'
        });
    }
    
    const apiKeys = loadApiKeys();
    const transactions = loadTransactions();
    
    // Calculer les statistiques
    const totalUsers = apiKeys.length;
    const activeUsers = apiKeys.filter(k => k.active).length;
    const inactiveUsers = totalUsers - activeUsers;
    
    // Calculer les transactions par utilisateur
    const userStats = apiKeys.map(key => {
        const userTransactions = transactions.filter(t => t.api_key === key.key);
        return {
            name: key.name,
            email: key.email,
            apiKey: key.key,
            active: key.active,
            createdAt: key.created_at,
            totalTransactions: userTransactions.length,
            successfulTransactions: userTransactions.filter(t => t.status === 'SUCCESS').length,
            failedTransactions: userTransactions.filter(t => t.status === 'FAILED').length,
            pendingTransactions: userTransactions.filter(t => t.status === 'PENDING').length
        };
    });
    
    res.json({
        success: true,
        stats: {
            totalUsers,
            activeUsers,
            inactiveUsers,
            totalTransactions: transactions.length,
            users: userStats
        }
    });
});

/**
 * DELETE /api/admin/api_keys/:key
 * Désactive une clé API (nécessite clé admin)
 */
app.delete('/api/admin/api_keys/:key', (req, res) => {
    const apiKey = req.headers['x-api-key'];
    const keyToDisable = req.params.key;
    
    if (!isAdminApiKey(apiKey)) {
        return res.status(403).json({
            success: false,
            message: 'Accès refusé. Clé admin requise.'
        });
    }
    
    const apiKeys = loadApiKeys();
    const keyIndex = apiKeys.findIndex(k => k.key === keyToDisable);
    
    if (keyIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Clé API non trouvée'
        });
    }
    
    apiKeys[keyIndex].active = false;
    saveApiKeys(apiKeys);
    
    res.json({
        success: true,
        message: 'Clé API désactivée'
    });
});

// ==========================================
// ROUTING CONFIGURATION ENDPOINTS
// ==========================================

/**
 * GET /api/routing_config
 * Récupère la configuration de routage de l'utilisateur
 */
app.get('/api/routing_config', (req, res) => {
    const apiKey = req.apiKey;
    const configs = loadRoutingConfigs();
    
    res.json({
        success: true,
        config: configs[apiKey] || null,
        message: configs[apiKey] 
            ? 'Configuration de routage trouvée' 
            : 'Aucune configuration de routage. Utilisez POST pour en créer une.'
    });
});

/**
 * POST /api/routing_config
 * Configure le compte de destination par défaut pour les paiements
 */
app.post('/api/routing_config', (req, res) => {
    const apiKey = req.apiKey;
    const { recipient_account, recipient_name, description, auto_route } = req.body;
    
    // Validation
    if (!recipient_account) {
        return res.status(400).json({
            success: false,
            message: 'Paramètre manquant: recipient_account requis'
        });
    }
    
    if (!isValidPhoneNumber(recipient_account)) {
        return res.status(400).json({
            success: false,
            message: 'Numéro de compte destinataire invalide (minimum 9 chiffres)'
        });
    }
    
    const configs = loadRoutingConfigs();
    
    // Créer ou mettre à jour la configuration
    configs[apiKey] = {
        recipient_account,
        recipient_name: recipient_name || null,
        description: description || 'Compte de destination par défaut',
        auto_route: auto_route !== false, // Par défaut true
        updated_at: new Date().toISOString()
    };
    
    saveRoutingConfigs(configs);
    
    res.json({
        success: true,
        message: 'Configuration de routage enregistrée avec succès',
        config: configs[apiKey]
    });
});

/**
 * DELETE /api/routing_config
 * Supprime la configuration de routage
 */
app.delete('/api/routing_config', (req, res) => {
    const apiKey = req.apiKey;
    const configs = loadRoutingConfigs();
    
    if (!configs[apiKey]) {
        return res.status(404).json({
            success: false,
            message: 'Aucune configuration de routage trouvée'
        });
    }
    
    delete configs[apiKey];
    saveRoutingConfigs(configs);
    
    res.json({
        success: true,
        message: 'Configuration de routage supprimée'
    });
});

/**
 * GET /api/routing/transactions
 * Récupère les transactions avec info de routage
 */
app.get('/api/routing/transactions', (req, res) => {
    const apiKey = req.apiKey;
    const transactions = loadTransactions();
    
    // Filtrer par clé API et ajouter info de routage
    const userTransactions = transactions
        .filter(t => t.api_key === apiKey)
        .map(t => ({
            ...t,
            routing_display: t.recipient_account === t.phone 
                ? 'Paiement direct' 
                : `Transfert vers ${t.recipient_name || t.recipient_account}`
        }));
    
    res.json({
        success: true,
        count: userTransactions.length,
        transactions: userTransactions
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
    console.log('  POST   /api/initiate_pay          (avec routage vers compte spécifique)');
    console.log('  GET    /api/check_request?reference={ref}');
    console.log('  GET    /api/check_request/all');
    console.log('  POST   /api/update_status');
    console.log('  GET    /api/transactions');
    console.log('  DELETE /api/transactions');
    console.log('');
    console.log('🎯 ROUTAGE DES PAIEMENTS:');
    console.log('  GET    /api/routing_config        (voir config)');
    console.log('  POST   /api/routing_config        (configurer compte destination)');
    console.log('  DELETE /api/routing_config      (supprimer config)');
    console.log('  GET    /api/routing/transactions  (voir transactions avec routage)');
    console.log('');
});

// Helper function
function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}
