# Scheduler - EjLog (Java) e React WebApp

Documento tecnico sintetico sul funzionamento dello scheduler nel core EjLog
e nella webapp React. Tutti i riferimenti sono tratti dal codice del progetto.

## 1) EjLog (Java) - Task Scheduler

### 1.1 Modulo principale
- File: `C:\F_WMS\EjLog\Wmsbase2\src\com\promag\wms\base\system\modules\WmsTaskSchedulerModule.java`
- Scopo: avvia e gestisce Quartz per le schedulazioni salvate a DB.
- Componenti chiave:
  - Quartz `Scheduler` (configurato da `WMS_TASK_SCHEDULER_QUARTZ`).
  - Lista `schedulerIds` letta da `scheduler.ids` (`WMS_TASK_SCHEDULER`).
  - Thread `checkStatusThread` che periodicamente:
    - carica le `Schedulazione` per gli `idSchedulatore` configurati;
    - abilita/disabilita i job in base allo stato DB;
    - scrive `messaggioErrore` se un job fallisce in setup.

### 1.2 Attivazione/Disattivazione
- `abilitaSchedulazione(Schedulazione s)`
  - crea `JobDetail` e `Trigger` e lo registra in Quartz.
- `disabilitaSchedulazione(Schedulazione s)`
  - rimuove il job da Quartz se presente.
- `forceSchedulazioneOneShot(...)`
  - esegue una schedulazione a richiesta, con trigger "one shot".
- `forceSchedulazioneAfterDelay(...)`
  - esecuzione one-shot ritardata con `DelayedOneShotTrigger`.

### 1.3 Stato e progress
- `runningSchedulazioni` e `runningJobs` tengono traccia dei job correnti.
- Progress e messaggi via `jobProgress(...)`.
- Quartz listener:
  - `jobToBeExecuted(...)` aggiunge job/schedulazione in running.
  - `jobWasExecuted(...)` rimuove dalle strutture di running.

### 1.4 Logica "schedulabile"
- `isSchedulazioneSchedulabile(...)` filtra job "HOST" se `ARG_NO_HOST`.
- `ARG_NO_SCHEDULER` disattiva completamente il modulo.

### 1.5 Prenotatore (Java)
- File: `C:\F_WMS\EjLog\Wmsbase2\src\com\promag\wms\base\system\modules\WmsPrenotatoreModule.java`
- Scopo: gestisce la prenotazione liste e la comunicazione con client.
- Componenti:
  - `MainProcessor` + `MessageFetcher/Dispatcher`.
  - Server TCP (porte configurabili, default 7072/7073).
  - `ListActivator` per aree automatiche.
  - Job periodici su `WmsQuartzSchedulerModule` (es. `VerificaTrasloInAllarmeJob`).

### 1.6 Dati di riferimento
- Tabella `Schedulazione` (job Quartz persistiti a DB).
- Tabella `Prenotazioni` (stato prenotazioni liste).
- Tabella `Liste` (liste operative e loro stati).

## 2) React WebApp - Scheduler Service (Node) + UI

La webapp ha due layer:
- backend Node su porta 3077 (api-server.js),
- frontend React su 3000/3001.

### 2.1 Backend Node: servizio scheduler
- File: `server/scheduler/scheduler.service.js`
- Replica il prenotatore in modalita "fetcher/processor".
- Concetti:
  - `Fetcher`: legge le liste da DB e le mette in coda (PriorityQueue).
  - `Processor`: N worker che prenotano le liste con `PrenotatoreRegistry`.
  - `stats`: contatori e timestamp (fetch/process).
- Query usata dal fetcher:
  - seleziona liste non terminate, con data lancio valorizzata.
  - priorita basata su `idTipoLista` (1=alta, 2=media, 3+=bassa).

### 2.2 Backend Node: API di stato
- File: `server/routes/scheduler-status.js`
- Endpoint principali:
  - `GET /api/scheduler-status`
    - legge `Schedulazione` e crea summary (total/active/running/errors).
    - `prenotazioni` aggregate sulle ultime 24h.
  - `GET /api/scheduler-status/prenotazioni`
    - stats per tipo lista (7 giorni).
  - `POST /api/scheduler-status/enable/:id`
  - `POST /api/scheduler-status/disable/:id`
  - `POST /api/scheduler-status/clear-error/:id`
  - `GET /api/scheduler-status/liste`

### 2.3 Backend Node: API di controllo runtime
- File: `server/routes/scheduler.js`
- Endpoint su `SchedulerService`:
  - `GET /api/scheduler/status`
  - `GET /api/scheduler/queue`
  - `GET /api/scheduler/clients`
  - `POST /api/scheduler/fetcher/start|pause|resume|force-cycle`
  - `POST /api/scheduler/processor/start|pause|resume|force-cycle`
  - `POST /api/scheduler/force-cycle`

### 2.4 Frontend React: pagina Scheduler Settings
- File: `src/pages/SchedulerSettingsReal.tsx`
- Route: `/scheduler-settings` (vedi `src/App.tsx`).
- Funzioni:
  - carica lo stato con `GET /api/scheduler-status`
  - carica prenotazioni con `GET /api/scheduler-status/prenotazioni`
  - mostra 4 card (Schedulazioni, Attive, Prenotazioni, Errori)
  - auto refresh ogni 5s
  - tab "Schedulazioni" e "Prenotazioni"
  - tab "Terminale" con WebSocket su `ws://<host>:3077/ws`

