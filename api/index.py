from flask import Flask, render_template, request, jsonify
from google.oauth2 import service_account
from googleapiclient.discovery import build
from google.cloud import storage
import os
import json
from datetime import datetime

app = Flask(__name__, template_folder='..')

# Configurazione Google Sheets API
SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

# Per Vercel, usa le variabili d'ambiente invece del file credentials.json
def get_sheets_service():
    """Crea il servizio per Google Sheets API"""
    try:
        # Controlla se siamo su Vercel (variabili d'ambiente) o locale (file)
        if os.environ.get('GOOGLE_CREDENTIALS'):
            # Su Vercel: usa le variabili d'ambiente
            credentials_info = json.loads(os.environ.get('GOOGLE_CREDENTIALS'))
            credentials = service_account.Credentials.from_service_account_info(
                credentials_info, scopes=SCOPES)
        else:
            # Locale: usa il file credentials.json
            SERVICE_ACCOUNT_FILE = '../credentials.json'
            credentials = service_account.Credentials.from_service_account_file(
                SERVICE_ACCOUNT_FILE, scopes=SCOPES)
        
        service = build('sheets', 'v4', credentials=credentials)
        return service
    except Exception as e:
        print(f"Errore nell'autenticazione: {e}")
        return None

# Configurazione Google Sheets - AGGIORNA QUESTI VALORI
SPREADSHEET_ID = '17t0lwJlczuxDrLFcM8kBqA3vYeBED89fir9TjiHDNI8'  # ID del tuo foglio "FILE PROVE DI GESTIONE"
SHEET_NAME = 'PUBBLICAZIONI DIPENDENTE'  # Nome del foglio per le pubblicazioni dipendenti

# Configurazione Google Cloud Storage - AGGIORNA QUESTO VALORE
BUCKET_NAME = 'YOUR_BUCKET_NAME_HERE'  # Nome del tuo bucket Cloud Storage

def get_storage_client():
    """Crea il client per Google Cloud Storage"""
    try:
        # Controlla se siamo su Vercel (variabili d'ambiente) o locale (file)
        if os.environ.get('GOOGLE_CREDENTIALS'):
            # Su Vercel: usa le variabili d'ambiente
            credentials_info = json.loads(os.environ.get('GOOGLE_CREDENTIALS'))
            storage_client = storage.Client.from_service_account_info(credentials_info)
        else:
            # Locale: usa il file credentials.json
            SERVICE_ACCOUNT_FILE = '../credentials.json'
            storage_client = storage.Client.from_service_account_json(SERVICE_ACCOUNT_FILE)
        
        return storage_client
    except Exception as e:
        print(f"Errore nel client storage: {e}")
        return None

def cerca_in_sheets(codice_dipendente):
    """Cerca pubblicazioni nel foglio Google Sheets"""
    try:
        service = get_sheets_service()
        if not service:
            print("❌ Errore: Service account non disponibile")
            return []
        
        # Range di ricerca (tutte le colonne A-K)
        range_name = f'{SHEET_NAME}!A:K'
        print(f"🔍 Ricerca nel range: {range_name}")
        print(f"🔍 Codice dipendente cercato: {codice_dipendente}")
        
        # Ottieni i dati dal foglio
        result = service.spreadsheets().values().get(
            spreadsheetId=SPREADSHEET_ID,
            range=range_name
        ).execute()
        
        values = result.get('values', [])
        
        if not values:
            print("❌ Errore: Nessun dato trovato nel foglio")
            return []
        
        # Processa i risultati
        risultati = []
        print(f"📊 Righe totali nel foglio: {len(values)}")
        
        for i, row in enumerate(values[1:], start=1):  # Salta l'intestazione
            # Assicurati che la riga abbia abbastanza colonne
            while len(row) < 11:
                row.append('')
            
            print(f"🔍 Controllo riga {i}: IDDIPENDENTE={row[0]}, cerca={codice_dipendente}")
            
            # Verifica se il codice dipendente corrisponde (colonna A)
            if row[0] and str(row[0]).strip() == str(codice_dipendente).strip():
                print(f"✅ Match trovato! Creo risultato per riga {i}")
                risultato = {
                    'idPubblicazione': row[9],  # IDPUBBLICAZIONE in colonna J (indice 9)
                    'nominativo': row[2],        # NOMINATIVO in colonna C (indice 2)
                    'titolo': row[3],            # TITOLO in colonna D (indice 3)
                    'versione': row[4],          # VERSIONE in colonna E (indice 4)
                    'link': row[5],              # LINK PUBBLICATO in colonna F (indice 5)
                    'stato': row[6],             # STATO in colonna G (indice 6)
                    'dataCreazione': row[7]      # DATA CREAZIONE in colonna H (indice 7)
                }
                print(f"📝 Risultato creato: {risultato}")
                risultati.append(risultato)
        
        print(f"🎯 Risultati trovati: {len(risultati)}")
        return risultati
        
    except Exception as e:
        print(f"❌ Errore nella ricerca su Sheets: {e}")
        return []

