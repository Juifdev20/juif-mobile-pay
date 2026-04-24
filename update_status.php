<?php
/**
 * Mobile Payment API - Update Transaction Status
 * Met à jour le statut d'une transaction (simule l'action de l'utilisateur sur son téléphone)
 * 
 * Méthode: POST ou GET
 * Paramètres:
 *   - reference: Référence de la transaction
 *   - status: Nouveau statut (SUCCESS ou CANCELLED)
 * 
 * Réponse JSON:
 *   - success: true/false
 *   - message: Message de confirmation
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Gérer les requêtes OPTIONS pour CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Récupérer les données (POST ou GET)
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST ?? $_GET;
}

$reference = $input['reference'] ?? null;
$status = $input['status'] ?? null;

if (!$reference || !$status) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Paramètres manquants: reference et status requis'
    ]);
    exit;
}

// Valider le statut
$validStatuses = ['SUCCESS', 'CANCELLED'];
if (!in_array(strtoupper($status), $validStatuses)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Statut invalide. Statuts disponibles: SUCCESS, CANCELLED'
    ]);
    exit;
}

$status = strtoupper($status);

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

// Rechercher et mettre à jour la transaction
$found = false;
foreach ($transactions as &$t) {
    if ($t['reference'] === $reference) {
        $t['status'] = $status;
        $t['updated_at'] = date('Y-m-d H:i:s');
        $found = true;
        break;
    }
}

if (!$found) {
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'message' => 'Transaction non trouvée'
    ]);
    exit;
}

// Sauvegarder les modifications
file_put_contents($transactionsFile, json_encode($transactions, JSON_PRETTY_PRINT));

// Réponse succès
echo json_encode([
    'success' => true,
    'message' => 'Statut mis à jour avec succès',
    'reference' => $reference,
    'status' => $status
]);
