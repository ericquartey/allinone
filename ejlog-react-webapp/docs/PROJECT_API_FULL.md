# EJLOG WMS - PROJECT API FULL DOCUMENT

Questo documento elenca tutte le API backend, adapter, legacy e le funzioni principali del progetto React.

## 1) Porte e servizi

- Frontend React: http://localhost:3000
- Backend HTTP: http://localhost:3077
- Backend HTTPS: https://localhost:3079
- Legacy HTTP: http://localhost:7077 -> 3077
- Legacy HTTPS: https://localhost:7079 -> 3079
- Adapter MAS .NET: http://localhost:10000
- Adapter Node standalone: http://localhost:10001

## 2) Base API

- HTTP base: http://localhost:3077/api
- HTTPS base: https://localhost:3079/api
- Legacy base: http://localhost:7077/api (proxy)
- Legacy EjLogHostVertimag: http://localhost:3077/EjLogHostVertimag

## 3) Funzioni operative principali (Sofia)

# EJLOG WMS - AI ASSISTANT GUIDE (SOFIA)

Questo documento descrive in modo completo le funzioni principali, le API, e le azioni operative supportate dall'assistente AI Sofia.
Usalo come base di conoscenza per rispondere a richieste su cassetti, liste, articoli, UDC e stato macchine.

## 1) Panoramica sistemi e porte

- Frontend React: http://localhost:3000
- Backend HTTP: http://localhost:3077
- Backend HTTPS: https://localhost:3079
- Adapter esterno .NET MAS: http://localhost:10000
- Adapter interno Node.js (standalone): http://localhost:10001
- Legacy proxy HTTP: http://localhost:7077 -> http://localhost:3077
- Legacy proxy HTTPS: https://localhost:7079 -> https://localhost:3079

## 2) API principali (backend Node)

Base: http://localhost:3077/api

