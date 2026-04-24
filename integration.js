/**
 * Mobile Payment API - Client Integration
 * Bibliothèque JavaScript pour intégrer les paiements mobiles (M-Pesa, Airtel Money, Orange Money)
 * 
 * Usage (Node.js):
 *   const payment = new MobilePayment('http://localhost:3000/mobile-payment-api/api');
 *   payment.initiate(5000, '+243999000000', 'mpesa', {
 *       onSuccess: (ref) => console.log('Paiement réussi:', ref),
 *       onCancel: () => console.log('Paiement annulé'),
 *       onError: (err) => console.error('Erreur:', err)
 *   });
 */

class MobilePayment {
    /**
     * @param {string} apiBaseUrl - URL de base de l'API (ex: http://localhost:3000/mobile-payment-api/api)
     * @param {object} options - Options de configuration
     */
    constructor(apiBaseUrl, options = {}) {
        this.apiBaseUrl = apiBaseUrl.replace(/\/$/, '');
        this.pollingInterval = options.pollingInterval || 2000; // 2 secondes par défaut
        this.maxPollingAttempts = options.maxPollingAttempts || 60; // 2 minutes max
        this.currentReference = null;
        this.pollingTimer = null;
        this.pollingAttempts = 0;
    }

    /**
     * Initie un paiement mobile
     * @param {number} amount - Montant du paiement
     * @param {string} phone - Numéro de téléphone
     * @param {string} service - Service de paiement (mpesa, airtel, orange)
     * @param {object} callbacks - Callbacks (onSuccess, onCancel, onError, onWaiting)
     */
    async initiate(amount, phone, service, callbacks = {}) {
        try {
            // Valider les paramètres
            if (!amount || !phone || !service) {
                throw new Error('Paramètres manquants: amount, phone, service requis');
            }

            // Appeler l'API d'initialisation
            const response = await fetch(`${this.apiBaseUrl}/initiate_pay`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: amount,
                    phone: phone,
                    service: service
                })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Erreur lors de l\'initialisation');
            }

            // Stocker la référence
            this.currentReference = data.reference;

            // Callback de succès initial
            if (callbacks.onWaiting) {
                callbacks.onWaiting(data.reference, data.transaction);
            }

            // Démarrer le polling pour vérifier le statut
            this.startPolling(callbacks);

            return data;

        } catch (error) {
            if (callbacks.onError) {
                callbacks.onError(error);
            }
            throw error;
        }
    }

    /**
     * Vérifie le statut d'une transaction
     * @param {string} reference - Référence de la transaction
     * @returns {Promise<object>} - Statut de la transaction
     */
    async checkStatus(reference) {
        try {
            const response = await fetch(
                `${this.apiBaseUrl}/check_request?reference=${reference}`
            );
            const data = await response.json();
            return data;
        } catch (error) {
            throw new Error('Erreur lors de la vérification du statut');
        }
    }

    /**
     * Démarre le polling pour vérifier le statut
     * @param {object} callbacks - Callbacks (onSuccess, onCancel, onError)
     */
    startPolling(callbacks) {
        this.pollingAttempts = 0;

        const poll = async () => {
            this.pollingAttempts++;

            if (this.pollingAttempts > this.maxPollingAttempts) {
                this.stopPolling();
                if (callbacks.onError) {
                    callbacks.onError(new Error('Délai d\'attente dépassé'));
                }
                return;
            }

            try {
                const data = await this.checkStatus(this.currentReference);

                if (!data.success) {
                    this.stopPolling();
                    if (callbacks.onError) {
                        callbacks.onError(new Error('Transaction non trouvée'));
                    }
                    return;
                }

                const status = data.transaction.status;

                if (status === 'SUCCESS') {
                    this.stopPolling();
                    if (callbacks.onSuccess) {
                        callbacks.onSuccess(data.transaction);
                    }
                } else if (status === 'CANCELLED') {
                    this.stopPolling();
                    if (callbacks.onCancel) {
                        callbacks.onCancel(data.transaction);
                    }
                } else {
                    // Continue polling - statut waiting
                    if (callbacks.onPolling) {
                        callbacks.onPolling(data.transaction);
                    }
                }

            } catch (error) {
                this.stopPolling();
                if (callbacks.onError) {
                    callbacks.onError(error);
                }
            }
        };

        // Premier appel immédiat
        poll();

        // Polling régulier
        this.pollingTimer = setInterval(poll, this.pollingInterval);
    }

    /**
     * Arrête le polling
     */
    stopPolling() {
        if (this.pollingTimer) {
            clearInterval(this.pollingTimer);
            this.pollingTimer = null;
        }
    }

    /**
     * Annule le paiement en cours
     */
    cancel() {
        this.stopPolling();
        this.currentReference = null;
    }
}

// Export pour utilisation dans différents environnements
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobilePayment;
}

// Exemple d'utilisation (commenté)
/*
// Configuration (Node.js)
const payment = new MobilePayment('http://localhost:3000/mobile-payment-api/api', {
    pollingInterval: 2000,      // Vérifier toutes les 2 secondes
    maxPollingAttempts: 60     // Maximum 60 tentatives (2 minutes)
});

// Initier un paiement
payment.initiate(
    5000,                      // Montant: 5000 FC
    '+243999000000',           // Téléphone
    'mpesa',                   // Service: M-Pesa
    {
        onWaiting: (reference, transaction) => {
            console.log('Transaction en attente:', reference);
            // Afficher un message à l'utilisateur
            // "Veuillez confirmer le paiement sur votre téléphone"
        },
        onPolling: (transaction) => {
            console.log('Vérification du statut...');
            // Optionnel: Afficher un indicateur de chargement
        },
        onSuccess: (transaction) => {
            console.log('Paiement réussi!', transaction);
            // Rediriger l'utilisateur ou afficher un message de succès
            // window.location.href = '/confirmation.html';
        },
        onCancel: (transaction) => {
            console.log('Paiement annulé', transaction);
            // Afficher un message d'annulation
            // "Le paiement a été annulé"
        },
        onError: (error) => {
            console.error('Erreur de paiement:', error);
            // Afficher un message d'erreur
            // "Une erreur s'est produite"
        }
    }
);
*/
