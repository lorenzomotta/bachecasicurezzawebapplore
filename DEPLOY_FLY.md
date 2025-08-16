# 🚀 Deploy su Fly.io - Istruzioni Complete

## **Prerequisiti**
1. **Account Fly.io**: Vai su [fly.io](https://fly.io) e crea un account gratuito
2. **Fly CLI**: Installa il client Fly.io sul tuo computer

## **Installazione Fly CLI**

### Windows (PowerShell):
```powershell
# Installa con winget
winget install flyctl

# Oppure con Chocolatey
choco install flyctl

# Oppure scarica manualmente da: https://fly.io/docs/hands-on/install-flyctl/
```

### macOS:
```bash
# Con Homebrew
brew install flyctl

# Oppure con curl
curl -L https://fly.io/install.sh | sh
```

### Linux:
```bash
curl -L https://fly.io/install.sh | sh
```

## **Configurazione Iniziale**

1. **Accedi a Fly.io**:
```bash
fly auth login
```

2. **Crea l'app** (solo la prima volta):
```bash
fly apps create gestione-pubblicazioni
```

## **Deploy dell'Applicazione**

1. **Dalla directory del progetto**:
```bash
fly deploy
```

2. **Se è la prima volta, ti chiederà di confermare alcune impostazioni**:
   - Conferma il nome dell'app
   - Conferma la regione (scegli `fra` per Francoforte, più vicina all'Italia)
   - Conferma le altre impostazioni predefinite

## **Configurazione Variabili d'Ambiente**

Dopo il primo deploy, configura le tue credenziali Google:

```bash
fly secrets set GOOGLE_CREDENTIALS='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}'
```

**⚠️ IMPORTANTE**: Sostituisci tutto il contenuto tra apici con le tue credenziali Google reali.

## **Verifica del Deploy**

1. **Controlla lo stato dell'app**:
```bash
fly status
```

2. **Apri l'app nel browser**:
```bash
fly open
```

3. **Controlla i log**:
```bash
fly logs
```

## **Vantaggi di Fly.io**

✅ **Nessuna pausa automatica** - L'app rimane sempre attiva  
✅ **Deploy veloce** - Aggiornamenti in pochi secondi  
✅ **HTTPS automatico** - Certificati SSL gratuiti  
✅ **Scalabilità** - Puoi aumentare le risorse quando serve  
✅ **Piano gratuito generoso** - 3 app gratuite, 3GB storage, 160GB trasferimento  

## **Comandi Utili**

```bash
# Riavvia l'app
fly restart

# Aggiorna l'app dopo modifiche al codice
fly deploy

# Controlla l'uso delle risorse
fly status

# Elimina l'app (se vuoi tornare a Render)
fly apps destroy gestione-pubblicazioni
```

## **Risoluzione Problemi**

### Errore "App not found":
```bash
fly apps create gestione-pubblicazioni
```

### Errore di autenticazione:
```bash
fly auth login
```

### Errore di porta:
Verifica che `fly.toml` abbia `internal_port = 8080`

### Errore di memoria:
Aumenta `memory_mb` in `fly.toml` (es. da 256 a 512)

## **Supporto**

- **Documentazione**: [fly.io/docs](https://fly.io/docs)
- **Community**: [fly.io/community](https://fly.io/community)
- **Status**: [status.fly.io](https://status.fly.io)
