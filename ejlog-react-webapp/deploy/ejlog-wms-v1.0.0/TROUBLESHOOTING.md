# 🔧 TROUBLESHOOTING - EjLog WMS

## 🚨 PROBLEMA: Browser non carica nulla (pagina bianca)

### ✅ SOLUZIONE RAPIDA

1. **Esegui lo script di debug**:
   ```
   start-production-debug.bat
   ```

2. **Attendi 15-20 secondi** dopo che si apre il browser

3. **Premi F5** per ricaricare la pagina

4. **Apri la Console del Browser** (premere F12)
   - Vai sulla tab "Console"
   - Cerca errori in rosso
   - Se vedi errori, leggi sotto per la soluzione

---

## 📋 CHECKLIST DIAGNOSTICA

### ✔️ STEP 1: Verifica finestre CMD aperte

Dopo aver eseguito `start-production.bat` o `start-production-debug.bat`, dovresti vedere **2 finestre CMD**:

1. **Finestra GIALLA** = Backend (porta 3077)
2. **Finestra VERDE** = Frontend (porta 3000)

**Se manca una delle due finestre:**
- Chiudi tutto con `stop-all.bat`
- Riavvia con `start-production-debug.bat`

---

### ✔️ STEP 2: Controlla la finestra Backend (GIALLA)

Nella finestra GIALLA dovresti vedere:

```
====================================================================
  EjLog WMS REST API Server
====================================================================
  Server:        http://localhost:3077
  API Docs:      http://localhost:3077/api-docs
  Health Check:  http://localhost:3077/health
  ...
====================================================================
```

**Se vedi ERRORI nella finestra GIALLA:**

#### Errore: "ECONNREFUSED" o "Cannot connect to database"
**Causa**: SQL Server non raggiungibile
**Soluzione**:
1. Verifica che SQL Server sia avviato
2. Verifica che esista il database "promag"
3. Verifica le credenziali in `config\.env`:
   ```
   DB_SERVER=localhost\SQL2019
   DB_DATABASE=promag
   DB_USER=sa
   DB_PASSWORD=fergrp_2012
   ```

#### Errore: "Port 3077 already in use"
**Causa**: Porta già occupata
**Soluzione**:
1. Esegui `stop-all.bat`
2. Oppure uccidi il processo manualmente:
   ```cmd
   netstat -ano | findstr :3077
   taskkill /F /PID <numero_processo>
   ```

#### Errore: "Cannot find module 'express'"
**Causa**: Dipendenze non installate
**Soluzione**:
1. Esegui `install.bat`
2. Riavvia con `start-production.bat`

---

### ✔️ STEP 3: Controlla la finestra Frontend (VERDE)

Nella finestra VERDE dovresti vedere:

**Con http-server:**
```
Starting up http-server, serving frontend/dist
Available on:
  http://localhost:3000
```

**Con npx serve:**
```
┌────────────────────────────────────────┐
│                                        │
│   Serving!                             │
│                                        │
│   - Local:   http://localhost:3000    │
│                                        │
└────────────────────────────────────────┘
```

**Se vedi ERRORI nella finestra VERDE:**

#### Errore: "Port 3000 already in use"
**Causa**: Porta già occupata
**Soluzione**:
1. Esegui `stop-all.bat`
2. Oppure uccidi il processo manualmente:
   ```cmd
   netstat -ano | findstr :3000
   taskkill /F /PID <numero_processo>
   ```

#### Errore: "http-server: command not found"
**Causa**: http-server non installato
**Soluzione**:
1. Lo script dovrebbe installarlo automaticamente
2. Se fallisce, usa `npx serve` (automatico con lo script debug)

---

### ✔️ STEP 4: Verifica nel browser

Apri il browser e vai su: **http://localhost:3000**

#### CASO A: Pagina BIANCA
**Causa**: Frontend si sta caricando (React è lento al primo avvio)
**Soluzione**:
1. **Attendi 10-15 secondi**
2. **Premi F5** per ricaricare
3. Se ancora bianca, vai al CASO D

#### CASO B: "Cannot GET /"
**Causa**: Frontend non sta servendo correttamente i file
**Soluzione**:
1. Controlla la finestra VERDE - dovrebbe mostrare richieste HTTP
2. Esegui `stop-all.bat`
3. Riavvia con `start-production-debug.bat`

#### CASO C: "This site can't be reached"
**Causa**: Frontend non è avviato
**Soluzione**:
1. Controlla la finestra VERDE - ci sono errori?
2. Esegui `stop-all.bat`
3. Riavvia con `start-production-debug.bat`

#### CASO D: Pagina bianca + Errori in Console (F12)
**Apri la Console del Browser (F12) e controlla gli errori:**

