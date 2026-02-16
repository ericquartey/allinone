# 🚀 EjLog WMS v1.0.0 - Installazione Semplice

## 📋 Pre-requisiti

Sul PC di destinazione deve essere già presente:
- ✅ **Node.js 18.x** o superiore
- ✅ **SQL Server** con database **promag** già configurato
- ✅ **Accesso al database** (credenziali sa o altro utente)

---

## 📦 Procedura Installazione (3 passi)

### Passo 1: Copia File (1 minuto)

1. Copia il file **`ejlog-wms-v1.0.0-2025-12-23.zip`** sul PC di destinazione
2. Estrai in qualsiasi cartella (es: `C:\EjLog-WMS\` o `D:\Applicazioni\EjLog\`)

```
Esempio struttura dopo estrazione:
C:\EjLog-WMS\
├── frontend\
├── backend\
├── config\
├── install.bat
├── start-production.bat
└── stop-all.bat
```

---

### Passo 2: Installazione (2-3 minuti)

1. Apri la cartella dove hai estratto i file
2. **Doppio click** su **`install.bat`**
3. Attendi completamento installazione dipendenze

Lo script farà automaticamente:
- ✅ Verifica Node.js installato
- ✅ Crea cartelle necessarie (logs, backups, uploads)
- ✅ Installa dipendenze backend
- ✅ Crea file `.env` da configurare

---

### Passo 3: Configurazione Database (30 secondi)

1. Apri la cartella **`config\`**
2. Apri il file **`.env`** con Blocco Note
3. Modifica solo queste righe con i dati del TUO database:

```env
# Modifica queste righe:
DB_SERVER=localhost\SQL2019        # <-- Il tuo server SQL
DB_NAME=promag                     # <-- Nome database (già esistente)
DB_USER=sa                         # <-- Utente SQL
DB_PASSWORD=LA_TUA_PASSWORD        # <-- Password database

# Lascia il resto invariato
```

4. **Salva** e chiudi il file

---

### Passo 4: Avvio (10 secondi)

1. Torna nella cartella principale
2. **Doppio click** su **`start-production.bat`**
3. Attendi apertura automatica browser

Il sistema si avvierà su:
- 🌐 **Frontend**: http://localhost:3000
- 🔧 **Backend API**: http://localhost:3077

**Login**:
- Username: `admin`
- Password: `admin`

---

## ✅ Verifica Installazione

Dopo l'avvio, verifica:

1. **Browser aperto automaticamente** su http://localhost:3000
2. **Pagina login** visualizzata correttamente
3. **Login** con admin/admin
4. **Dashboard** caricata con dati dal database

### Test Gestione Magazzini
1. Menu → **Macchine** → **Gestione Magazzini**
2. Verifica che i magazzini dal database siano visibili
3. Prova **Inserisci** nuovo magazzino
4. Verifica **Ricerca** e **Filtri**

---

## 🔄 Comandi Utili

### Avvia Applicazione
```
Doppio click: start-production.bat
```

### Ferma Applicazione
```
Doppio click: stop-all.bat
```

### Reinstalla Dipendenze
```
Doppio click: install.bat
```

---

## 🐛 Risoluzione Problemi

### "Node.js non trovato"
**Soluzione**: Installa Node.js da https://nodejs.org (versione 18.x o 20.x LTS)

### "Errore connessione database"
**Soluzione**:
1. Verifica SQL Server avviato
2. Controlla credenziali in `config\.env`
3. Testa connessione manuale:
   ```cmd
   sqlcmd -S localhost\SQL2019 -U sa -P TUA_PASSWORD
   ```

### "Porta 3000 occupata"
**Soluzione**:
```cmd
# Trova processo
netstat -ano | findstr :3000

# Termina processo (sostituisci PID)
taskkill /F /PID <PID>
```

### "Moduli non trovati"
**Soluzione**:
```cmd
cd C:\EjLog-WMS\backend
npm install --production
```

---

## 📊 Porte Utilizzate

| Porta | Servizio | Descrizione |
|-------|----------|-------------|
| 3000 | Frontend | Interfaccia React |
| 3077 | Backend | API REST principale |
| 3079 | HTTPS | Server HTTPS (opzionale) |
| 8080 | React Backend | Server React supplementare |

**Nota**: Assicurati che queste porte siano libere sul sistema di destinazione.

---

## 🔒 Sicurezza

### Dopo l'installazione, RICORDA di:
- [ ] Cambiare password admin default
- [ ] Modificare `JWT_SECRET` in `.env`
- [ ] Modificare `SESSION_SECRET` in `.env`
- [ ] Configurare backup automatici database
- [ ] Configurare firewall se necessario

---

## 📁 Struttura Cartelle

```
C:\EjLog-WMS\
├── frontend\
│   └── dist\              # Build React (non modificare)
├── backend\
│   ├── node_modules\      # Dipendenze (creata da install.bat)
│   ├── server\            # Server Node.js
│   └── package.json
├── config\
│   ├── .env              # CONFIGURAZIONE PRINCIPALE ⚙️
│   ├── .env.example      # Template configurazione
│   └── *.json            # Config server
├── logs\                  # Log applicazione (auto-creati)
├── backups\              # Backup database (auto-creati)
├── uploads\              # File upload (auto-creati)
├── install.bat           # Script installazione
├── start-production.bat  # Script avvio
└── stop-all.bat          # Script stop
```

---

## 🎯 Installazione su Più PC

Se devi installare su più PC nella stessa rete:

1. **Primo PC**:
   - Installa normalmente
   - Configura `.env` con database condiviso
   - Testa funzionamento

2. **Altri PC**:
   - Copia lo ZIP ed estrai
   - Esegui `install.bat`
   - Copia il file `.env` dal primo PC
   - Avvia con `start-production.bat`

**Nota**: Tutti i PC possono puntare allo stesso database SQL Server.

---

## 📞 Supporto Rapido

### Log per Debug
```
C:\EjLog-WMS\logs\
├── backend.log    # Errori backend
├── frontend.log   # Errori frontend
└── ejlog-wms.log  # Log generale
```

### Verifica Backend Attivo
```
http://localhost:3077/health
```
Deve restituire: `{"status":"ok"}`

### API Documentation
```
http://localhost:3077/api-docs
```

---

## 📈 Tempo Installazione

| Fase | Tempo Stimato |
|------|---------------|
| Copia file ZIP | 1 minuto |
| Estrazione ZIP | 30 secondi |
| Esecuzione install.bat | 2-3 minuti |
| Configurazione .env | 30 secondi |
| Avvio applicazione | 10 secondi |
| **TOTALE** | **~5 minuti** |

---

## ✨ Funzionalità Pronte all'Uso

Dopo l'installazione avrai accesso a:

- ✅ **Gestione Magazzini** (completa con CRUD)
- ✅ **Dashboard** real-time
- ✅ **User Management**
- ✅ **Analytics & Reporting**
- ✅ **Scheduler** prenotatori
- ✅ **Voice Pick** (AI/ML)
- ✅ **PTL System**
- ✅ **Barcode Scanner**
- ✅ **WebSocket** real-time

---

**Versione**: 1.0.0
**Data**: 2025-12-23
**Ambiente**: Production Ready

🚀 **Installazione semplice in 5 minuti - Database già configurato!**

