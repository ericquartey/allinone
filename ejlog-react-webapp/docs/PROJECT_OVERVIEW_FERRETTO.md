# EJLOG WMS - Panorama Progetto (Ferretto Theme)
#
# [Logo Ferretto](../public/ferretto-logo.png)
#
# Copertina
# ---------------------------------------------------------------------------
# EJLOG WMS
# Warehouse Management System per Magazzini Verticali
# Tema: Ferretto (ferretto.com)
# Versione: React WebApp
# ---------------------------------------------------------------------------
# Questo documento descrive in modo semplice cosa fa il software,
# i suoi punti di forza, le integrazioni e le funzioni principali.
#

## Sintesi rapida (cool features)
- Dashboard live con KPI operativi e stato macchine.
- AI Assistant "Sofia" per comandi rapidi su liste, cassetti e giacenze.
- Gestione cassetti con chiamata/estrazione reale e controllo compartimenti.
- Liste operative complete (esecuzione, attesa, completamento).
- Tracciamento giacenze per articolo, UDC e ubicazione.
- Integrazioni ERP/SAP/EDI con test, log e anteprime payload.
- EDI Inbox con import, validazione e creazione ordini reali.
- Tema Ferretto: UI moderna, consistente e orientata all'operatore.

## Cos'e EJLOG WMS
EJLOG WMS e un software per gestire magazzini verticali in modo rapido,
affidabile e guidato. Consente agli operatori di eseguire liste di lavoro,
richiamare cassetti, controllare giacenze e coordinare le missioni in tempo
reale. La versione React WebApp porta un'interfaccia moderna, veloce e
coerente con il tema Ferretto.

## Cosa fa il software
- Gestisce articoli, scorte e ubicazioni con visibilita immediata.
- Coordina missioni e liste operative con stati chiari e azioni rapide.
- Interagisce con macchine e cassetti per chiamata/estrazione.
- Offre un assistente AI per guidare l'operatore con linguaggio naturale.
- Centralizza le integrazioni con ERP, SAP, EDI e altri sistemi esterni.

## Moduli principali
- Dashboard operativa: KPI, volumi, stato macchine, trend.
- Liste e missioni: esecuzione, attesa, completamento, storicita.
- Cassetti e UDC: chiamata, estrazione, compattamento, compartimenti.
- Articoli e giacenze: stock reale, lotti, seriali, ubicazioni.
- Integrazioni: SAP/ERP/EDI/TMS/MES/eCommerce con log e test.

## Flussi operativi tipici
1) Picking: avvio lista -> chiamata cassetto -> prelievo -> chiusura.
2) Refilling: rientro merce -> verifica -> stoccaggio guidato.
3) Inventario: conteggio -> confronto -> rettifica.
4) Urgenze: richiamo rapido cassetto -> missione prioritaria.

## Ruoli e sicurezza
- Profili utente con permessi dedicati (operatore, supervisore, admin).
- Tracciamento azioni e log per audit interno.
- Configurazioni protette per integrazioni e dati sensibili.

## Esperienza utente
- Interfaccia pulita e leggibile per uso in reparto.
- Pulsanti e azioni coerenti per ridurre errori.
- Assistente Sofia sempre disponibile per domande e comandi rapidi.
- Tempi di risposta rapidi anche su dataset estesi.

## Reporting e controllo
- Log sincronizzazioni e risultati (success/fail).
- Errori EDI con suggerimenti di mapping.
- Storico operazioni e performance per area o turno.

## Scalabilita
- Architettura modulare per aggiungere nuove integrazioni.
- Configurazioni centralizzate, facili da replicare.
- Pronta per evolvere su nuove macchine o plant multipli.

## Punti di forza
1) Semplicita operativa: azioni chiare, pochi click, risposte immediate.
2) Velocita: ricerca rapida, pagine reattive, dati aggiornati.
3) Affidabilita: log delle operazioni e delle integrazioni.
4) Scalabilita: configurazioni modulari e integrazioni estendibili.
5) Esperienza Ferretto: UI coerente, professionale, adatta a reparto.