### 2.5 Tipi e API client
- Tipi: `src/types/scheduler.ts`
  - `Schedulazione`, `SchedulerStatus`, `SchedulerSummary`.
- Client: `src/api/scheduler.ts`
  - usa `VITE_API_URL` (default `http://localhost:3077`).
  - espone funzioni CRUD e azioni.

## 3) Flusso dati reale (in breve)

1) Scheduler Java:
   - Quartz legge `Schedulazione` e pianifica job.
   - Thread status aggiorna abilitazioni/stato errori.
2) Prenotatore Java:
   - Processa le liste e crea prenotazioni.
3) Backend Node:
   - legge DB e espone stato/summary a React.
4) React:
   - polling 5s + WebSocket per eventi realtime.

## 3.1 Diagramma di flusso (alto livello)

```
            +----------------------------+
            |         Database           |
            | Schedulazione / Liste /    |
            | Prenotazioni               |
            +--------------+-------------+
                           |
          (Quartz jobs)    |   (Liste/Prenotazioni)
                           v
+------------------+    +-------------------------+
| EjLog Java        |    | Node API (3077)         |
| WmsTaskScheduler  |    | scheduler-status,       |
| WmsPrenotatore    |    | scheduler-service       |
+---------+---------+    +-----------+-------------+
          |                          |
          | WebSocket events         | REST /api/*
          v                          v
     +----+------------------------------+
     |         React WebApp              |
     | /scheduler-settings (poll + WS)   |
     +-----------------------------------+
```

## 3.2 Database (tabelle e campi rilevanti)

### 3.2.1 `Schedulazione`
- Origine: `server/routes/scheduler-status.js`
- Campi usati:
  - `id`, `gruppo`, `nome`, `classe`, `idSchedulatore`
  - `abilitata`, `stopped`
  - `intervallo`, `cronExpression`
  - `parametri`
  - `messaggioErrore`, `tentativiInErrore`, `maxTentativiInErrore`
  - `dataUltimaEsecuzione`, `dataProssimaEsecuzione`
  - `durataUltimaEsecuzione`, `gruppoEsecuzione`
- Derivati summary:
  - `active` = `abilitata && !stopped`
  - `running` = `abilitata && !stopped && messaggioErrore == null`
  - `errors` = `messaggioErrore != null`

### 3.2.2 `Prenotazioni`
- Origine:
  - summary 24h in `GET /api/scheduler-status`
  - breakdown 7 giorni in `GET /api/scheduler-status/prenotazioni`
- Campi usati:
  - `abilitata`, `dataCreazione`
  - join con `Liste`, `TipiLista`, `StatiLista`, `StatiRigaLista`

### 3.2.3 `Liste`
- Origine: `server/scheduler/scheduler.service.js` (Fetcher)
- Filtri principali:
  - `terminata = 0`
  - `recordCancellato = 0`
  - `dataLancio IS NOT NULL`
  - `dataPrevistaEvasione <= GETDATE()` o null
- Campi letti:
  - `id`, `numLista`, `idTipoLista`
  - `dataCreazione`, `dataLancio`, `dataPrevistaEvasione`
  - `prenotazioneIncrementale`, `terminata`, `idStatoControlloEvadibilita`

## 5) Troubleshooting rapido

### 5.1 Contatori a zero in React
- Verifica che `GET /api/scheduler-status` risponda `success: true`.
- Se la risposta non contiene `summary`, la UI calcola i contatori dai dati di `schedulazioni`.
- Se `schedulazioni` e `Prenotazioni` sono vuote, i contatori restano a 0.
- Controlla connessione DB e che la tabella `Schedulazione` esista.

### 5.2 Backend Node non parte (porta 3077 occupata)
- Un servizio EjLog o precedente `api-server.js` puo' essere gia' attivo.
- Libera la porta o riutilizza il servizio esistente.

### 5.3 Prenotazioni non aggiornate
- Verifica l'endpoint `GET /api/scheduler-status/prenotazioni`.
- Assicurati che `Prenotazioni` abbia dati recenti (ultimi 7 giorni).

### 5.4 Errori di schedulazione
- Controlla `messaggioErrore` in `Schedulazione`.
- Usa `POST /api/scheduler-status/clear-error/:id` per pulizia.

### 5.5 WebSocket non connesso
- La UI usa `ws://<host>:3077/ws`.
- Verifica che il server WebSocket sia attivo in `server/api-server.js`.

## 4) Dove intervenire per modifiche

- Quartz/Job scheduling (Java):
  - `WmsTaskSchedulerModule.java`
  - `Schedulazione` entity + metodi in `SchedulazioneMethods`.
- Prenotatore (Java):
  - `WmsPrenotatoreModule.java`
  - `MainProcessor` e `ListActivator`.
- API di stato (Node):
  - `server/routes/scheduler-status.js`
- Runtime engine (Node):
  - `server/scheduler/scheduler.service.js`
- UI Scheduler (React):
  - `src/pages/SchedulerSettingsReal.tsx`
  - `src/api/scheduler.ts`