##### Errore: "Failed to load module"
**Causa**: File JavaScript non trovati
**Esempio**:
```
Failed to load /assets/js/index-CSU6yTrg.js
```
**Soluzione**:
1. Verifica che `frontend\dist\assets\` contenga file `.js`
2. Se mancano, il build è corrotto:
   ```cmd
   cd C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp
   npm run build
   ```
3. Ricopia il deploy

##### Errore: "CORS policy blocked"
**Esempio**:
```
Access to fetch at 'http://localhost:3077/api/...' from origin 'http://localhost:3000' has been blocked by CORS policy
```
**Soluzione**:
1. **NON dovrebbe succedere** (il backend ha CORS abilitato)
2. Controlla che il backend sia avviato sulla porta 3077
3. Riavvia tutto con `start-production-debug.bat`

##### Errore: "NetworkError" o "Failed to fetch"
**Esempio**:
```
GET http://localhost:3077/api/auth/me net::ERR_CONNECTION_REFUSED
```
**Causa**: Backend non raggiungibile
**Soluzione**:
1. Controlla finestra GIALLA - il backend è avviato?
2. Prova ad aprire: http://localhost:3077/health
   - Se funziona = problema nel frontend
   - Se non funziona = backend non avviato correttamente

---

## 🔍 TEST MANUALI

### Test 1: Backend funzionante?
Apri il browser e vai su:
```
http://localhost:3077/health
```

**Dovresti vedere:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-12-24T..."
}
```

**Se vedi questo** ✅ = Backend OK

**Se NON si carica** ❌ = Backend KO (vedi finestra GIALLA)

---

### Test 2: Frontend serve i file?
Apri il browser e vai su:
```
http://localhost:3000/index.html
```

**Dovresti vedere** il codice HTML della pagina

**Se vedi il codice HTML** ✅ = Frontend serve i file correttamente

**Se vedi "Cannot GET /"** ❌ = Frontend non configurato correttamente

---

### Test 3: File JavaScript caricabili?
Apri il browser e vai su:
```
http://localhost:3000/assets/js/
```

**Dovresti vedere** una lista di file `.js`

**Se non vedi nulla** ❌ = Build frontend corrotto

---

## 🛠️ SOLUZIONI DEFINITIVE

### 🔄 RESET COMPLETO

Se niente funziona, fai un **reset completo**:

```cmd
REM 1. Ferma tutto
stop-all.bat

REM 2. Pulisci processi node
taskkill /F /IM node.exe

REM 3. Reinstalla dipendenze (se necessario)
install.bat

REM 4. Riavvia con diagnostica
start-production-debug.bat
```

---

### 📝 VERIFICA MANUALE COMPLETA

1. **Apri CMD come Amministratore**

2. **Verifica Node.js installato**:
   ```cmd
   node --version
   npm --version
   ```
   Dovrebbe mostrare v18.x o v20.x

3. **Verifica porte libere**:
   ```cmd
   netstat -ano | findstr :3077
   netstat -ano | findstr :3000
   ```
   Non dovrebbe mostrare nulla

4. **Verifica file esistono**:
   ```cmd
   cd C:\...\ejlog-wms-v1.0.0
   dir backend\node_modules
   dir backend\server\api-server.js
   dir frontend\dist\index.html
   dir frontend\dist\assets
   dir config\.env
   ```
   Tutti dovrebbero esistere

5. **Avvia backend manualmente**:
   ```cmd
   cd backend
   node server/api-server.js
   ```
   Aspetta il banner "EjLog WMS REST API Server"

6. **In un'altra finestra CMD, avvia frontend**:
   ```cmd
   cd frontend\dist
   npx serve -s . -l 3000
   ```
   Aspetta "Serving!"

7. **Apri browser**: http://localhost:3000

---

## 📞 SUPPORTO

Se ancora non funziona, raccogli queste informazioni:

1. **File di log**:
   - `start-debug.log` (se hai usato `start-production-debug.bat`)
   - Screenshot della finestra GIALLA (backend)
   - Screenshot della finestra VERDE (frontend)

2. **Console del Browser**:
   - Apri F12
   - Tab "Console"
   - Screenshot di tutti gli errori in rosso

3. **Network del Browser**:
   - Apri F12
   - Tab "Network"
   - Ricarica la pagina (F5)
   - Screenshot delle richieste fallite (rosse)

4. **Informazioni sistema**:
   ```cmd
   node --version
   npm --version
   systeminfo | findstr /B /C:"OS Name" /C:"OS Version"
   ```

---

## ✅ CHECKLIST FINALE

Prima di chiedere supporto, verifica:

- [ ] Node.js installato (v18 o v20)
- [ ] `install.bat` eseguito con successo
- [ ] SQL Server avviato
- [ ] Database "promag" esiste
- [ ] File `config\.env` esiste
- [ ] Porte 3000 e 3077 libere
- [ ] Finestra GIALLA (backend) aperta e senza errori
- [ ] Finestra VERDE (frontend) aperta e senza errori
- [ ] http://localhost:3077/health funziona
- [ ] http://localhost:3000 aspettato almeno 15 secondi
- [ ] F5 premuto per ricaricare
- [ ] Console browser (F12) controllata per errori

---

## 🎯 QUICK FIX PER I PROBLEMI PIÙ COMUNI

### ❌ Problema: "Pagina bianca dopo 30 secondi"
✅ Soluzione:
```cmd
F12 -> Console -> Cerca errori
Se vedi "Failed to fetch /api/auth/me":
  -> Backend non risponde
  -> Controlla finestra GIALLA
```

### ❌ Problema: "Cannot GET /"
✅ Soluzione:
```cmd
stop-all.bat
start-production-debug.bat
Aspetta 20 secondi
```

### ❌ Problema: "CORS error"
✅ Soluzione:
```cmd
Backend non configurato correttamente
Riavvia backend:
  cd backend
  node server/api-server.js
```

### ❌ Problema: "Port already in use"
✅ Soluzione:
```cmd
taskkill /F /IM node.exe
timeout /t 3
start-production.bat
```

---

**🎉 Buon lavoro con EjLog WMS!**

