# 🔍 GUIDA COMPLETA: RISOLUZIONE PAGINA BIANCA

## ⚠️ PROBLEMA

Dopo aver avviato `start-production-FIXED.bat`, il browser si apre ma mostra solo una **pagina bianca**.

---

## 🎯 DIAGNOSI RAPIDA

### PASSO 1: Apri la Console del Browser

1. Premi **F12** nel browser
2. Vai nella tab **"Console"**
3. Cerca messaggi di **ERRORE in ROSSO**

**A seconda dell'errore che vedi, vai alla sezione corrispondente qui sotto.**

---

## 🔴 ERRORE 1: "Failed to load module" / "404 Not Found" per file .js

### Causa
I file JavaScript non vengono trovati dal server.

### Sintomi
```
GET http://localhost:3000/assets/js/index-CSU6yTrg.js 404 (Not Found)
Failed to load module script
```

### Soluzione

#### Opzione A: Verifica serve è avviato correttamente
1. Vai nella **finestra VERDE** (Frontend)
2. Verifica che il comando sia:
   ```
   npx serve -s frontend/dist -l 3000
   ```
   OPPURE
   ```
   serve -s frontend/dist -l 3000
   ```

3. Se NON vedi `serve`, ma vedi `http-server`:
   - **Stai usando lo script SBAGLIATO**
   - Chiudi tutto: `stop-all.bat`
   - Usa: `start-production-FIXED.bat` (NON `start-production.bat`)

#### Opzione B: Reinstalla serve
```cmd
npm install -g serve
```

---

## 🔴 ERRORE 2: "Failed to fetch" / "Network request failed" per `/api/...`

### Causa
Il backend non risponde alle chiamate API.

### Sintomi
```
Failed to fetch http://localhost:3077/api/auth/login
TypeError: Failed to fetch
```

### Soluzione

#### 1. Verifica Backend
- Vai nella **finestra GIALLA** (Backend)
- Dovresti vedere:
  ```
  EjLog WMS REST API Server
  Server listening on port 3077
  ```

#### 2. Test Backend
Apri un nuovo CMD e prova:
```cmd
curl http://localhost:3077/health
```

**Risposta attesa**:
```json
{"success":true,"status":"healthy",...}
```

**Se non risponde**:
- Controlla SQL Server sia avviato
- Verifica `config\.env` sia corretto
- Controlla errori nella finestra GIALLA

#### 3. Verifica SQL Server
```cmd
# Verifica se SQL Server è avviato
sc query MSSQL$SQL2019
```

Se non è avviato:
```cmd
net start MSSQL$SQL2019
```

---

## 🔴 ERRORE 3: Service Worker errors

### Causa
Il Service Worker (`/sw.js` o `/registerSW.js`) non esiste o è corrotto.

### Sintomi
```
Error registering service worker
Failed to register service worker: /sw.js
```

### Soluzione

#### Opzione A: Test senza Service Worker
1. Esegui: `TEST-SENZA-SERVICE-WORKER.bat`
2. Attendi che si apra il browser
3. Se ORA funziona → il problema ERA il Service Worker

#### Opzione B: Rimuovi definitivamente Service Worker
Se il test funziona:
1. Esegui: `RIMUOVI-SERVICE-WORKER.bat`
2. Riavvia: `stop-all.bat` → `start-production-FIXED.bat`

---

## 🔴 ERRORE 4: CORS Policy error

### Causa
Il frontend cerca di contattare il backend ma CORS non è configurato.

### Sintomi
```
Access to fetch at 'http://localhost:3077/api/...' from origin 'http://localhost:3000'
has been blocked by CORS policy
```

### Soluzione

**Questo NON dovrebbe succedere** perché il backend ha CORS abilitato.

Se succede:
1. Verifica che backend sia su porta **3077**
2. Verifica che frontend sia su porta **3000**
3. Controlla `backend/server/api-server.js` - cerca:
   ```javascript
   app.use(cors({
     origin: '*',
     credentials: true
   }));
   ```

---

## 🔴 ERRORE 5: Nessun errore in console, ma pagina bianca

### Causa
JavaScript si carica ma React non si monta su `<div id="root">`.

### Soluzione

#### 1. Controlla tab "Network" (Rete)
1. Premi F12
2. Vai in **Network**
3. Ricarica pagina (F5)
4. Filtra per "JS"
5. Cerca file in **ROSSO** (errore)

#### 2. Verifica tutti i file sono caricati
Tutti questi file devono essere **200 OK**:
- `index.html`
- `assets/js/index-CSU6yTrg.js`
- `assets/js/vendor-react-*.js`
- `assets/*.css`