Sezioni principali:
- /api/ai/* : chat AI e troubleshooting
- /api/ai-config/* : configurazione AI e API keys
- /api/adapter/* : adapter integrato Node
- /api/lists/* : liste, esecuzione, terminate, waiting, ecc.
- /api/udc/* : UDC e cassetti
- /api/items/* : articoli
- /api/stock/* : giacenze e inventario
- /api/locations/* : ubicazioni
- /api/machines/* : macchine
- /api/operations/* : operazioni
- /api/missions/* : missioni
- /api/ptl/* : PTL
- /api/scheduler/* : scheduler

Legacy (compat):
- /EjLogHostVertimag/* su 3077 (o 7077 via proxy)

## 3) Azioni AI (comandi operativi)

Formato: [ACTION:TYPE|param=value]

Azioni supportate:
- FIND_ARTICLE (articleCode o articleDescription)
- FIND_DRAWER (drawerCode)
- GET_DRAWER_STATUS (drawerCode)
- OPEN_DRAWER (drawerCode)
- CLOSE_DRAWER (drawerCode)
- RETURN_TO_CELL (drawerCode)
- GET_MACHINE_STATUS (machineId)
- GET_COMPARTMENT_INFO (drawerCode, compartmentId)
- SEARCH_PRODUCT (searchTerm)

Esempi:
- "Stato cassetto UDC-042" -> [ACTION:GET_DRAWER_STATUS|drawerCode=UDC-042]
- "Apri cassetto UDC-042" -> [ACTION:OPEN_DRAWER|drawerCode=UDC-042]
- "Macchina MS-100" -> [ACTION:GET_MACHINE_STATUS|machineId=MS-100]
- "Articolo ABC123" -> [ACTION:FIND_ARTICLE|articleCode=ABC123]

## 4) Cassetti / UDC / Baia

Obiettivi tipici:
- capire dove si trova un cassetto
- vedere compartimenti e giacenze
- aprire/chiudere/riportare in cella

Come chiedere:
- "Mostrami il cassetto UDC-042"
- "Stato cassetto UDC-042"
- "Apri cassetto UDC-042"
- "Riporta in cella il cassetto UDC-042"

Risposte attese:
- Codice UDC, stato, macchina, numero compartimenti
- Elenco compartimenti con articolo, descrizione e percentuale

## 5) Liste: vedere, avviare, stoppare

Endpoint principali:
- GET /api/lists
- GET /api/lists/:listNumber
- PUT /api/lists/:id/book (prenota)
- PUT /api/lists/:id/execute (esegui)
- PUT /api/lists/:listNumber/waiting (metti in attesa)
- POST /api/lists/:id/terminate (termina)
- POST /api/lists/:id/revive (riattiva)

Esempi operativi:
- "Metti in esecuzione la lista 1023"
- "Ferma la lista 1023"
- "Riattiva la lista 1023"

Nota:
Lo stato lista e l'id possono essere diversi dal numero lista. Se serve, chiedere conferma o cercare per numero.

## 6) Articoli e compartimenti

Obiettivi:
- trovare un articolo
- vedere dove e in quale cassetto/compartimento

Endpoint:
- GET /api/items
- GET /api/stock
- GET /api/locations

Esempi:
- "Trova articolo ABC123"
- "Dove si trova l'articolo ABC123"
- "Mostra compartimenti del cassetto UDC-042"

## 7) Macchine

Endpoint:
- GET /api/machines

Esempi:
- "Stato macchina MS-100"
- "Quanti cassetti ha MS-100"

## 8) Errori e troubleshooting

Quando l'utente segnala un errore:
- chiedere il codice errore
- verificare stato macchina e cassetti
- proporre passi base (reset, ostacoli, sensori)

Esempi:
- "Errore E001": chiedere dove si presenta e su quale macchina

## 9) Adapter e PPC

Adapter esterno:
- http://localhost:10000

Adapter interno:
- http://localhost:10001

React usa:
- /api/adapter per integrato
- /api/mas-adapter per MAS .NET

## 10) Comportamento AI consigliato

- Risposte brevi e operative.
- Se mancano dati: una sola domanda mirata.
- Se e richiesto un comando: usa [ACTION:...].
- Se possibile: riportare dati DB (stato, quantita, lista, compartimenti).

## 11) Esempi conversazionali

Utente: "Cassetto UDC-042 in baia, dammi compartimenti e giacenza"
AI: [ACTION:GET_DRAWER_STATUS|drawerCode=UDC-042] + risposta con compartimenti

Utente: "Metti in esecuzione la lista 1234"
AI: chiede id lista se non chiaro, oppure esegue /api/lists/:id/execute

Utente: "Trova l'articolo ABC123"
AI: [ACTION:FIND_ARTICLE|articleCode=ABC123]

## 4) Elenco completo API (router routes)

## 3.1) Terminologia tecnica e contesto (verticale/cassetti)

Termini chiave:
- VLM (Vertical Lift Module): magazzino verticale a cassetti.
- Cassetto / UDC: Unita di carico che viene portata in baia.
- Baia: punto di prelievo in cui l'operatore lavora sul cassetto.
- Compartimento: suddivisione interna del cassetto dove risiede un articolo.
- Giacenza: quantita disponibile in compartimento o articolo.
- Macchina MS-xxx: modulo verticale specifico.

Indicazioni per Sofia:
- Se l'utente dice "cassetto in baia", collegare la richiesta a UDC e stato macchina.
- Se chiede "compartimenti", fornire elenco compartimenti + articolo + percentuale.
- Se chiede "riporta in cella", usare RETURN_TO_CELL.
- Se chiede "apri/chiudi", usare OPEN_DRAWER/CLOSE_DRAWER.

Esempi:
- "Cassetto 42 in baia, mostra giacenze" -> GET_DRAWER_STATUS + riepilogo giacenza.
- "Riporta in cella UDC-042" -> RETURN_TO_CELL.
- "Articolo ABC123: in quale compartimento?" -> FIND_ARTICLE.

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\adapter-routes.js
- GET /version
- GET /items
- GET /items/:id
- GET /items/bar-code/:code
- POST /items/:id/pick
- POST /items/:id/put
- POST /items/:id/check
- GET /items/:id/is-handled-by-lot
- GET /items/:id/is-handled-by-serial-number
- GET /items/:id/is-handled-by-expire-date
- PUT /items/:itemId/average-weight
- POST /items/print-item
- GET /item-lists
- GET /item-lists/:id
- GET /item-lists/:id/num
- GET /item-lists/:id/rows
- POST /item-lists/:id/execute
- POST /item-lists/execute-num
- POST /item-lists/:id/suspend
- POST /item-lists/:id/terminate
- GET /areas
- GET /areas/:id
- GET /compartments
- GET /compartments/:id
- GET /machines
- GET /machines/:id
- PUT /machines/:id/status
- GET /loading-units
- GET /loading-units/:id
- POST /loading-units
- GET /users
- POST /users/authenticate
- POST /users/authenticate-token
- GET /barcodes/rules
- GET /barcodes/rules/:id
- GET /printers
- GET /printers/:id
- POST /images/upload
- GET /images/:filename
- GET /put-to-light
- POST /put-to-light
- GET /products
- GET /products/:id
- GET /mission-operations
- PUT /mission-operations/:id/status
- GET /destination-groups
- GET /destination-groups/:id
- GET /debug/database
- POST /debug/reset

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\ai-assistant.js
- POST /chat
- GET /context
- POST /command
- GET /suggestions
- POST /troubleshoot

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\ai-config.js
- GET /
- POST /api-key
- POST /test
- PUT /settings

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\analytics.js
- GET /picking
- GET /summary
- GET /export/excel

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\audit-log.js
- GET /
- GET /:id
- POST /
- GET /stats/summary
- DELETE /cleanup

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\auth-enhanced.js
- POST /login
- POST /logout
- POST /verify
- GET /password-hint

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\auth-refresh.js
- POST /refresh
- POST /logout
- GET /revoked-count

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\auth.js
- POST /login
- POST /logout
- GET /check
- GET /password-hint

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\barcode-rules.js
- GET /rules
- GET /rules/:id
- POST /rules
- PUT /rules/:id
- DELETE /rules/:id
- POST /parse
- POST /validate

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\barcode-scanner.js
- POST /scan
- GET /history
- POST /validate

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\compartments.js
- GET /loading-units/:id/compartments
- POST /loading-units/:id/compartments
- GET /:id
- PUT /:id
- DELETE /:id

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\custom-reports.js
- GET /
- GET /categories
- GET /:id
- POST /
- PUT /:id
- DELETE /:id
- POST /:id/execute
- POST /execute-custom

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\dashboard-config.js
- GET /config/:userId
- PUT /config/:userId
- DELETE /config/:userId

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\data-export-import.js
- POST /export
- POST /import
- GET /jobs
- GET /jobs/:id
- GET /templates/:entity

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\destination-groups.js
- GET /
- GET /:id

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\events.js
- GET /
- GET /stats
- GET /:id

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\groups.js
- GET /
- GET /:id
- POST /
- PUT /:id
- DELETE /:id

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\item-lists-enhanced.js
- GET /
- GET /:id
- POST /
- PUT /:id
- GET /:id/dependencies
- DELETE /all
- DELETE /:id
- POST /:id/execute
- POST /:id/pause
- POST /:id/resume
- POST /:id/complete
- POST /:id/cancel
- POST /:id/copy
- GET /:id/items
- POST /:id/items
- PUT /:listId/items/:itemId
- DELETE /:listId/items/:itemId
- GET /:id/history

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\item-lists.js
- GET /next-number/:type
- GET /stats
- GET /
- GET /:code/num
- GET /:id
- GET /:id/items
- PUT /:id
- POST /
- POST /:id/rows
- POST /:id/reserve
- POST /:id/rereserve
- POST /:id/waiting

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\items.js
- GET /debug/count
- GET /
- GET /:id
- POST /
- PUT /:id
- DELETE /:id
- GET /:id/stock
- GET /:id/images

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\lists-safe.js
- POST /

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\lists.js
- GET /
- GET /destination-groups
- GET /ptl/container-types
- POST /priority
- POST /destination
- POST /sequence
- POST /reactivate-rows
- POST /:id/revive
- POST /ptl/enable
- POST /ptl/disable
- POST /ptl/reset
- POST /ptl/resend
- POST /ptl/container-type
- POST /merge
- POST /:id/unprocessable
- POST /:id/save-as-template
- GET /:id/logs
- POST /delete-all
- GET /:listNumber
- PUT /:listNumber/waiting
- POST /:id/terminate
- PUT /:id/book
- PUT /:id/execute
- POST /:id/duplicate
- GET /:id/operations/warehouse
- GET /:id/operations/area
- GET /:id/reservations
- GET /:id/movements
- POST /item-lists
- POST /item-lists/:listId/rows
- POST /:id/reserve
- POST /:id/rereserve
- POST /:id/waiting

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\loading-units-new.js
- GET /
- GET /:id
- POST /
- PUT /:id
- DELETE /:id
- GET /:id/compartments
- POST /:id/compartments

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\loading-units.js
- GET /
- GET /:id
- GET /:id/compartments

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\locations.js
- GET /
- GET /:id
- GET /:id/udcs
- POST /:id/block
- POST /:id/unblock
- GET /:id/movements
- GET /:id/statistics

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\login-history.js
- GET /
- GET /stats
- POST /
- DELETE /old

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\machines.js
- GET /
- GET /:id

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\menu.js
- GET /
- GET /all
- GET /permissions

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\missions.js
- GET /
- GET /stats
- GET /active
- GET /completed
- GET /by-type/:type
- GET /:id
- GET /queue/list
- GET /history/list
- GET /statistics/summary
- POST /
- PUT /:id/abort
- DELETE /queue/:id

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\notifications.js
- GET /
- GET /unread-count
- PUT /:id/read
- PUT /mark-all-read
- GET /preferences/:userId
- PUT /preferences/:userId

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\operations.js
- GET /
- GET /:id
- GET /:id/aggregate
- GET /by-params
- POST /:id/execute
- POST /:id/complete
- POST /:id/suspend
- POST /send-id
- GET /reasons
- GET /available-orders
- GET /extra-combo
- POST /
- DELETE /:id

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\ppc-installation.js
- GET /ip-manager
- PUT /ip-manager
- GET /devices
- GET /bay-device-io/:bayNumber
- GET /cells
- GET /cells/heights
- GET /calibration/vertical-offset
- POST /calibration/vertical-offset
- GET /calibration/horizontal-offset
- GET /calibration/weight
- GET /trajectories/:type
- PUT /trajectories/:type
- GET /sensors
- GET /sensors/status
- GET /parameters
- PUT /parameters
- GET /warehouse
- GET /sensitive-alarm
- PUT /sensitive-alarm
- GET /machine/barcode
- GET /machine/serial-number
- GET /machine/passwords
- GET /accessories/:type

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\ptl-config.js
- GET /
- PUT /
- GET /:category
- POST /reset
- GET /export/json
- POST /import

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\ptl.js
- GET /devices
- GET /devices/:id
- POST /devices
- POST /light-up
- POST /confirm
- POST /cancel
- GET /events
- POST /ping
- GET /stats

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\report-scheduler.js
- GET /schedules
- GET /schedules/:id
- POST /schedules
- PUT /schedules/:id
- DELETE /schedules/:id
- POST /schedules/:id/execute
- GET /executions/:scheduleId

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\scheduler-config.js
- GET /
- PUT /
- POST /reset
- GET /export/json

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\scheduler-logics.js
- GET /
- PUT /
- PUT /batch
- POST /refresh

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\scheduler-management.js
- GET /status
- GET /summary
- GET /
- GET /:id
- POST /
- PATCH /:id
- DELETE /:id
- POST /:id/execute
- POST /:id/enable
- POST /:id/disable
- POST /:id/interrupt
- POST /:id/clear-error
- POST /batch/enable
- GET /scheduler-ids
- GET /health

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\scheduler-status.js
- GET /
- GET /prenotazioni
- GET /errors
- POST /enable/:id
- POST /disable/:id
- POST /clear-error/:id
- GET /liste

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\scheduler.js
- GET /status
- GET /queue
- GET /clients
- POST /fetcher/start
- POST /fetcher/pause
- POST /fetcher/resume
- POST /fetcher/force-cycle
- POST /processor/start
- POST /processor/pause
- POST /processor/resume
- POST /processor/force-cycle
- POST /force-cycle
- GET /coordinator/status
- GET /coordinator/instances
- GET /locks
- POST /coordinator/cleanup-heartbeats
- POST /locks/cleanup

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\stock-movements.js
- GET /
- GET /:id
- GET /item/:itemId

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\stock.js
- GET /
- GET /Movements

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\udc.js
- GET /
- GET /:id
- GET /:id/compartments
- POST /:id/move
- POST /:id/items
- DELETE /:udcId/items/:itemId
- POST /:id/sort

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\user-management.js
- GET /
- GET /:id
- POST /
- PUT /:id
- DELETE /:id
- GET /roles/list
- POST /:id/reset-password

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\user-stats.js
- GET /:userId
- GET /:userId/performance

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\users.js
- GET /
- GET /search
- GET /:id
- POST /
- PUT /:id
- PUT /:id/password
- DELETE /:id

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\routes\warehouses.js
- GET /
- GET /types
- GET /statuses
- GET /:id
- POST /
- PUT /:id
- DELETE /:id
- POST /:id/associate-area
- POST /:id/enable
- POST /:id/disable
- POST /:id/format-descriptions
- POST /:id/udc-renumber
- POST /:id/udc-terra

## 5) Elenco completo API (app endpoints)

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\adapter-server.js
- GET /health
- GET /api/adapter/config
- PUT /api/adapter/config
- GET /api/adapter/status
- POST /api/adapter/test

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\adapter-standalone.js
- GET /health
- GET /health/live
- GET /health/ready
- GET /api/network-info
- GET /api/version

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\api-server.js
- GET /
- GET /swagger-ui.html
- GET /health
- GET /websocket/stats
- GET /debug/tables

### C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp\server\api-server-https.js
- GET /
- GET /swagger-ui.html
- GET /health
- GET /ready
- GET /websocket/stats
- GET /debug/udc-structure
- GET /debug/logoperazioni-structure
- GET /debug/missionitraslo-structure
- GET /debug/missionitraslobuffer-structure
- GET /debug/logmissioni-structure
- GET /debug/missions-overview
- GET /debug/tables
