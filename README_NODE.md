# Simulateur d'API de Paiement Mobile - RDC (Node.js)

Simulateur d'API de paiement mobile pour l'environnement de développement local en République Démocratique du Congo. Supporte M-Pesa, Airtel Money et Orange Money.

## 🎯 Objectif

Permettre aux développeurs de tester les paiements mobiles sans utiliser de vrais fonds ni dépendre des serveurs de production des opérateurs.

## 📋 Prérequis

- Node.js 14 ou supérieur
- npm (inclus avec Node.js)
- Navigateur web moderne

## 🚀 Installation

### 1. Installer les dépendances

```bash
cd mobile-payment-api
npm install
```

### 2. Démarrer le serveur

```bash
npm start
```

Le serveur démarrera sur `http://localhost:3000`

### 3. Accéder au simulateur

Ouvrez votre navigateur et accédez à :

```
http://localhost:3000/simulateur.html
```

## 📁 Structure du Projet

```
mobile-payment-api/
├── server.js              # Serveur Node.js avec Express
├── package.json           # Dépendances npm
├── simulateur.html        # Frontend: Simulateur mobile
├── integration.js         # Client: Bibliothèque d'intégration
├── transactions.json      # Base de données simulée
└── README_NODE.md         # Documentation Node.js
```

## 🔌 API Endpoints

### 1. Initialiser un paiement

**Endpoint:** `POST /api/initiate_pay`

**Paramètres:**
```json
{
  "amount": 5000,
  "phone": "+243999000000",
  "service": "mpesa"
}
```

**Réponse:**
```json
{
  "success": true,
  "reference": "MPESA_20240424103015_abc12345",
  "message": "Transaction initiée avec succès",
  "transaction": {
    "reference": "MPESA_20240424103015_abc12345",
    "amount": 5000,
    "phone": "+243999000000",
    "service": "mpesa",
    "status": "waiting",
    "created_at": "2024-04-24T10:30:15.000Z",
    "updated_at": "2024-04-24T10:30:15.000Z"
  }
}
```

### 2. Vérifier le statut

**Endpoint:** `GET /api/check_request?reference={reference}`

**Réponse:**
```json
{
  "success": true,
  "transaction": {
    "reference": "MPESA_20240424103015_abc12345",
    "amount": 5000,
    "phone": "+243999000000",
    "service": "mpesa",
    "status": "waiting",
    "created_at": "2024-04-24T10:30:15.000Z",
    "updated_at": "2024-04-24T10:30:15.000Z"
  },
  "status": "waiting"
}
```

### 3. Récupérer toutes les transactions

**Endpoint:** `GET /api/check_request/all`

**Réponse:**
```json
{
  "success": true,
  "transactions": [...]
}
```

### 4. Mettre à jour le statut

**Endpoint:** `POST /api/update_status`

**Paramètres:**
```json
{
  "reference": "MPESA_20240424103015_abc12345",
  "status": "SUCCESS"
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Statut mis à jour avec succès",
  "reference": "MPESA_20240424103015_abc12345",
  "status": "SUCCESS"
}
```

### 5. Récupérer toutes les transactions

**Endpoint:** `GET /api/transactions`

### 6. Réinitialiser les transactions

**Endpoint:** `DELETE /api/transactions`

## 💻 Intégration Client

### 1. Inclure la bibliothèque

```html
<script src="mobile-payment-api/integration.js"></script>
```

### 2. Initialiser le paiement

```javascript
// Configuration
const payment = new MobilePayment('http://localhost:3000/mobile-payment-api/api', {
    pollingInterval: 2000,      // Vérifier toutes les 2 secondes
    maxPollingAttempts: 60     // Maximum 60 tentatives (2 minutes)
});

// Initier un paiement
payment.initiate(
    5000,                      // Montant: 5000 FC
    '+243999000000',           // Téléphone
    'mpesa',                   // Service: mpesa, airtel, orange
    {
        onWaiting: (reference, transaction) => {
            console.log('Transaction en attente:', reference);
            // Afficher un message à l'utilisateur
            showNotification('Veuillez confirmer le paiement sur votre téléphone');
        },
        onPolling: (transaction) => {
            console.log('Vérification du statut...');
            // Optionnel: Afficher un indicateur de chargement
        },
        onSuccess: (transaction) => {
            console.log('Paiement réussi!', transaction);
            // Rediriger l'utilisateur
            window.location.href = '/Confirmation.html';
        },
        onCancel: (transaction) => {
            console.log('Paiement annulé', transaction);
            // Afficher un message d'annulation
            showNotification('Le paiement a été annulé');
        },
        onError: (error) => {
            console.error('Erreur de paiement:', error);
            // Afficher un message d'erreur
            showNotification('Une erreur s\'est produite');
        }
    }
);
```

