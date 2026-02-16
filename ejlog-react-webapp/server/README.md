# 🚀 EjLog Proxy API Server

Server API locale Node.js/Express che fornisce **dati reali** dal database SQL Server al frontend React.

## 📋 Panoramica

Questo server proxy si connette direttamente al database SQL Server `promag` e espone endpoint REST compatibili con il frontend EjLog React, bypassando temporaneamente il backend Java (porta 3077) che richiede ricompilazione.

### Architettura

```
Frontend React (porta 3001)
    ↓ /api/*
Vite Dev Server Proxy
    ↓
Express API Server (porta 3002)
    ↓
SQL Server (localhost\SQL2019)
    ↓
Database: promag
    ├── Tabella: Utenti
    └── Tabella: GruppiUtenti
```

## 🔧 Installazione Dipendenze

Dalla cartella principale del progetto:

```bash
npm install
```

Questo installerà automaticamente:
- `express` - Web framework
- `cors` - Gestione CORS
- `mssql` - Driver SQL Server per Node.js
- `concurrently` - Esecuzione parallela di più script

## ⚙️ Configurazione Database

Il server si connette al database con le seguenti credenziali (configurate in `server/db-config.js`):

```javascript
{
  user: 'sa',
  password: 'fergrp_2012',
  server: 'localhost\\SQL2019',
  database: 'promag'
}
```

### Tabelle Utilizzate

**Utenti**
- `id` (INT, PK)
- `utente` (NVARCHAR) → mappato su `username`
- `password` (NVARCHAR) → hash MD5
- `idGruppoUtente` (INT, FK) → mappato su `groupId`
- `idLingua` (INT) → mappato su `languageId`
- `barcode` (NVARCHAR)
- `flagLockPpcLogin` (BIT) → mappato su `lockPpcLogin`

**GruppiUtenti**
- `id` (INT, PK)
- `gruppoUtente` (NVARCHAR) → mappato su `name`
- `livello` (INT) → mappato su `level`

## 🚀 Avvio Server

### Opzione 1: Solo API Server

```bash
npm run dev:api
```

Il server API sarà disponibile su: **http://localhost:3002**

### Opzione 2: API + Frontend (RACCOMANDATO)

```bash
npm run dev:all
```

Questo avvia **contemporaneamente**:
- ✅ Express API Server (porta 3002)
- ✅ Vite Dev Server (porta 3001)

### Opzione 3: Solo Frontend (server API già avviato)

```bash
npm run dev
```

## 📡 Endpoint Disponibili

### Health Check

```http
GET http://localhost:3002/health
```

Risposta:
```json
{
  "status": "ok",
  "service": "EjLog Proxy API",
  "timestamp": "2025-11-29T10:30:00.000Z",
  "database": "SQL Server - promag"
}
```

### Gestione Utenti

#### Cerca utenti (con filtri e paginazione)
```http
GET /api/users/search?username=admin&groupId=1&limit=20&offset=0
```

Risposta:
```json
{
  "data": [
    {
      "id": 1,
      "username": "admin",
      "groupId": 1,
      "groupName": "Amministratori",
      "groupLevel": 10,
      "languageId": 1,
      "barcode": "",
      "lockPpcLogin": false
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

#### Ottieni singolo utente
```http
GET /api/users/{id}
```

#### Crea nuovo utente
```http
POST /api/users
Content-Type: application/json

{
  "username": "nuovo.utente",
  "password": "password123",
  "groupId": 2,
  "languageId": 1,
  "barcode": "",
  "lockPpcLogin": false
}
```

**NOTA**: La password viene automaticamente convertita in hash MD5 prima di salvare nel database.

#### Aggiorna utente
```http
PUT /api/users/{id}
Content-Type: application/json

{
  "username": "utente.modificato",
  "groupId": 3,
  "languageId": 1,
  "barcode": "ABC123",
  "lockPpcLogin": true
}
```

#### Aggiorna password
```http
PUT /api/users/{id}/password
Content-Type: application/json

{
  "password": "nuova_password"
}
```

#### Elimina utente
```http
DELETE /api/users/{id}
```

### Gestione Gruppi Utenti

#### Lista tutti i gruppi
```http
GET /api/user-groups
```

Risposta:
```json
[
  {
    "id": 1,
    "name": "Amministratori",
    "level": 10
  },
  {
    "id": 2,
    "name": "Operatori",
    "level": 5
  }
]
```

#### Ottieni singolo gruppo
```http
GET /api/user-groups/{id}
```

#### Crea nuovo gruppo
```http
POST /api/user-groups
Content-Type: application/json