## Tema Ferretto (ferretto.com)
L'interfaccia adotta una linea visiva pulita, professionale e funzionale:
- Layout ordinato e leggibile per ambienti industriali.
- Contrasto e gerarchie visive pensati per uso prolungato.
- Componenti coerenti per ridurre errori operativi.
- Stile moderno ma sobrio, in linea con brand e macchine Ferretto.

## Funzioni principali
### Operazioni e liste
- Avvio liste, messa in attesa e completamento.
- Visualizzazione righe lista e stato avanzamento.
- Supporto alle missioni di picking, refilling e inventario.

### Cassetti e ubicazioni
- Chiamata cassetto e gestione compartimenti.
- Vista dettagliata di UDC, cassetti e ubicazioni.
- Associazione articoli a cassetti e posizioni reali.

### Articoli e giacenze
- Dettaglio articolo con quantita e ubicazioni.
- Giacenza reale per UDC, cassetto e locazione.
- Ricerca veloce per codice, descrizione o barcode.

### AI Assistant "Sofia"
- Comandi in linguaggio naturale per liste e giacenze.
- Supporto all'operatore con risposte semplici e immediate.
- Accesso ai dati reali della pagina (articoli, cassetti, UDC).

### Integrazioni
- SAP: OData, IDoc, RFC e file (SFTP).
- ERP: REST, SOAP, OData, EDI/AS2.
- EDI: gestione 832/846/850/855/856/940/945.
- TMS/MES/eCommerce: configurazioni dedicate e test.

## Integrazioni in dettaglio
### SAP
- Configurazione OData con test metadata.
- Mapping chiavi articoli/ubicazioni/lotto.
- Invio payload per items/stock/orders con formati SAP.

### ERP
- Modalita REST/SOAP/OData e EDI/AS2.
- Test connessione e suggerimenti OData.
- Mapping articoli esterni -> articoli WMS.

### EDI
- EDI Inbox per import e controllo messaggi.
- Applicazione automatica con creazione ordini.
- Log errori e suggerimenti mapping da scarti.

## API e integrazioni (panoramica)
- API principali WMS: `items`, `stock`, `lists`, `operations`, `drawers`, `udc`.
- AI: chat assistente, azioni su liste, stato, giacenze e cassetti.
- Integrazioni: `SAP`, `ERP`, `EDI/AS2`, `MES`, `TMS`, `eCommerce`.
- Integrazioni configurate con test, log, anteprima payload e sync reale.

## Mappa architettura (diagramma)
```
                         +-----------------------------+
                         |        ERP / SAP / EDI      |
                         |   OData • REST • EDI/AS2    |
                         +--------------+--------------+
                                        |
                                        | Sync / Test / Logs
                                        v
 +---------------------+      +-------------------------------+
 |   Operatore (UI)    |      |   Integrazioni API (/api)     |
 |  Dashboard / Liste  +----->+  config • preview • sync • log |
 |  Cassetti / UDC     |      +-------------------------------+
 |  Articoli / Stock   |                 |
 +----------+----------+                 |
            |                            v
            |                    +------------------+
            |                    |   Database WMS   |
            |                    | Articoli, Liste, |
            |                    | UDC, Log, EDI    |
            |                    +------------------+
            |
            v
 +---------------------+
 |  AI Assistant Sofia |
 |  Comandi & dati real|
 +---------------------+
```

## Inserimenti (dati principali)
- Articoli: creati e aggiornati da UI o integrazioni.
- Liste: create da EDI o operatori; righe lista con articoli reali.
- UDC/Cassetti: aggiornati da flussi operativi e missioni.
- Log integrazioni: sincronizzazioni, errori e audit applicazioni EDI.

## Scenari d'uso consigliati
- Avvio turno: verifica dashboard, macchine, code liste.
- Carico materiale: stoccaggio guidato con riduzione errori.
- Prelievo urgente: richiamo rapido cassetto e missione veloce.
- Allineamento ERP: sincronizzazione programmata con test esiti.

## Valore per il cliente
- Riduzione tempi operativi e errori manuali.
- Visibilita completa su stock e missioni.
- Integrazione semplice con sistemi aziendali.
- Esperienza d'uso coerente con ambiente Ferretto.

## Prossimi sviluppi suggeriti
- Reportistica avanzata su KPI e performance per turno.
- Miglioramenti AI con suggerimenti proattivi.
- Workflow guidati per training nuovi operatori.