### 3. Annuler un paiement en cours

```javascript
payment.cancel();
```

## 📱 Utilisation du Simulateur

1. **Démarrer le serveur** : `npm start`

2. **Ouvrir le simulateur** : `http://localhost:3000/simulateur.html`

3. **Sélectionner le service** : M-Pesa, Airtel Money ou Orange Money

4. **Initier un paiement** depuis votre site web

5. **Le simulateur détecte automatiquement** la transaction (polling toutes les 2 secondes)

6. **Popup USSD s'affiche** avec les détails de la transaction

7. **Cliquez sur "Accepter" ou "Annuler"** pour simuler l'action de l'utilisateur

8. **Le statut est mis à jour** et votre site web reçoit la notification

## 🎨 Services Supportés

| Service | Code | Couleur |
|---------|------|---------|
| M-Pesa | `mpesa` | Vert (#4CAF50) |
| Airtel Money | `airtel` | Rouge (#FF5722) |
| Orange Money | `orange` | Orange (#FF9800) |

## 📊 Statuts de Transaction

| Statut | Description |
|--------|-------------|
| `waiting` | Transaction en attente de confirmation |
| `SUCCESS` | Paiement accepté avec succès |
| `CANCELLED` | Paiement annulé par l'utilisateur |

## 🔒 CORS

L'API est configurée pour accepter les requêtes cross-origin avec le middleware `cors()`.

## 🌐 Passage en Production

Pour passer du mode simulateur au mode production :

1. **Modifier l'URL de base** dans votre code :

```javascript
// Mode développement (simulateur)
const payment = new MobilePayment('http://localhost:3000/mobile-payment-api/api');

// Mode production (API réelle)
const payment = new MobilePayment('https://api.votre-domaine.com/payment');
```

2. **Remplacer les appels API** par les endpoints réels des opérateurs :
   - M-Pesa: https://api.safaricom.co.ke/mpesa/
   - Airtel Money: https://payments.airtel.com/
   - Orange Money: https://api.orange.com/

3. **Implémenter l'authentification** avec les clés API fournies par les opérateurs

4. **Supprimer le simulateur** du code de production

## 🧪 Tests

### Test avec curl

```bash
# 1. Initialiser un paiement
curl -X POST http://localhost:3000/api/initiate_pay \
  -H "Content-Type: application/json" \
  -d '{"amount":5000,"phone":"+243999000000","service":"mpesa"}'

# 2. Vérifier le statut
curl http://localhost:3000/api/check_request?reference=MPESA_20240424103015_abc12345

# 3. Mettre à jour le statut
curl -X POST http://localhost:3000/api/update_status \
  -H "Content-Type: application/json" \
  -d '{"reference":"MPESA_20240424103015_abc12345","status":"SUCCESS"}'
```

## 🐛 Dépannage

### Le serveur ne démarre pas

- Vérifiez que Node.js est installé : `node -v`
- Vérifiez que les dépendances sont installées : `npm install`
- Vérifiez que le port 3000 n'est pas déjà utilisé

### Le simulateur ne détecte pas les transactions

- Vérifiez que le serveur Node.js est en cours d'exécution
- Vérifiez que l'URL de l'API est correcte
- Ouvrez la console du navigateur pour voir les erreurs

### Erreur CORS

- Vérifiez que le middleware cors() est activé dans server.js
- Essayez d'utiliser le même port pour le site web et l'API

## 📝 Notes

- Les transactions sont stockées dans `transactions.json` (base de données simulée)
- Le fichier `transactions.json` est créé automatiquement lors de la première transaction
- Les références de transaction sont uniques et suivent le format : `{SERVICE}_{DATEHEURE}_{HASH}`
- Le simulateur utilise le polling pour détecter les nouvelles transactions
- Le polling s'effectue toutes les 2 secondes par défaut

## 🤝 Contribution

Ce projet est un simulateur pour le développement. Pour les paiements réels, utilisez les API officielles des opérateurs.

## 📄 Licence

Ce projet est fourni tel quel pour usage éducatif et de développement.

## 📞 Support

Pour toute question ou problème, veuillez consulter la documentation ou ouvrir une issue.

---

**Développé pour le marché de la RDC** 🇨🇩