def aggiorna_stato_sheets(id_pubblicazione, nuovo_stato):
    """Aggiorna lo stato di lettura nel foglio Google Sheets"""
    try:
        print(f"🔄 Aggiorno stato per ID pubblicazione: {id_pubblicazione}")
        print(f"🔄 Nuovo stato: {nuovo_stato}")
        
        service = get_sheets_service()
        if not service:
            print("❌ Service account non disponibile")
            return False
        
        # Trova la riga con l'ID pubblicazione
        range_name = f'{SHEET_NAME}!A:K'  # Range completo per accedere alla colonna J
        print(f"🔍 Cerco nel range: {range_name}")
        
        result = service.spreadsheets().values().get(
            spreadsheetId=SPREADSHEET_ID,
            range=range_name
        ).execute()
        
        values = result.get('values', [])
        print(f"📊 Righe trovate: {len(values)}")
        
        if not values:
            print("❌ Nessun dato trovato")
            return False
        
        # Cerca la riga con l'ID pubblicazione specifico (colonna J)
        row_index = None
        print(f"🔍 Cerco ID pubblicazione: {id_pubblicazione}")
        
        for i, row in enumerate(values[1:], start=2):  # Inizia da 2 per saltare l'intestazione
            # Assicurati che la riga abbia abbastanza colonne
            while len(row) < 11:
                row.append('')
                
            if len(row) > 9:
                print(f"🔍 Riga {i}: IDPUBBLICAZIONE={row[9]}, cerca={id_pubblicazione}")
                if str(row[9]).strip() == str(id_pubblicazione).strip():  # IDPUBBLICAZIONE in colonna J (indice 9)
                    row_index = i + 1  # +1 perché Sheets è 1-based
                    print(f"✅ Match trovato! Riga {row_index}")
                    break
            else:
                print(f"⚠️ Riga {i} ha solo {len(row)} colonne, salto")
        
        if row_index is None:
            print(f"❌ ID pubblicazione {id_pubblicazione} non trovato")
            return False
        
        # Aggiorna la colonna Stato (G)
        range_update = f'{SHEET_NAME}!G{row_index}'
        print(f"📝 Aggiorno colonna G, riga {row_index}: {range_update}")
        
        body = {
            'values': [[nuovo_stato]]
        }
        
        print(f"📤 Invio aggiornamento: {body}")
        
        service.spreadsheets().values().update(
            spreadsheetId=SPREADSHEET_ID,
            range=range_update,
            valueInputOption='RAW',
            body=body
        ).execute()
        
        print(f"✅ Stato aggiornato con successo!")
        return True
        
    except Exception as e:
        print(f"Errore nell'aggiornamento su Sheets: {e}")
        return False