{
  "name": "Supervisori",
  "level": 7
}
```

#### Aggiorna gruppo
```http
PUT /api/user-groups/{id}
Content-Type: application/json

{
  "name": "Super Amministratori",
  "level": 15
}
```

#### Elimina gruppo
```http
DELETE /api/user-groups/{id}
```

**NOTA**: L'eliminazione fallisce se ci sono utenti associati al gruppo.

## 🔐 Sicurezza

### Password Hashing

Le password sono salvate come **hash MD5** nel database per compatibilità con il sistema esistente:

```javascript
const crypto = require('crypto');
const hashedPassword = crypto.createHash('md5').update(password).digest('hex');
```

⚠️ **IMPORTANTE**: MD5 è deprecato per uso di sicurezza moderno. Consigliato passare a bcrypt/argon2 in futuro.

### CORS

Il server accetta richieste da:
- `http://localhost:3001` (frontend Vite)
- `http://localhost:3000` (frontend alternativo)

Configurato in `server/proxy-api.js`:

```javascript
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000'],
  credentials: true
}));
```

## 📂 Struttura File

```
server/
├── proxy-api.js           # Server Express principale
├── db-config.js           # Configurazione SQL Server + pool connessioni
├── routes/
│   ├── users.js           # Route gestione utenti
│   └── groups.js          # Route gestione gruppi
└── README.md              # Questa documentazione
```

## 🐛 Troubleshooting

### Errore: Cannot connect to SQL Server

**Sintomo**:
```
❌ Errore connessione SQL Server: ConnectionError: Failed to connect...
```

**Soluzioni**:
1. Verifica che SQL Server sia in esecuzione
2. Controlla che SQL Server accetti connessioni TCP/IP (SQL Server Configuration Manager)
3. Verifica credenziali in `server/db-config.js`
4. Assicurati che il database `promag` esista

### Errore: EADDRINUSE (porta 3002 già in uso)

**Sintomo**:
```
Error: listen EADDRINUSE: address already in use :::3002
```

**Soluzione**:
```bash
# Windows
netstat -ano | findstr :3002
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3002
kill -9 <PID>
```

### Frontend non riceve dati

**Sintomo**: Network errors nel browser console

**Verifiche**:
1. Controlla che il server API sia avviato su porta 3002
2. Verifica configurazione proxy in `vite.config.js`
3. Guarda i log del server per vedere se le richieste arrivano
4. Apri http://localhost:3002/health nel browser

### Errori SQL

**Sintomo**:
```
RequestError: Invalid column name 'xxx'
```

**Soluzione**: Verifica che le tabelle abbiano le colonne corrette eseguendo:

```sql
-- Verifica struttura tabella Utenti
EXEC sp_help 'Utenti';

-- Verifica struttura tabella GruppiUtenti
EXEC sp_help 'GruppiUtenti';
```

## 🔄 Passaggio al Backend Java

Quando il backend Java su porta 3077 sarà ricompilato e pronto:

1. **Ferma il server API locale**:
   ```bash
   Ctrl+C (nel terminale dove gira npm run dev:api)
   ```

2. **Modifica `vite.config.js`**:
   - Commenta la configurazione proxy locale (porta 3002)
   - Decommenta la configurazione proxy backend Java (porta 3077)

3. **Riavvia solo Vite**:
   ```bash
   npm run dev
   ```

## 📊 Logging

Il server stampa log dettagliati per ogni richiesta:

```
[2025-11-29T10:30:00.000Z] GET /api/users/search
[PROXY-LOCAL] Request: GET /api/users/search?username=admin
[PROXY-LOCAL] Response: 200 /api/users/search?username=admin
```

## 🧪 Testing con cURL

### Cerca utenti
```bash
curl "http://localhost:3002/api/users/search?username=admin"
```

### Crea utente
```bash
curl -X POST http://localhost:3002/api/users \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123","groupId":1}'
```

### Lista gruppi
```bash
curl http://localhost:3002/api/user-groups
```

## 📝 Note Importanti

1. **Dati Reali**: Questo server fornisce dati REALI dal database. Fai attenzione durante i test!

2. **Ambiente Development**: Configurato solo per sviluppo locale, NON per produzione.

3. **Connection Pooling**: Il server usa un pool di connessioni per performance ottimali (max 10 connessioni).

4. **Graceful Shutdown**: Il server chiude correttamente le connessioni database quando fermato (Ctrl+C).

5. **Error Handling**: Tutti gli errori SQL vengono catturati e restituiti come JSON con dettagli.

## 🤝 Supporto

Per problemi o domande, contatta il team di sviluppo.

---

**Creato da**: Elio - Senior Full-Stack Architect
**Data**: 2025-11-29
**Versione**: 1.0.0