#### 3. Verifica `<div id="root">`
1. In Console, esegui:
   ```javascript
   document.getElementById('root')
   ```
2. Deve restituire: `<div id="root"></div>`

Se restituisce `null`, l'index.html è corrotto.

---

## 🔴 ERRORE 6: "Uncaught SyntaxError"

### Causa
File JavaScript corrotto o build incompleta.

### Sintomi
```
Uncaught SyntaxError: Unexpected token '<'
Uncaught SyntaxError: Invalid or unexpected token
```

### Soluzione

La build è corrotta. Devi rigenerare il pacchetto:

1. Vai nella directory sorgente (NON deploy):
   ```cmd
   cd C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp
   ```

2. Rigenera build:
   ```cmd
   npm run build
   ```

3. Ricrea pacchetto deploy

---

## 🔴 ERRORE 7: Porte occupate

### Causa
Le porte 3000 o 3077 sono già in uso.

### Sintomi
Nella finestra GIALLA o VERDE vedi:
```
Error: listen EADDRINUSE: address already in use :::3000
Port 3077 is already in use
```

### Soluzione

#### Metodo 1: Script automatico
```cmd
stop-all.bat
```

#### Metodo 2: Manuale
```cmd
# Trova processo sulla porta 3000
netstat -ano | findstr :3000

# Termina processo (sostituisci <PID> col numero)
taskkill /F /PID <PID>

# Ripeti per porta 3077
netstat -ano | findstr :3077
taskkill /F /PID <PID>
```

---

## 📋 CHECKLIST COMPLETA

Prima di contattare supporto, verifica:

- [ ] **Script corretto**: Usi `start-production-FIXED.bat` (NON `start-production.bat`)
- [ ] **2 finestre aperte**: Finestra GIALLA (Backend) e VERDE (Frontend)
- [ ] **Backend risponde**: `curl http://localhost:3077/health` → risposta JSON
- [ ] **Frontend risponde**: `curl http://localhost:3000` → risposta HTTP 200
- [ ] **SQL Server avviato**: `sc query MSSQL$SQL2019` → RUNNING
- [ ] **Porte libere**: Nessun altro processo su 3000 o 3077
- [ ] **File esistono**: `dir frontend\dist\index.html` → file presente
- [ ] **Console browser**: Premi F12 → tab Console → nessun errore ROSSO

---

## 🛠️ SCRIPT DI DIAGNOSI DISPONIBILI

### 1. Diagnosi completa
```cmd
DIAGNOSI-PAGINA-BIANCA.bat
```
Ti guida passo-passo nella diagnosi.

### 2. Test senza Service Worker
```cmd
TEST-SENZA-SERVICE-WORKER.bat
```
Testa se il problema è il Service Worker.

### 3. Avvio con diagnostica
```cmd
start-production-debug.bat
```
Avvia con verifica completa e log dettagliato.

---

## 📞 INFORMAZIONI PER SUPPORTO

Se nessuna soluzione funziona, raccogli:

1. ✅ Screenshot **Console browser** (F12 → Console)
2. ✅ Screenshot **Network tab** (F12 → Network)
3. ✅ Screenshot **finestra GIALLA** (Backend)
4. ✅ Screenshot **finestra VERDE** (Frontend)
5. ✅ File `start-debug.log`
6. ✅ File `diagnosi-pagina-bianca.log`
7. ✅ Output di:
   ```cmd
   node --version
   npm --version
   curl http://localhost:3077/health
   curl http://localhost:3000
   ```

---

## 🎯 SOLUZIONE RAPIDA (80% dei casi)

Nella maggior parte dei casi, il problema è uno di questi 3:

### 1. Script sbagliato
**Soluzione**: Usa `start-production-FIXED.bat` (NON `start-production.bat`)

### 2. Service Worker
**Soluzione**: Esegui `TEST-SENZA-SERVICE-WORKER.bat`

### 3. Backend non risponde
**Soluzione**:
- Verifica SQL Server avviato
- Controlla finestra GIALLA per errori
- Testa: `curl http://localhost:3077/health`

---

## 📚 FILE DI RIFERIMENTO

- `TROUBLESHOOTING.md` - Guida troubleshooting generale
- `QUICK-FIX-BROWSER.md` - Fix rapidi
- `LEGGIMI-IMPORTANTE.txt` - Istruzioni base
- Questa guida - Diagnosi completa

---

**Creato**: 24 Dicembre 2025
**Versione**: 1.0.1
**Problema**: Pagina bianca nel browser

