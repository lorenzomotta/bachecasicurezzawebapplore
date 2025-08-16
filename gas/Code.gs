// ==========================
// Code.gs - Backend Web App (GAS)
// ==========================

/**
 * Endpoint principale per chiamate da frontend statico (GitHub Pages/Netlify).
 * Attendere richieste POST con Content-Type application/x-www-form-urlencoded
 * e parametro "action" in {"cerca","aggiorna"}.
 */
function doPost(e) {
  try {
    var params = e && e.parameter ? e.parameter : {};
    var action = (params.action || '').toString();
    Logger.log('doPost - Action: ' + action);

    if (!action) {
      return jsonOutput({ successo: false, errore: 'Parametro "action" mancante' });
    }

    if (action === 'cerca') {
      var codiceDipendente = (params.codiceDipendente || '').toString().trim();
      Logger.log('doPost - Codice Dipendente: ' + codiceDipendente);
      if (!codiceDipendente) {
        return jsonOutput({ successo: false, errore: 'Parametro "codiceDipendente" mancante', risultati: [], tipo: '' });
      }
      var result = cercaPublicazioni(codiceDipendente);
      Logger.log('doPost - Result from cercaPublicazioni: ' + JSON.stringify(result));
      return jsonOutput(result);
    }

    if (action === 'aggiorna') {
      var idPubblicazione = (params.idPubblicazione || '').toString().trim();
      if (!idPubblicazione) {
        return jsonOutput({ successo: false, errore: 'Parametro "idPubblicazione" mancante' });
      }
      var upd = aggiornaStatoLetto(idPubblicazione);
      return jsonOutput(upd);
    }

    return jsonOutput({ successo: false, errore: 'Azione non riconosciuta: ' + action });
  } catch (error) {
    return jsonOutput({ successo: false, errore: 'Errore server: ' + error.message });
  }
}

/**
 * (Opzionale) Ping via GET per verificare disponibilità.
 */
function doGet(e) {
  var info = {
    successo: true,
    messaggio: 'OK',
    time: new Date().toISOString()
  };
  return jsonOutput(info);
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==========================
// Logica applicativa riusata
// ==========================

function cercaPublicazioni(codiceDipendente) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var risultati = [];
    var tipo = '';

    Logger.log('cercaPublicazioni - Starting search...');

    // Ricerca per IDDIPENDENTE (colonna A)
    if (codiceDipendente && codiceDipendente.trim() !== '') {
      var foglio = ss.getSheetByName('PUBBLICAZIONI DIPENDENTE'); // NOME FOGLIO CORRETTO: PUBBLICAZIONI DIPENDENTE
      if (!foglio) throw new Error('Foglio "PUBBLICAZIONI DIPENDENTE" non trovato');

      var dati = foglio.getDataRange().getValues();
      // La tua struttura ha 11 colonne (0-10)
      if (dati[0].length < 11) throw new Error('Il foglio PUBBLICAZIONI DIPENDENTE deve avere almeno 11 colonne (A-K)');

      for (var i = 1; i < dati.length; i++) {
        // IDDIPENDENTE è in colonna A (indice 0)
        if ((dati[i][0] || '').toString().trim() === codiceDipendente.toString().trim()) {
          // STATO è in colonna G (indice 6)
          var stato = dati[i][6] || '';
          risultati.push({
            idPubblicazione: dati[i][9], // IDPUBBLICAZIONE in colonna J (indice 9)
            ditta: dati[i][1] || '',      // DITTA in colonna B (indice 1)
            nominativo: dati[i][2] || '', // NOMINATIVO in colonna C (indice 2)
            titolo: dati[i][3] || '',     // TITOLO in colonna D (indice 3)
            versione: dati[i][4] || '',   // VERSIONE in colonna E (indice 4)
            link: dati[i][5] || '',       // LINK PUBBLICATO in colonna F (indice 5)
            stato: stato,
            lettura: stato, // LETTURA (usiamo lo stesso valore di stato per ora)
            isLetto: stato.toString().toLowerCase().startsWith('letto')
          });
        }
      }
      tipo = 'dipendente';
    } else { // Removed the else if for ditta and only keeping for dipendente
        return { successo: false, errore: 'Codice dipendente mancante per la ricerca', risultati: [], tipo: '' };
    }

    Logger.log('cercaPublicazioni - Found results count: ' + risultati.length);

    return {
      successo: true,
      risultati: risultati,
      tipo: tipo,
      messaggio: risultati.length > 0 ? 'Trovati ' + risultati.length + ' risultati' : 'Nessun risultato trovato'
    };

  } catch (error) {
    Logger.log('cercaPublicazioni - Error: ' + error.message);
    return { successo: false, errore: error.message, risultati: [], tipo: '' };
  }
}

function aggiornaStatoLetto(idPubblicazione) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var now = new Date();
    var dataOra = Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
    var nuovoStato = 'letto ' + dataOra;

    var fogli = [
      { nome: 'PUBBLICAZIONI DIPENDENTE', colStato: 6 } // STATO in colonna G (indice 6)
    ];

    // Simplified loop to directly access the only sheet needed
    var def = fogli[0]; // Only one entry now
    var foglio = ss.getSheetByName(def.nome);
    if (!foglio) throw new Error('Foglio "PUBBLICAZIONI DIPENDENTE" non trovato');

    var dati = foglio.getDataRange().getValues();
    for (var i = 1; i < dati.length; i++) {
      // IDPUBBLICAZIONE è in colonna J (indice 9)
      var cellValue = dati[i][9]; 
      if (cellValue && cellValue.toString().trim() === idPubblicazione.toString().trim()) {
        var statoAttuale = dati[i][def.colStato] || '';
        if (statoAttuale.toString().toLowerCase().startsWith('letto')) {
          return { successo: false, errore: 'Già marcato come letto', nuovoStato: statoAttuale };
        }
        foglio.getRange(i + 1, def.colStato + 1).setValue(nuovoStato);
        return { successo: true, messaggio: 'Stato aggiornato a: ' + nuovoStato, nuovoStato: nuovoStato };
      }
    }

    return { successo: false, errore: 'IDPUBBLICAZIONE non trovata' };
  } catch (error) {
    return { successo: false, errore: error.message };
  }
}