def list_sheets():
    """Lista tutti i fogli disponibili nel documento"""
    try:
        service = get_sheets_service()
        if not service:
            print("❌ Errore: Service account non disponibile")
            return []
        
        # Ottieni metadati del documento
        result = service.spreadsheets().get(
            spreadsheetId=SPREADSHEET_ID
        ).execute()
        
        sheets = result.get('sheets', [])
        print(f"📋 Fogli disponibili nel documento:")
        for sheet in sheets:
            sheet_name = sheet['properties']['title']
            print(f"   - {sheet_name}")
        
        return [sheet['properties']['title'] for sheet in sheets]
        
    except Exception as e:
        print(f"❌ Errore nel listare i fogli: {e}")
        return []

@app.route('/api/sheets', methods=['GET'])
def get_sheets():
    """API per listare i fogli disponibili"""
    try:
        sheets = list_sheets()
        return jsonify({
            'successo': True,
            'fogli': sheets
        })
    except Exception as e:
        return jsonify({
            'successo': False,
            'errore': str(e)
        }), 500

@app.route('/')
def index():
    """Pagina principale dell'applicazione"""
    return render_template('index.html')

@app.route('/api/cerca', methods=['POST'])
def cerca_pubblicazioni():
    """API per cercare pubblicazioni"""
    try:
        print("🚀 API /api/cerca chiamata!")
        data = request.get_json()
        print(f"📥 Dati ricevuti: {data}")
        
        codice_dipendente = data.get('codiceDipendente', '').strip()
        print(f"🔍 Codice dipendente estratto: '{codice_dipendente}'")
        
        if not codice_dipendente:
            print("❌ Codice dipendente mancante")
            return jsonify({
                'successo': False,
                'errore': 'Codice dipendente richiesto'
            }), 400
        
        print("✅ Codice dipendente valido, chiamo cerca_in_sheets...")
        # Ricerca nel foglio Google Sheets
        risultati = cerca_in_sheets(codice_dipendente)
        print(f"📊 Risultati restituiti da cerca_in_sheets: {risultati}")
        
        if risultati:
            print(f"✅ Trovati {len(risultati)} risultati")
            return jsonify({
                'successo': True,
                'risultati': risultati,
                'tipo': 'dipendente',
                'messaggio': f'Trovate {len(risultati)} pubblicazioni'
            })
        else:
            print("❌ Nessun risultato trovato")
            return jsonify({
                'successo': True,
                'risultati': [],
                'tipo': 'dipendente',
                'messaggio': 'Nessuna pubblicazione trovata per questo codice'
            })
        
    except Exception as e:
        print(f"💥 Errore nella route /api/cerca: {e}")
        return jsonify({
            'successo': False,
            'errore': str(e)
        }), 500

@app.route('/api/aggiorna-stato', methods=['POST'])
def aggiorna_stato_letto():
    """API per aggiornare lo stato di lettura"""
    try:
        data = request.get_json()
        id_pubblicazione = data.get('idPubblicazione')
        
        if not id_pubblicazione:
            return jsonify({
                'successo': False,
                'errore': 'ID pubblicazione richiesto'
            }), 400
        
        # Aggiorna stato nel foglio Google Sheets
        nuovo_stato = f"Letto il {datetime.now().strftime('%d/%m/%Y %H:%M')}"
        
        if aggiorna_stato_sheets(id_pubblicazione, nuovo_stato):
            return jsonify({
                'successo': True,
                'nuovoStato': nuovo_stato,
                'messaggio': 'Stato aggiornato con successo'
            })
        else:
            return jsonify({
                'successo': False,
                'errore': 'Impossibile aggiornare lo stato'
            }), 500
        
    except Exception as e:
        return jsonify({
            'successo': False,
            'errore': str(e)
        }), 500

# Configurazione per Vercel
app.debug = False

# Vercel richiede questo per riconoscere l'app Flask
if __name__ == '__main__':
    app.run()
