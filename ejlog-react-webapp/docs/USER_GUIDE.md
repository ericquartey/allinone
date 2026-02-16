# 📘 EjLog WMS - User Guide

**Version:** 1.0.0 (Phase 1 Complete)
**Last Updated:** 2025-11-27
**Target Users:** Warehouse operators, managers, administrators

---

## 📑 Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Core Features](#core-features)
4. [Module Guides](#module-guides)
5. [Tips & Best Practices](#tips--best-practices)
6. [Troubleshooting](#troubleshooting)
7. [FAQ](#faq)

---

## Introduction

### What is EjLog WMS?

EjLog WMS è un sistema di gestione magazzino moderno, completamente web-based (Progressive Web App), che sostituisce la precedente interfaccia Java Swing con un'esperienza utente fluida, reattiva e accessibile da qualsiasi dispositivo.

### Key Benefits

- ✅ **Accessibile da Browser** - Non serve installare nulla, funziona su Chrome, Firefox, Edge, Safari
- ✅ **Mobile Friendly** - Ottimizzato per tablet e smartphone per operazioni in magazzino
- ✅ **Offline Support** - Continua a funzionare anche senza connessione internet
- ✅ **Real-time Updates** - Dati sempre aggiornati con sincronizzazione automatica
- ✅ **Interfaccia Moderna** - Design intuitivo con ricerca rapida e filtri avanzati

---

## Getting Started

### First Login

1. **Apri il browser** e vai a: `http://localhost:3005` (o URL fornito dall'amministratore)
2. **Effettua il login** con le tue credenziali:
   - Username
   - Password
   - (Opzionale) Badge scanner per login rapido
3. **Dashboard** - Verrai reindirizzato alla dashboard principale

### Navigation

La barra di navigazione laterale contiene tutti i moduli principali:

- 🏠 **Dashboard** - Panoramica generale e KPI
- 📋 **Liste** - Picking, rifornimento, inventario
- 📦 **Articoli** - Gestione prodotti
- 📍 **Ubicazioni** - Gestione posizioni magazzino
- 📊 **Stock** - Inventario e movimenti
- 🚚 **Ordini** - Gestione ordini
- 🤖 **PLC** - Dispositivi automatici
- 👤 **Utenti** - Gestione utenti (admin)

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + K` | Quick search |
| `Ctrl + /` | Toggle navigation |
| `Esc` | Close modals |
| `F5` | Refresh data |

---

## Core Features

### Dashboard

Il **Dashboard** fornisce una vista d'insieme in tempo reale:

- **KPI Cards** - Metriche chiave (liste attive, stock, ordini, etc.)
- **Recent Activity** - Ultime operazioni eseguite
- **Alerts** - Notifiche urgenti (stock basso, liste bloccate, etc.)
- **Quick Actions** - Scorciatoie per azioni comuni

### Search & Filters

Ogni modulo include **ricerca avanzata** e **filtri**:

1. **Barra di ricerca** - Cerca per codice, descrizione, numero
2. **Filtri rapidi** - Pulsanti per stati comuni (PENDING, IN_PROGRESS, COMPLETED)
3. **Filtri avanzati** - Pannello laterale con tutti i criteri disponibili
4. **Ordinamento** - Click su colonna per ordinare (ascending/descending)

**Tips:**
- I filtri si combinano (AND logic)
- I filtri attivi appaiono come "chips" rimovibili sopra la tabella
- Usa "Clear Filters" per reset completo

### Data Export

Quasi tutte le tabelle supportano **export dati**:

- **JSON Export** - Per integrazione con altri sistemi
- **CSV Export** - Per analisi in Excel
- **Print View** - Stampa ottimizzata

**Come esportare:**
1. Applica eventuali filtri desiderati
2. Click su pulsante "Export" (📥)
3. Scegli formato (JSON/CSV)
4. File scaricato automaticamente

---

## Module Guides

### 📋 Lists Management

#### Viewing Lists

1. Naviga a **Lists** dal menu laterale
2. Vedrai tutte le liste con stato, tipo, priorità
3. Usa filtri per trovare liste specifiche:
   - **Type:** PICKING, REFILLING, INVENTORY, MOVEMENT, TRANSFER
   - **Status:** PENDING, IN_PROGRESS, PAUSED, COMPLETED, ERROR, CANCELLED
   - **Priority:** 1-10 (1 = massima priorità)

#### Executing a List

1. Trova la lista da eseguire (status = PENDING)
2. Click sulla riga per aprire dettaglio
3. Click su **"Execute List"** button
4. Conferma l'operazione
5. Segui le istruzioni per ogni item della lista

#### Monitoring Execution

- **List Execution Tracker** - View in tempo reale delle liste in esecuzione
- **Progress Bar** - Percentuale completamento
- **Items Per Minute** - Velocità esecuzione
- **Efficiency %** - Performance rispetto allo standard

### 📍 Locations Management

#### Location Browser

Visualizza tutte le ubicazioni con 3 modalità:

1. **Table View** - Lista completa con filtri
2. **Grid View** - Card visualizzazione
3. **Map View** - Mappa interattiva magazzino

**Filtri disponibili:**
- Warehouse / Zone / Area
- Type (PICKING, RESERVE, STAGING, etc.)
- Status (FREE, OCCUPIED, BLOCKED, RESERVED)
- Occupancy % (es. >90% per trovare full locations)

#### Location Detail

Click su una location per vedere:

- **Info Tab** - Codice, tipo, capacità, coordinata
- **Stock Tab** - Articoli presenti con quantità
- **Movements Tab** - Storico movimenti
- **History Tab** - Audit log operazioni
- **Config Tab** - Parametri configurazione

#### Capacity Planning

**Location Capacity Planning** tool per pianificare crescita:

1. Naviga a **Locations → Capacity Planning**
2. Seleziona warehouse/zone
3. Scegli scenario di crescita:
   - 📈 Conservative (5% growth)
   - 📊 Moderate (10% growth)
   - 🚀 High Growth (20% growth)
   - 💥 Aggressive (50% growth)
   - ⚙️ Custom (imposta %)
4. Visualizza proiezioni:
   - Days until full capacity
   - Bottleneck locations (>90% util)
   - Underutilized locations (<20% util)
   - Recommendations

### 📦 Stock Management

#### Stock Overview

- **Stock Analytics Dashboard** - KPI e metriche salute stock
- **Stock by Item** - Quantità per articolo in tutte le ubicazioni
- **Stock Movements** - Log movimenti con filtri temporali

#### Stock Health States

Il sistema classifica automaticamente lo stock:

- ✅ **OK** - Stock normale, sopra safety stock
- ⚠️ **LOW** - Sotto reorder point, ordinare
- 🔴 **CRITICAL** - Rischio stockout < 5 giorni
- 📦 **EXCESS** - Scorte eccessive, slow moving
- 🗑️ **OBSOLETE** - Nessun movimento 180+ giorni

#### Creating Stock Movements

1. Naviga a **Stock → Movements**
2. Click **"Create Movement"**
3. Compila form:
   - Source location
   - Target location
   - Item code
   - Quantity
   - Reason (TRANSFER, ADJUSTMENT, etc.)
4. Click **"Submit"**
5. Movimento registrato e stock aggiornato

### 🚚 Orders Management

#### Order Priority Manager

**Intelligent order prioritization** con scoring automatico:

1. Naviga a **Orders → Priority**
2. Visualizza tutti gli ordini con score e urgency
3. **Scoring factors** (0-100 per ciascuno):
   - Due Date Score - Scadenza ordine
   - Customer Score - Importanza cliente (VIP/Premium)
   - Value Score - Valore ordine
   - Age Score - Età ordine
   - Completeness Score - Disponibilità stock
4. **Apply prioritization rule:**
   - 🎯 CUSTOM - Score automatico (algoritmo AI)
   - ⏰ FIFO - First In First Out
   - 📅 DUE_DATE - Per scadenza
   - 💰 VALUE - Per valore
   - 👤 CUSTOMER - Per cliente
5. **Manual override** - Click su priority badge per cambio manuale

#### Urgency Levels

- 🔴 **CRITICAL** (90-100) - Immediate action required
- 🟠 **HIGH** (70-89) - Process today
- 🟡 **MEDIUM** (50-69) - Process this week
- 🟢 **LOW** (0-49) - Standard processing

### 🤖 PLC Management

#### PLC Devices

Gestione dispositivi automatici (shuttle, traslo, etc.):

1. Naviga a **PLC → Devices**
2. Visualizza tutti i dispositivi con stato (ONLINE/OFFLINE/ERROR)
3. Click su device per dettaglio

#### PLC Device Detail

**6 Tabs disponibili:**

1. **Info** - Dettagli dispositivo (IP, type, model, etc.)
2. **Databuffer** - Hex viewer memoria PLC (con ASCII)
3. **Commands** - Esecuzione comandi PLC
4. **History** - Log comandi eseguiti
5. **Signals** - Segnali I/O real-time
6. **Monitor** - Monitoraggio continuo con grafici

#### Executing PLC Commands

1. Tab **Commands**
2. Seleziona template command o crea custom
3. Compila parametri richiesti
4. Click **"Execute Command"**
5. Verifica result e status

#### Signal Monitoring

- **Real-time monitoring** con auto-refresh (configurabile)
- **Signal types:** INPUT, OUTPUT, INTERNAL
- **Data types:** BOOL, INT, WORD, DWORD, REAL
- **History graphs** - Trend temporale valore segnale

---

## Tips & Best Practices

### Performance Tips

1. **Use Filters** - Filtra i dati prima di esportare grandi dataset
2. **Auto-refresh** - Disabilita se non necessario per risparmiare banda
3. **Pagination** - Usa paginazione per tabelle con migliaia di righe
4. **Offline Mode** - L'app continua a funzionare offline e sincronizza quando torna online

### Workflow Tips

1. **Dashboard Widgets** - Personalizza dashboard con widget più utili per il tuo ruolo
2. **Quick Actions** - Usa scorciatoie dashboard per operazioni frequenti
3. **Saved Filters** - Salva combinazioni filtri usate spesso (feature in arrivo)
4. **Bulk Operations** - Seleziona multipli item per operazioni batch

### Mobile Usage

Su **tablet/smartphone**:

1. **Touch-friendly** - Tutti i pulsanti sono grandi abbastanza
2. **Swipe gestures** - Swipe su tabelle per scroll orizzontale
3. **Scanner integration** - Usa scanner barcode per input rapido
4. **Landscape mode** - Ruota device per tabelle più ampie

---

## Troubleshooting

### Common Issues

#### "Lista non si esegue"

**Possibili cause:**
- Lista in stato sbagliato (deve essere PENDING)
- Permessi insufficienti (contatta admin)
- Stock non disponibile (verifica availability)

**Soluzione:**
1. Verifica status lista (deve essere PENDING)
2. Controlla log errori in dettaglio lista
3. Verifica stock disponibile per tutti gli item

#### "Dati non aggiornati"

**Soluzione:**
1. Click su pulsante Refresh (🔄)
2. Verifica connessione internet
3. Controlla se backend è running (icona stato in header)
4. Cancella cache browser (Settings → Clear)

#### "Pagina non carica"

**Soluzione:**
1. Ricarica pagina (F5 o Ctrl+R)
2. Cancella cache browser
3. Verifica URL corretto
4. Prova con browser diverso
5. Contatta IT support

#### "Errore durante export"

**Soluzione:**
1. Riduci dataset con filtri
2. Prova formato diverso (CSV invece di JSON)
3. Verifica spazio disco disponibile
4. Disabilita popup blocker

### Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| `401 Unauthorized` | Sessione scaduta | Effettua nuovo login |
| `403 Forbidden` | Permessi insufficienti | Contatta admin |
| `404 Not Found` | Risorsa non esiste | Verifica codice/numero |
| `500 Server Error` | Errore backend | Riprova tra qualche minuto |
| `Network Error` | Connessione persa | Verifica internet |

---

## FAQ

### General

**Q: Posso usare EjLog WMS da smartphone?**
A: Sì! L'app è completamente responsive e ottimizzata per mobile.

**Q: Funziona offline?**
A: Sì, grazie alla tecnologia PWA l'app continua a funzionare offline e sincronizza quando torna la connessione.

**Q: Come cambio la password?**
A: Vai a User Profile (icona in alto a destra) → Change Password.

**Q: Posso personalizzare la dashboard?**
A: Sì, puoi scegliere quali widget visualizzare (Settings → Dashboard).

### Lists

**Q: Come creo una nuova lista?**
A: Lists → Create List → Compila form → Submit.

**Q: Posso pausare una lista in esecuzione?**
A: Sì, click su "Pause" nella pagina execution tracker.

**Q: Come vedo lo storico liste?**
A: Lists → Applica filtro Status: COMPLETED → Imposta range date.

### Locations

**Q: Come blocco una ubicazione?**
A: Location Detail → Actions → Block Location → Motivo → Confirm.

**Q: Come riservo una location per un ordine?**
A: Location Detail → Actions → Reserve → Order Number → Quantity → Confirm.

**Q: La mappa non si vede**
A: Verifica di essere in Map View e che il warehouse abbia coordinate configurate.

### Stock

**Q: Come faccio un conteggio inventario?**
A: Locations → Seleziona location → Create Inventory → Inserisci quantità fisica → Submit.

**Q: Come vedo dove si trova un articolo?**
A: Stock → Stock by Item → Cerca codice articolo → Visualizza tutte le ubicazioni.

**Q: Cosa significa "Days of Stock"?**
A: Giorni rimanenti di copertura stock basato su consumo medio.

---

## Support & Contacts

### Getting Help

- **📧 Email Support:** support@ejlog.com
- **📞 Phone:** +39 123 456 7890
- **💬 Live Chat:** Click on help icon (bottom right)
- **📚 Documentation:** https://docs.ejlog.com

### Training

Corsi disponibili:
- **Basic User** - 2 ore - Operatori magazzino
- **Advanced User** - 4 ore - Responsabili, supervisor
- **Administrator** - 8 ore - IT, system admin

Contatta training@ejlog.com per iscrizioni.

---

**Document Version:** 1.0.0
**Last Updated:** 2025-11-27
**Maintained by:** EjLog Product Team
