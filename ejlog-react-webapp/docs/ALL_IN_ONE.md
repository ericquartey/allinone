# EJLOG WMS - All-in-One (come funziona)

Questo documento descrive come funziona la piattaforma "all in one" del progetto React EJLOG WMS, con tutte le funzioni e i moduli disponibili nell'applicazione.

## 1) Cos'e l'All-in-One
Una singola web app che unisce:
- operativita di magazzino (liste, picking, refilling, inventario)
- gestione dati (articoli, giacenze, ubicazioni, UDC, movimenti)
- integrazioni (ERP/SAP/EDI, adapter, scheduler)
- interfacce macchina (PPC UI e gestione cassetti)
- analisi, report e audit

## 2) Come funziona (flusso base)
1. Login via credenziali o badge.
2. Accesso ai moduli in base al ruolo (operatore, supervisore, amministratore).
3. Navigazione da menu laterale con moduli principali e funzioni specifiche.
4. Operazioni guidate (liste, missioni, movimenti) con stato e tracking.
5. Reportistica e log per controllo e audit.

## 3) Ruoli e permessi
Il menu e le funzioni sono filtrati da livelli di accesso e permessi:
- Operatore: esecuzione operazioni e consultazione dati base.
- Supervisore: report, monitoraggio, controlli e configurazioni operative.
- Amministratore: configurazioni, integrazioni e gestione utenti.

## 4) Moduli principali (menu)

### Dashboard
- KPI operativi e stato generale.
- Azioni rapide e panoramica attivita.

### Operazioni
- Gestione liste (creazione, monitoraggio, dettaglio, esecuzione).
- Operazioni liste (hub, touch, riserva, rilascio, terminazione, attesa).
- Esecuzione picking e refilling.
- Inventario operativo.

### RF Operations
- Picking RF, Putaway RF, Inventario RF.
- Voice Pick (demo e reale).

### I/ML Features
- Voice Pick (demo e reale).
- Dashboard real-time.
- PTL simulator.
- PWA info.
- Analytics avanzati.
- Barcode scanner demo.

### PPC UI (interfaccia macchina)
- Accesso a moduli PPC: menu, login, errori, operatore, installazione, layout.
- Missioni e interfacce operatore.
- Admin PPC: utenti, audit, report builder, notifiche, barcode, analytics, sistema.

### Magazzino
- Articoli (lista, dettaglio, creazione/modifica, immagini).
- Giacenze e movimenti stock.
- Ubicazioni (browser, dettaglio, capacity planning, debug).
- UDC (lista, dettaglio, creazione).
- Cassetti (gestione cassetti, mappa video).

### Spedizioni
- Ricevimento.
- Spedizione.

### Macchine e Allarmi
- Lista macchine e gestione magazzini.
- Allarmi e storico.
- Log eventi.

### Report
- Dashboard report e viewer.
- Report builder admin.

### Impostazioni
- Generali, profilo, notifiche, sicurezza.
- Host, dashboard, scheduler prenotatore.
- Adapter EJLOG.

### Configurazione
- Utenti, zone, stampanti.
- Impostazioni avanzate.
- Scheduler e configurazione sistema.

## 5) Moduli operativi aggiuntivi (pagine presenti nel progetto)
Queste aree sono disponibili come pagine dedicate e/o moduli avanzati:
- Ordini e consolidamento.
- Receiving, putaway, packing, shipping, kitting, crossdock, VAS.
- Inventario (cycle count) e rettifiche.
- Trasferimenti materiali.
- Carriers, route planning, dock e yard management.
- Planning, wave planning, replenishment, demand forecasting, appointment scheduling.
- Quality control, compliance audit, claims, returns.
- Equipment, assets, labor, task assignment.
- Customers e suppliers.
- Batch management, barcode management, production orders.
- Workstations e relative detail page.
- PLC devices e segnali.
- Analytics, KPI dashboard, performance metrics, alerts.
- Notifiche, audit log, user management.
- List templates, product images, event logs.

Nota: alcuni moduli sono demo o prototipi (es. Voice Pick Demo, Barcode Demo).

## 6) Integrazioni
- SAP: configurazioni e test (OData/IDoc/RFC/file).
- ERP e sistemi esterni: REST/SOAP/OData/EDI.
- EDI Inbox: import, validazione, creazione ordini, log errori.
- Adapter EJLOG e scheduler per sincronizzazioni.

## 7) AI Assistant
Assistente AI integrato per comandi rapidi, consultazioni e supporto operativo in pagina.

## 8) Output e controllo
- Report e dashboard di performance.
- Audit log e log eventi.
- Storico operazioni e tracking stati.

## 9) Punti di forza dell'approccio all-in-one
- Unica UI per tutte le funzioni.
- Flussi operativi integrati con macchine e dati reali.
- Integrazioni centralizzate e tracciate.
- Ruoli e permessi chiari.

---

Se vuoi, posso personalizzare il documento con: screenshots, esempi di flusso, e link diretti alle pagine.
