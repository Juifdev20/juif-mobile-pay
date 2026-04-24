# Simulateur d'API de Paiement Mobile - RDC

Simulateur d'API de paiement mobile pour l'environnement de développement local en République Démocratique du Congo. Supporte M-Pesa, Airtel Money et Orange Money.

## 🎯 Objectif

Permettre aux développeurs de tester les paiements mobiles sans utiliser de vrais fonds ni dépendre des serveurs de production des opérateurs.

## 📋 Prérequis

- PHP 7.4 ou supérieur
- Serveur web (Apache, Nginx) ou serveur PHP intégré
- Navigateur web moderne

## 🚀 Installation

### 1. Cloner ou placer le dossier

Placez le dossier `mobile-payment-api` dans votre projet web :

```
exame-ecommerce/
├── mobile-payment-api/
│   ├── initiate_pay.php
│   ├── check_request.php
│   ├── update_status.php
│   ├── simulateur.html
│   ├── integration.js
│   ├── transactions.json
│   └── README.md
├── index.html
├── Boutique.html
└── ...
```

### 2. Lancer le serveur PHP

Depuis le dossier racine de votre projet :

```bash
php -S localhost:8000
```

Ou depuis le dossier `mobile-payment-api` :

```bash
cd mobile-payment-api
php -S localhost:8000
```

### 3. Accéder au simulateur

Ouvrez votre navigateur et accédez à :

```
http://localhost:8000/mobile-payment-api/simulateur.html
```

## 📁 Structure du Projet

```
mobile-payment-api/
├── initiate_pay.php      # API: Initialiser un paiement
├── check_request.php     # API: Vérifier le statut
├── update_status.php     # API: Mettre à jour le statut
├── simulateur.html      # Frontend: Simulateur mobile
├── integration.js        # Client: Bibliothèque d'intégration
├── transactions.json     # Base de données simulée
└── README.md            # Documentation
```

## 🔌 API Endpoints

### 1. Initialiser un paiement

**Endpoint:** `POST /initiate_pay.php`

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
    "created_at": "2024-04-24 10:30:15",
    "updated_at": "2024-04-24 10:30:15"
  }
}
```

### 2. Vérifier le statut

**Endpoint:** `GET /check_request.php?reference={reference}`

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
    "created_at": "2024-04-24 10:30:15",
    "updated_at": "2024-04-24 10:30:15"
  },
  "status": "waiting"
}
```

### 3. Mettre à jour le statut

**Endpoint:** `POST /update_status.php`

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

## 🔄 Flux de Données

```
┌─────────────┐
│   Client    │
│  (Site Web) │
└──────┬──────┘
       │ 1. initiate_pay.php
       │    {amount, phone, service}
       ▼
┌─────────────┐
│    API      │
│  (Backend)  │
└──────┬──────┘
       │ 2. Stocke transaction
       │    status: "waiting"
       ▼
┌─────────────┐
│ Simulateur  │
│  (Mobile)   │
└──────┬──────┘
       │ 3. Polling (toutes les 2s)
       │    check_request.php
       ▼
┌─────────────┐
│    API      │
│  (Backend)  │
└──────┬──────┘
       │ 4. Retourne status
       ▼
┌─────────────┐
│ Simulateur  │
│  (Mobile)   │
└──────┬──────┘
       │ 5. Utilisateur clique
       │    "Accepter" ou "Annuler"
       ▼
┌─────────────┐
│    API      │
│  (Backend)  │
└──────┬──────┘
       │ 6. update_status.php
       │    status: "SUCCESS" ou "CANCELLED"
       ▼
┌─────────────┐
│   Client    │
│  (Site Web) │
└─────────────┘
       │ 7. Polling détecte le changement
       │    Callback onSuccess ou onCancel
```

## 💻 Intégration Client

### 1. Inclure la bibliothèque

```html
<script src="mobile-payment-api/integration.js"></script>
```

### 2. Initialiser le paiement

```javascript
// Configuration
const payment = new MobilePayment('http://localhost:8000/mobile-payment-api', {
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

1. **Ouvrir le simulateur** : `http://localhost:8000/mobile-payment-api/simulateur.html`

2. **Sélectionner le service** : M-Pesa, Airtel Money ou Orange Money

3. **Initier un paiement** depuis votre site web

4. **Le simulateur détecte automatiquement** la transaction (polling toutes les 2 secondes)

5. **Popup USSD s'affiche** avec les détails de la transaction

6. **Cliquez sur "Accepter" ou "Annuler"** pour simuler l'action de l'utilisateur

7. **Le statut est mis à jour** et votre site web reçoit la notification

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

L'API est configurée pour accepter les requêtes cross-origin :

```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
```

## 🌐 Passage en Production

Pour passer du mode simulateur au mode production :

1. **Modifier l'URL de base** dans votre code :

```javascript
// Mode développement (simulateur)
const payment = new MobilePayment('http://localhost:8000/mobile-payment-api');

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

### Test manuel avec cURL

```bash
# 1. Initialiser un paiement
curl -X POST http://localhost:8000/mobile-payment-api/initiate_pay.php \
  -H "Content-Type: application/json" \
  -d '{"amount":5000,"phone":"+243999000000","service":"mpesa"}'

# 2. Vérifier le statut
curl http://localhost:8000/mobile-payment-api/check_request.php?reference=MPESA_20240424103015_abc12345

# 3. Mettre à jour le statut
curl -X POST http://localhost:8000/mobile-payment-api/update_status.php \
  -H "Content-Type: application/json" \
  -d '{"reference":"MPESA_20240424103015_abc12345","status":"SUCCESS"}'
```

## 🐛 Dépannage

### Le simulateur ne détecte pas les transactions

- Vérifiez que le serveur PHP est en cours d'exécution
- Vérifiez que l'URL de l'API est correcte
- Ouvrez la console du navigateur pour voir les erreurs

### Erreur CORS

- Vérifiez que les headers CORS sont corrects dans les fichiers PHP
- Essayez d'utiliser le même port pour le site web et l'API

### Le fichier transactions.json ne se crée pas

- Vérifiez les permissions d'écriture du dossier
- Créez manuellement le fichier avec `[]` comme contenu

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
