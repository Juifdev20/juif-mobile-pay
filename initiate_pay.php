<?php
/**
 * Mobile Payment API - Initiate Payment
 * Simule l'initialisation d'un paiement mobile (M-Pesa, Airtel Money, Orange Money)
 * 
 * Méthode: POST
 * Paramètres:
 *   - amount: Montant du paiement
 *   - phone: Numéro de téléphone du client
 *   - service: Service de paiement (mpesa, airtel, orange)
 * 
 * Réponse JSON:
 *   - success: true/false
 *   - reference: Référence unique de la transaction
 *   - message: Message de statut
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Gérer les requêtes OPTIONS pour CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Vérifier la méthode
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

// Récupérer les données POST
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    $input = $_POST;
}

// Valider les paramètres
$amount = $input['amount'] ?? null;
$phone = $input['phone'] ?? null;
$service = $input['service'] ?? null;

if (!$amount || !$phone || !$service) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Paramètres manquants: amount, phone, service requis'
    ]);
    exit;
}

// Valider le service
$validServices = ['mpesa', 'airtel', 'orange'];
if (!in_array(strtolower($service), $validServices)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Service invalide. Services disponibles: mpesa, airtel, orange'
    ]);
    exit;
}

// Valider le montant
if (!is_numeric($amount) || $amount <= 0) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Montant invalide'
    ]);
    exit;
}

// Générer une référence unique
$reference = strtoupper($service) . '_' . date('YmdHis') . '_' . substr(md5(uniqid()), 0, 8);

// Charger les transactions existantes
$transactionsFile = __DIR__ . '/transactions.json';
$transactions = [];

if (file_exists($transactionsFile)) {
    $transactions = json_decode(file_get_contents($transactionsFile), true) ?? [];
}

// Créer la nouvelle transaction
$transaction = [
    'reference' => $reference,
    'amount' => floatval($amount),
    'phone' => $phone,
    'service' => strtolower($service),
    'status' => 'waiting',
    'created_at' => date('Y-m-d H:i:s'),
    'updated_at' => date('Y-m-d H:i:s')
];

// Ajouter la transaction
$transactions[] = $transaction;

// Sauvegarder dans le fichier JSON
file_put_contents($transactionsFile, json_encode($transactions, JSON_PRETTY_PRINT));

// Réponse succès
echo json_encode([
    'success' => true,
    'reference' => $reference,
    'message' => 'Transaction initiée avec succès',
    'transaction' => $transaction
]);
