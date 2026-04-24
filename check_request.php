<?php
/**
 * Mobile Payment API - Check Request Status
 * Vérifie l'état actuel d'une transaction
 * 
 * Méthode: GET
 * Paramètres:
 *   - reference: Référence de la transaction
 * 
 * Réponse JSON:
 *   - success: true/false
 *   - transaction: Détails de la transaction
 *   - status: waiting, SUCCESS, CANCELLED
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Gérer les requêtes OPTIONS pour CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Vérifier la méthode
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

// Récupérer la référence
$reference = $_GET['reference'] ?? null;

if (!$reference) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Paramètre manquant: reference requis'
    ]);
    exit;
}

// Charger les transactions
$transactionsFile = __DIR__ . '/transactions.json';

if (!file_exists($transactionsFile)) {
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'message' => 'Aucune transaction trouvée'
    ]);
    exit;
}

$transactions = json_decode(file_get_contents($transactionsFile), true) ?? [];

// Rechercher la transaction
$transaction = null;
foreach ($transactions as $t) {
    if ($t['reference'] === $reference) {
        $transaction = $t;
        break;
    }
}

if (!$transaction) {
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'message' => 'Transaction non trouvée'
    ]);
    exit;
}

// Réponse succès
echo json_encode([
    'success' => true,
    'transaction' => $transaction,
    'status' => $transaction['status']
]);
