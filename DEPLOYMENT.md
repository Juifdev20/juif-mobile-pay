# Guide de Déploiement - Juif Mobile Pay API

Ce guide explique comment déployer votre API de paiement mobile pour qu'elle soit accessible par d'autres développeurs.

---

## 🚀 Option 1: ngrok (Gratuit - Pour Tests Rapides)

**Avantages :**
- Gratuit
- Instantané
- Pas besoin de configuration complexe

**Inconvénients :**
- URL change à chaque redémarrage
- Temporaire (pas pour production)

### Étapes :

1. **Télécharger ngrok :**
   - Allez sur https://ngrok.com/download
   - Téléchargez la version Windows
   - Extrayez le fichier ZIP

2. **Démarrer votre serveur :**
   ```powershell
   cd c:\Users\dieud\Desktop\exame-ecommerce\mobile-payment-api
   node server.js
   ```

3. **Dans un autre terminal, lancer ngrok :**
   ```powershell
   ngrok http 3000
   ```

4. **Copier l'URL HTTPS fournie par ngrok** (ex: `https://xxxx-xx-xx-xx-xx.ngrok-free.app`)

5. **Partager cette URL avec les développeurs :**
   - Simulateur : `https://votre-url-ngrok/simulateur.html`
   - Documentation : `https://votre-url-ngrok/documentation.html`
   - API Base : `https://votre-url-ngrok/api`

---

## ☁️ Option 2: Render (Gratuit - Pour Production)

**Avantages :**
- Gratuit pour les petits projets
- HTTPS automatique
- Déploiement via GitHub
- URL persistante

**Inconvénients :**
- Limites sur le plan gratuit

### Étapes :

1. **Créer un compte sur Render :**
   - Allez sur https://render.com
   - Inscrivez-vous avec GitHub

2. **Créer un fichier `.gitignore` dans votre projet :**
   ```gitignore
   node_modules/
   transactions.json
   .env
   ```

3. **Modifier `server.js` pour utiliser le port environnement :**
   ```javascript
   const PORT = process.env.PORT || 3000;
   ```

4. **Initialiser Git et pousser sur GitHub :**
   ```powershell
   cd c:\Users\dieud\Desktop\exame-ecommerce\mobile-payment-api
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   # Créez un repo sur GitHub, puis :
   git remote add origin https://github.com/VOTRE_USERNAME/votre-repo.git
   git push -u origin main
   ```

5. **Sur Render :**
   - Cliquez sur "New +"
   - Sélectionnez "Web Service"
   - Connectez votre compte GitHub
   - Sélectionnez votre repository
   - Configurez :
     - **Name**: `juif-mobile-pay-api`
     - **Runtime**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `node server.js`
   - Cliquez sur "Create Web Service"

6. **Render va déployer votre API** et vous donner une URL comme : `https://juif-mobile-pay-api.onrender.com`

---

## 🌐 Option 3: Railway (Gratuit - Pour Production)

**Avantages :**
- Gratuit pour les petits projets
- HTTPS automatique
- Interface simple
- URL persistante

### Étapes :

1. **Créer un compte sur Railway :**
   - Allez sur https://railway.app
   - Inscrivez-vous avec GitHub

2. **Déployer depuis GitHub :**
   - Cliquez sur "New Project"
   - Sélectionnez "Deploy from GitHub repo"
   - Choisissez votre repository
   - Railway détectera automatiquement Node.js
   - Configurez :
     - **Start Command**: `node server.js`
   - Cliquez sur "Deploy"

3. **Railway vous donnera une URL** comme : `https://votre-app.up.railway.app`

---

## 💻 Option 4: DigitalOcean VPS (Payant - Pour Production Sérieuse)

**Avantages :**
- Contrôle total
- Performance élevée
- IP fixe
- Scalable

**Inconvénients :**
- Payant (~$5-10/mois)
- Nécessite des connaissances Linux

### Étapes :

1. **Créer un compte DigitalOcean :**
   - Allez sur https://digitalocean.com
   - Créez un compte

2. **Créer un Droplet (VPS) :**
   - Cliquez sur "Create Droplet"
   - Choisissez Ubuntu 22.04 LTS
   - Plan: Basic ($6/mois)
   - Créez et notez l'IP

3. **Connecter via SSH :**
   ```powershell
   ssh root@VOTRE_IP
   ```

4. **Installer Node.js :**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

5. **Cloner votre projet :**
   ```bash
   git clone https://github.com/VOTRE_USERNAME/votre-repo.git
   cd votre-repo
   npm install
   ```

6. **Installer PM2 (pour garder le serveur actif) :**
   ```bash
   sudo npm install -g pm2
   pm2 start server.js --name "mobile-pay-api"
   pm2 startup
   pm2 save
   ```

7. **Installer Nginx (reverse proxy) :**
   ```bash
   sudo apt install nginx
   sudo nano /etc/nginx/sites-available/default
   ```

8. **Configurer Nginx :**
   ```nginx
   server {
       listen 80;
       server_name votre-domaine.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

9. **Redémarrer Nginx :**
   ```bash
   sudo systemctl restart nginx
   ```

10. **Configurer HTTPS avec Certbot :**
    ```bash
    sudo apt install certbot python3-certbot-nginx
    sudo certbot --nginx -d votre-domaine.com
    ```

---

## 🔧 Configuration Importante

### Modifier l'URL de base dans les fichiers

Après déploiement, modifiez les URL dans vos fichiers :

**Dans `simulateur.html` et `documentation.html` :**
- Remplacez `https://votre-domaine.com` par votre URL de déploiement

**Dans `integration.js` (si utilisé par d'autres) :**
```javascript
const apiBaseUrl = 'https://votre-domaine.com/api';
```

---

## 📊 Recommandation

**Pour débuter et tester :**
- Utilisez **ngrok** (gratuit et instantané)

**Pour production légère :**
- Utilisez **Render** ou **Railway** (gratuit)

**Pour production sérieuse :**
- Utilisez **DigitalOcean VPS** (payant mais performant)

---

## 🤝 Partager avec les développeurs

Une fois déployé, partagez avec les développeurs :

1. **URL de la documentation :**
   ```
   https://votre-domaine.com/documentation.html
   ```

2. **URL de base de l'API :**
   ```
   https://votre-domaine.com/api
   ```

3. **Informations de contact :**
   - Développeur : DIEUDONNE MERCI JEAN
   - Téléphone : +243 828 497 218
   - Université : UCBC - L3 Informatique de Gestion

---

## 🔐 Sécurité (Pour Production)

Avant de déployer en production, ajoutez :

1. **Authentification par clé API :**
   ```javascript
   const API_KEYS = ['votre-cle-secrete'];
   
   app.use((req, res, next) => {
       const apiKey = req.headers['x-api-key'];
       if (!apiKey || !API_KEYS.includes(apiKey)) {
           return res.status(401).json({ success: false, message: 'Non autorisé' });
       }
       next();
   });
   ```

2. **Rate limiting :**
   ```bash
   npm install express-rate-limit
   ```

3. **Validation des entrées** (déjà implémenté)

4. **HTTPS obligatoire** (automatique sur Render/Railway/DigitalOcean)

---

## 📞 Support

Pour toute question sur le déploiement :
- Contactez DIEUDONNE MERCI JEAN
- Téléphone : +243 828 497 218
