================================================================================
                    ⚠️  BROWSER MOSTRA PAGINA BIANCA?
================================================================================

SE IL BROWSER MOSTRA SOLO UNA PAGINA BIANCA, SEGUI QUESTI PASSI:


🔧 SOLUZIONE RAPIDA (3 PASSI)
================================================================================

PASSO 1: Esegui questo script
------------------------------

   DIAGNOSI-PAGINA-BIANCA.bat

Questo script ti guidera' passo-passo nella diagnosi.


PASSO 2: Segui le istruzioni
-----------------------------

Lo script ti dira' esattamente cosa fare.


PASSO 3: Se ancora non funziona
--------------------------------

Prova il test senza Service Worker:

   TEST-SENZA-SERVICE-WORKER.bat



📋 CAUSE PIU' COMUNI (80% dei casi)
================================================================================

1. BACKEND NON RISPONDE
   =====================
   Sintomo: Nella console (F12) vedi "Failed to fetch /api/..."

   Soluzione:
   - Verifica finestra GIALLA (Backend) sia aperta
   - Controlla che SQL Server sia avviato
   - Testa: curl http://localhost:3077/health


2. SERVICE WORKER PROBLEMATICO
   ============================
   Sintomo: Nella console vedi errori su "service worker" o "sw.js"

   Soluzione:
   - Esegui: TEST-SENZA-SERVICE-WORKER.bat
   - Se funziona, esegui: RIMUOVI-SERVICE-WORKER.bat


3. SCRIPT SBAGLIATO
   =================
   Sintomo: Nella finestra VERDE vedi "http-server" invece di "serve"

   Soluzione:
   - Chiudi tutto: stop-all.bat
   - USA: start-production-FIXED.bat (NON start-production.bat)



🔍 COME VEDERE GLI ERRORI
================================================================================

1. Apri il browser su http://localhost:3000

2. Premi F12 (si apre la console sviluppatore)

3. Vai nella tab "Console"

4. Cerca messaggi in ROSSO

5. Leggi l'errore e cerca la soluzione nella guida completa:
   GUIDA-PAGINA-BIANCA-COMPLETA.md



📚 GUIDE DISPONIBILI
================================================================================

FILE                               DESCRIZIONE
----                               -----------
LEGGIMI-IMPORTANTE.txt             Istruzioni immediate
GUIDA-PAGINA-BIANCA-COMPLETA.md    Tutte le soluzioni possibili
TROUBLESHOOTING.md                 Guida troubleshooting generale
QUICK-FIX-BROWSER.md               Fix rapidi



🛠️ SCRIPT DI DIAGNOSI
================================================================================

FILE                               DESCRIZIONE
----                               -----------
DIAGNOSI-PAGINA-BIANCA.bat         Diagnosi guidata passo-passo
TEST-SENZA-SERVICE-WORKER.bat      Testa senza Service Worker
RIMUOVI-SERVICE-WORKER.bat         Rimuove definitivamente SW
start-production-debug.bat         Avvio con diagnostica completa



✅ VERIFICA RAPIDA
================================================================================

Prima di iniziare la diagnosi, verifica:

[ ] Hai usato: start-production-FIXED.bat (NON start-production.bat)
[ ] Sono aperte 2 finestre CMD: GIALLA (Backend) e VERDE (Frontend)
[ ] Nella finestra VERDE vedi "serve" (NON "http-server")
[ ] SQL Server e' avviato
[ ] Hai atteso almeno 20 secondi dopo l'apertura del browser



📞 SUPPORTO
================================================================================

Se NESSUNA soluzione funziona:

1. Esegui: DIAGNOSI-PAGINA-BIANCA.bat
2. Salva il file: diagnosi-pagina-bianca.log
3. Fai screenshot di:
   - Console browser (F12 -> Console)
   - Finestra GIALLA (Backend)
   - Finestra VERDE (Frontend)
4. Leggi: GUIDA-PAGINA-BIANCA-COMPLETA.md



🎯 INIZIA QUI
================================================================================

Il modo piu' semplice per risolvere:

1. Doppio click su: DIAGNOSI-PAGINA-BIANCA.bat

2. Segui le istruzioni

3. Lo script ti dira' esattamente qual'e' il problema


================================================================================

Creato: 24 Dicembre 2025
Versione: 1.0.1
Problema: Browser mostra pagina bianca

================================================================================

