# 🚀 LA BACHECA DELLA SICUREZZA - Guida alla Distribuzione

## 📋 **Panoramica**
Webapp per la gestione delle pubblicazioni di sicurezza. Due opzioni di deploy:
- Backend Flask su App Engine (richiede fatturazione)
- Backend Google Apps Script Web App (consigliato, gratuito) + frontend statico

## 🛠️ **Prerequisiti**
- Account Google Cloud Platform (gratuito)
- Python 3.9+ installato
- Google Cloud SDK (opzionale, per il deploy)

## 🔧 **Configurazione Passo-Passo**

### **1. Creazione Progetto Google Cloud**
1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuovo progetto o seleziona uno esistente
3. Abilita le seguenti API:
   - Google Sheets API
   - Google Cloud Storage API
   - Google App Engine API

### **2. Creazione Service Account**
1. Nel menu laterale, vai su "IAM e amministrazione" > "Service Account"
2. Clicca "Crea Service Account"
3. Dai un nome (es: "bacheca-sicurezza")
4. Assegna i ruoli:
   - "Editor" per il progetto
   - "Storage Object Viewer" per Cloud Storage
5. Clicca "Crea e continua"
6. Clicca "Fatto"

### **3. Download Credenziali**
1. Clicca sul service account appena creato
2. Vai alla tab "Chiavi"
3. Clicca "Aggiungi chiave" > "Crea nuova chiave"
4. Seleziona "JSON"
5. Scarica il file e rinominalo `credentials.json`
6. **IMPORTANTE**: Metti questo file nella cartella principale del progetto

### **4. Configurazione Google Sheets**
1. Crea un nuovo Google Sheet
2. Condividi il foglio con l'email del service account (con permessi di modifica)
3. Prendi nota dell'ID del foglio dall'URL
4. Aggiorna `main.py` con l'ID del foglio

### **5. Configurazione Cloud Storage**
1. Vai su "Cloud Storage" > "Bucket"
2. Crea un nuovo bucket
3. Aggiorna `BUCKET_NAME` in `main.py`

## 🚀 **Installazione e Test Locale**

### **1. Installazione Dipendenze**
```bash
pip install -r requirements.txt
```

### **2. Test Locale**
```bash
python main.py
```
L'app sarà disponibile su: http://localhost:9999

## ☁️ **Opzione A - Deploy su Google App Engine (Flask)**

### **1. Installazione Google Cloud SDK**
Scarica e installa da: https://cloud.google.com/sdk/docs/install

### **2. Login e Configurazione**
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### **3. Deploy**
```bash
gcloud app deploy
```

### **4. Accesso Online**
L'app sarà disponibile su: `https://YOUR_PROJECT_ID.appspot.com`

## 📊 **Struttura Google Sheets**

Il tuo foglio deve avere queste colonne:
- **A**: ID Pubblicazione
- **B**: Ditta
- **C**: Nominativo
- **D**: Titolo
- **E**: Versione
- **F**: Link
- **G**: Stato
- **H**: Data Creazione

## 🔒 **Sicurezza**
- Le credenziali sono nel file `credentials.json`
- **NON committare mai questo file su Git**
- Aggiungi `credentials.json` al tuo `.gitignore`

## 🆘 **Risoluzione Problemi**

### **Errore "Service Account non autorizzato"**
- Verifica che il service account abbia accesso al foglio
- Controlla i permessi del progetto

### **Errore "API non abilitata"**
- Vai su "API e servizi" > "Dashboard"
- Abilita Google Sheets API e Cloud Storage API

### **Errore "Credenziali non valide"**
- Verifica che `credentials.json` sia nella cartella corretta
- Controlla che il file non sia corrotto

## 📞 **Supporto**
Per problemi tecnici, controlla:
1. I log di Google Cloud Console
2. La console del browser per errori JavaScript
3. I log dell'applicazione per errori Python

## 🎯 **Prossimi Passi**
- Aggiungere autenticazione utenti
- Implementare notifiche email
- Creare dashboard amministrativa
- Aggiungere statistiche di lettura

---

**Buona fortuna con la tua webapp! 🎉**

---

## ✅ Opzione B - Backend Google Apps Script (gratuito) + Frontend statico

### 1) Creazione progetto Apps Script
1. Apri lo Sheet sorgente
2. Estensioni → Apps Script
3. Crea file `Code.gs` e incolla il contenuto di `gas/Code.gs`

### 2) Impostazioni Web App
1. Distribuisci → Distribuisci come applicazione Web
2. Esegui l'app come: Me
3. Chi ha accesso: Chiunque (o Chiunque con link)
4. Copia l'URL finale che termina con `/exec`

### 3) Configura il frontend
1. Apri `index.html`
2. Inserisci l'URL della Web App al posto di `INSERISCI_URL_WEB_APP_EXEC`
3. Pubblica il file su hosting statico (GitHub Pages, Netlify, ecc.)

### 4) CORS e richieste
- Le chiamate avvengono via `POST` con `application/x-www-form-urlencoded`, evitando preflight complessi

### 5) Aggiornamenti
- Per modifiche allo script, incrementa la versione della distribuzione Web App e aggiorna l'URL se necessario
