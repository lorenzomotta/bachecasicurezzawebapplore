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

    if (!action) {
      return jsonOutput({ successo: false, errore: 'Parametro "action" mancante' });
    }

    if (action === 'cerca') {
      var codiceDipendente = (params.codiceDipendente || '').toString().trim();
      if (!codiceDipendente) {
        return jsonOutput({ successo: false, errore: 'Parametro "codiceDipendente" mancante', risultati: [], tipo: '' });
      }
      var result = cercaPublicazioni('', codiceDipendente);
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

function cercaPublicazioni(codiceDitta, codiceDipendente) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var risultati = [];
    var tipo = '';

    // Ricerca per IDDIPENDENTE (colonna A)
    if (codiceDipendente && codiceDipendente.trim() !== '') {
      var foglio = ss.getSheetByName('PUBBLICAZIONI DIPENDENTE');
      if (!foglio) throw new Error('Foglio "PUBBLICAZIONI DIPENDENTE" non trovato');

      var dati = foglio.getDataRange().getValues();
      if (dati[0].length < 14) throw new Error('Il foglio deve avere almeno 14 colonne (A-N)');

      for (var i = 1; i < dati.length; i++) {
        if ((dati[i][0] || '').toString().trim() === codiceDipendente.toString().trim()) {
          var stato = dati[i][12] || '';
          risultati.push({
            idPubblicazione: dati[i][2],
            ditta: dati[i][3] || '',
            nominativo: dati[i][5] || '',
            titolo: dati[i][9] || '',
            versione: dati[i][10] || '',
            link: dati[i][11] || '',
            stato: stato,
            lettura: dati[i][13] || '',
            isLetto: stato.toString().toLowerCase().startsWith('letto')
          });
        }
      }
      tipo = 'dipendente';
    }

    return {
      successo: true,
      risultati: risultati,
      tipo: tipo,
      messaggio: risultati.length > 0 ? 'Trovati ' + risultati.length + ' risultati' : 'Nessun risultato trovato'
    };

  } catch (error) {
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
      { nome: 'PUBBLICAZIONI DITTE', colStato: 10 },    // K
      { nome: 'PUBBLICAZIONI DIPENDENTE', colStato: 12 } // M
    ];

    for (var idx = 0; idx < fogli.length; idx++) {
      var def = fogli[idx];
      var foglio = ss.getSheetByName(def.nome);
      if (!foglio) continue;

      var dati = foglio.getDataRange().getValues();
      for (var i = 1; i < dati.length; i++) {
        var cellValue = dati[i][2]; // Colonna C = IDPUBBLICAZIONE
        if (cellValue && cellValue.toString().trim() === idPubblicazione.toString().trim()) {
          var statoAttuale = dati[i][def.colStato] || '';
          if (statoAttuale.toString().toLowerCase().startsWith('letto')) {
            return { successo: false, errore: 'Già marcato come letto', nuovoStato: statoAttuale };
          }
          foglio.getRange(i + 1, def.colStato + 1).setValue(nuovoStato);
          return { successo: true, messaggio: 'Stato aggiornato a: ' + nuovoStato, nuovoStato: nuovoStato };
        }
      }
    }

    return { successo: false, errore: 'IDPUBBLICAZIONE non trovata' };
  } catch (error) {
    return { successo: false, errore: error.message };
  }
}


