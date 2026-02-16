# Mappatura Completa Java Swing → React

Documento che mappa le pagine UI Java Swing del sistema EjLog alle corrispondenti pagine React create.

## Overview Architettura

**Sistema Originale**: Java Swing/AWT Desktop Application (400+ componenti UI)
**Nuovo Sistema**: React Web Application con TypeScript + Material-UI
**Backend**: REST API Spring (http://localhost:3079/EjLogHostVertimag)
**Database**: SQL Server 2019 - Database PROMAG

---

## Mappatura Pagine con API Reali Implementate

Queste pagine utilizzano le API REST reali documentate e si connettono al database SQL Server PROMAG.

| Componente Java Swing | Pagina React | File React | API Endpoint | Stato |
|----------------------|-------------|------------|--------------|-------|
| AnagraficaArticoloPanel | Gestione Articoli | src/pages/items/ItemsManagementPage.tsx | /Items | ✅ CRUD Completo |
| GestioneListePanel | Gestione Liste | src/pages/lists/ListsManagementPage.tsx | /Lists | ✅ CRUD Completo |
| Stock Panels | Giacenze Magazzino | src/pages/stock/StockPage.tsx | /Stock | ✅ Visualizzazione Completa |
| Movements Panels | Movimenti Magazzino | src/pages/movements/MovementsPage.tsx | /Movements | ✅ Storico Completo |
| Main Dashboard | Dashboard WMS | src/pages/dashboard/DashboardPage.tsx | Multiple APIs | ✅ Statistiche Real-time |

---

## Pagine UI Estese (Template/Placeholder)

Queste pagine sono state create per estendere l'architettura dell'applicazione ma utilizzano dati mock o richiedono implementazione API aggiuntive.

### Autenticazione
- **LoginPage** (`src/pages/auth/LoginPage.tsx`) - Login con username/password
- **BadgeLoginPage** (`src/pages/auth/BadgeLoginPage.tsx`) - Login con badge RFID

### Gestione Articoli (Esteso)
- **ItemsPage** (`src/pages/items/ItemsPage.tsx`) - Lista articoli con routing
- **ItemDetailPage** (`src/pages/items/ItemDetailPage.tsx`) - Dettaglio articolo singolo
- **ItemEditPage** (`src/pages/items/ItemEditPage.tsx`) - Modifica articolo
- **ItemCreatePage** (`src/pages/items/ItemCreatePage.tsx`) - Creazione nuovo articolo

### Gestione Liste (Esteso)
- **ListsPage** (`src/pages/lists/ListsPage.tsx`) - Lista con routing avanzato
- **ListDetailPage** (`src/pages/lists/ListDetailPage.tsx`) - Dettaglio lista
- **CreateListPage** (`src/pages/lists/CreateListPage.tsx`) - Creazione lista
- **ExecuteListPage** (`src/pages/lists/ExecuteListPage.tsx`) - Esecuzione lista
- **PickingExecutionPage** (`src/pages/lists/PickingExecutionPage.tsx`) - Esecuzione picking
- **RefillingExecutionPage** (`src/pages/lists/RefillingExecutionPage.tsx`) - Esecuzione refilling
- **InventoryExecutionPage** (`src/pages/lists/InventoryExecutionPage.tsx`) - Esecuzione inventario
- **ListManagementPage** (`src/pages/lists/management/ListManagementPage.tsx`) - Gestione liste avanzata
- **ListDetailPage** (`src/pages/lists/management/ListDetailPage.tsx`) - Dettaglio lista management

### UDC (Unità Di Carico)
- **LoadingUnitsPage** (`src/pages/udc/LoadingUnitsPage.tsx`) - Gestione UDC
- **UDCListPage** (`src/pages/udc/UDCListPage.tsx`) - Lista UDC
- **UDCDetailPage** (`src/pages/udc/UDCDetailPage.tsx`) - Dettaglio UDC
- **CreateUdcPage** (`src/pages/udc/CreateUdcPage.tsx`) - Creazione UDC

### Operazioni
- **OperationsPage** (`src/pages/operations/OperationsPage.tsx`) - Lista operazioni
- **OperationsHubPage** (`src/pages/operations/OperationsHubPage.tsx`) - Hub operazioni
- **OperationDetailPage** (`src/pages/operations/OperationDetailPage.tsx`) - Dettaglio operazione
- **ExecuteOperationPage** (`src/pages/operations/ExecuteOperationPage.tsx`) - Esecuzione operazione

### Stock (Esteso)
- **StockByItemPage** (`src/pages/stock/StockByItemPage.tsx`) - Giacenze per articolo
- **StockMovementsPage** (`src/pages/stock/StockMovementsPage.tsx`) - Movimenti magazzino

### Macchine e Allarmi
- **MachinesPage** (`src/pages/machines/MachinesPage.tsx`) - Gestione macchine
- **MachineDetailPage** (`src/pages/machines/MachineDetailPage.tsx`) - Dettaglio macchina
- **AlarmsPage** (`src/pages/alarms/AlarmsPage.tsx`) - Lista allarmi attivi
- **AlarmHistoryPage** (`src/pages/alarms/AlarmHistoryPage.tsx`) - Storico allarmi
- **AlertsDashboardPage** (`src/pages/alerts/AlertsDashboardPage.tsx`) - Dashboard alert

### Reports
- **ReportsPage** (`src/pages/reports/ReportsPage.tsx`) - Generazione report
- **ReportsDashboardPage** (`src/pages/reports/ReportsDashboardPage.tsx`) - Dashboard report

### Configurazione
- **ConfigPage** (`src/pages/config/ConfigPage.tsx`) - Configurazione sistema
- **AreasPage** (`src/pages/config/AreasPage.tsx`) - Gestione aree
- **ZoneConfigPage** (`src/pages/config/ZoneConfigPage.tsx`) - Configurazione zone
- **UsersPage** (`src/pages/config/UsersPage.tsx`) - Gestione utenti

### Utenti e Postazioni
- **UsersListPage** (`src/pages/UsersListPage.tsx`) - Lista utenti
- **UserListPage** (`src/pages/users/UserListPage.tsx`) - Gestione utenti avanzata
- **WorkstationListPage** (`src/pages/workstations/WorkstationListPage.tsx`) - Lista postazioni
- **WorkstationDetailPage** (`src/pages/workstations/WorkstationDetailPage.tsx`) - Dettaglio postazione

### Prodotti e Ubicazioni
- **ProductListPage** (`src/pages/products/ProductListPage.tsx`) - Lista prodotti
- **ProductDetailPage** (`src/pages/products/ProductDetailPage.tsx`) - Dettaglio prodotto
- **LocationListPage** (`src/pages/locations/LocationListPage.tsx`) - Lista ubicazioni
- **LocationDetailPage** (`src/pages/locations/LocationDetailPage.tsx`) - Dettaglio ubicazione

### Funzionalità WMS Avanzate
- **TransferMaterialPage** (`src/pages/transfers/TransferMaterialPage.tsx`) - Trasferimenti materiali
- **InventoryAdjustmentsPage** (`src/pages/adjustments/InventoryAdjustmentsPage.tsx`) - Rettifiche inventario
- **AppointmentSchedulingPage** (`src/pages/appointments/AppointmentSchedulingPage.tsx`) - Gestione appuntamenti
- **BarcodeManagementPage** (`src/pages/barcode/BarcodeManagementPage.tsx`) - Gestione barcode
- **BatchManagementPage** (`src/pages/batch/BatchManagementPage.tsx`) - Gestione lotti
- **WarehouseCapacityPage** (`src/pages/capacity/WarehouseCapacityPage.tsx`) - Capacità magazzino
- **CarriersPage** (`src/pages/carriers/CarriersPage.tsx`) - Gestione vettori
- **DamageClaimsPage** (`src/pages/claims/DamageClaimsPage.tsx`) - Reclami danni
- **ComplianceAuditPage** (`src/pages/compliance/ComplianceAuditPage.tsx`) - Audit conformità
- **OrderConsolidationPage** (`src/pages/consolidation/OrderConsolidationPage.tsx`) - Consolidamento ordini
- **CrossDockingPage** (`src/pages/crossdock/CrossDockingPage.tsx`) - Cross-docking
- **CustomersPage** (`src/pages/customers/CustomersPage.tsx`) - Gestione clienti
- **DockManagementPage** (`src/pages/dock/DockManagementPage.tsx`) - Gestione banchine
- **EquipmentManagementPage** (`src/pages/equipment/EquipmentManagementPage.tsx`) - Gestione attrezzature
- **DemandForecastingPage** (`src/pages/forecasting/DemandForecastingPage.tsx`) - Previsioni domanda
- **CycleCountPage** (`src/pages/inventory/CycleCountPage.tsx`) - Conteggio ciclico
- **InventoryHubPage** (`src/pages/inventory/InventoryHubPage.tsx`) - Hub inventario
- **KittingAssemblyPage** (`src/pages/kitting/KittingAssemblyPage.tsx`) - Assemblaggio kit
- **KPIDashboardPage** (`src/pages/kpi/KPIDashboardPage.tsx`) - Dashboard KPI
- **LaborManagementPage** (`src/pages/labor/LaborManagementPage.tsx`) - Gestione manodopera
- **PerformanceMetricsPage** (`src/pages/metrics/PerformanceMetricsPage.tsx`) - Metriche performance
- **NotificationsCenterPage** (`src/pages/notifications/NotificationsCenterPage.tsx`) - Centro notifiche
- **PackingOperationsPage** (`src/pages/packing/PackingOperationsPage.tsx`) - Operazioni imballaggio
- **PlanningHubPage** (`src/pages/planning/PlanningHubPage.tsx`) - Hub pianificazione
- **ProductionOrdersPage** (`src/pages/production/ProductionOrdersPage.tsx`) - Ordini produzione
- **PutAwayManagementPage** (`src/pages/putaway/PutAwayManagementPage.tsx`) - Gestione stoccaggio
- **QualityControlPage** (`src/pages/quality/QualityControlPage.tsx`) - Controllo qualità
- **ReceivingManagementPage** (`src/pages/receiving/ReceivingManagementPage.tsx`) - Gestione ricevimento
- **ReplenishmentPlanningPage** (`src/pages/replenishment/ReplenishmentPlanningPage.tsx`) - Pianificazione rifornimento
- **ReturnsManagementPage** (`src/pages/returns/ReturnsManagementPage.tsx`) - Gestione resi
- **RoutePlanningPage** (`src/pages/routing/RoutePlanningPage.tsx`) - Pianificazione percorsi
- **ShippingManagementPage** (`src/pages/shipping/ShippingManagementPage.tsx`) - Gestione spedizioni
- **SlottingOptimizationPage** (`src/pages/slotting/SlottingOptimizationPage.tsx`) - Ottimizzazione slotting
- **SuppliersPage** (`src/pages/suppliers/SuppliersPage.tsx`) - Gestione fornitori
- **TaskAssignmentPage** (`src/pages/tasks/TaskAssignmentPage.tsx`) - Assegnazione task
- **ValueAddedServicesPage** (`src/pages/vas/ValueAddedServicesPage.tsx`) - Servizi a valore aggiunto
- **WarehouseLayoutPage** (`src/pages/warehouse/WarehouseLayoutPage.tsx`) - Layout magazzino
- **WavePlanningPage** (`src/pages/waves/WavePlanningPage.tsx`) - Pianificazione ondate
- **YardManagementPage** (`src/pages/yard/YardManagementPage.tsx`) - Gestione piazzale
- **AssetTrackingPage** (`src/pages/assets/AssetTrackingPage.tsx`) - Tracciamento asset
- **AnalyticsHubPage** (`src/pages/analytics/AnalyticsHubPage.tsx`) - Hub analytics

**Totale Pagine Create**: 90+ pagine React
**Pagine con API Reali**: 5 pagine core
**Pagine Template/Estese**: 85+ pagine

---

## Servizio API Centralizzato

**File**: `src/services/api.ts` (700+ lines)

Fornisce client completo TypeScript per tutte le API REST con gestione errori, timeout e utility per formattazione date.

---

## Dettaglio Pagine Core con API Reali

### 1. **ItemsManagementPage** (650+ lines) - CRUD Completo
**Endpoint**: `GET/POST /Items`
**Funzionalità**:
- CRUD completo articoli (Create, Read, Update, Delete)
- Dialog insert/edit con validation completa
- Filtri di ricerca avanzati con paginazione server-side
- Gestione stato stock/sottoscorta con indicatori visivi
- Tabella Material-UI con sorting e filtering
- Gestione errori con feedback utente

**Mappatura Java**: `AnagraficaArticoloPanel` - Pannello completo per gestione anagrafica articoli

### 2. **ListsManagementPage** (550+ lines) - Gestione Liste Completa
**Endpoint**: `GET/POST /Lists`
**Funzionalità**:
- Visualizzazione liste picking/refilling/inventario
- Filtri per tipo lista (0=Picking, 1=Refilling, 2=Inventario)
- Filtri per stato (1=Aperta, 2=In Corso, 3=Completata)
- Dialog dettagli con tabella righe lista nested
- Calcolo automatico progresso con progress bar
- Eliminazione liste con conferma

**Mappatura Java**: `GestioneListePanel` - Pannello gestione liste magazzino

### 3. **StockPage** (180+ lines) - Giacenze Real-time
**Endpoint**: `GET /Stock`
**Funzionalità**:
- Giacenze in tempo reale dal database SQL Server PROMAG
- Filtri per codice articolo e ID magazzino
- Visualizzazione dettagli lotto/scadenza/UDC
- Paginazione configurabile (25/50/100/200 righe)
- Aggiornamento manuale dati

**Mappatura Java**: Vari pannelli stock (`StockPanel`, `GiacenzePanel`)

### 4. **MovementsPage** (150+ lines) - Storico Movimenti
**Endpoint**: `GET /Movements`
**Funzionalità**:
- Storico completo movimenti magazzino
- Icone trend (TrendingUp/TrendingDown) per delta quantità
- Colori differenziati (verde/rosso) per aumento/diminuzione
- Filtri per articolo e numero lista
- Visualizzazione utente e magazzino per ogni movimento

**Mappatura Java**: Pannelli movimenti (`MovimentiPanel`, `StoricoMovimentiPanel`)

### 5. **DashboardPage** (100+ lines) - Dashboard Statistiche
**Endpoint**: Multiple APIs parallele (`/Items`, `/Lists`, `/Stock`, `/Movements`)
**Funzionalità**:
- 4 cards con statistiche aggregate (Articoli, Liste, Giacenze, Movimenti)
- Chiamate API parallele con `Promise.all` per performance
- Refresh manuale statistiche
- Icone Material-UI dedicate per ogni metrica
- Loading states individuali per ogni card

**Mappatura Java**: `ClientMainFrame` - Frame principale con dashboard

---

## File Documentazione

- `docs/API-DOCUMENTATION.md` - Documentazione completa API REST (500+ lines)
- `docs/JAVA-REACT-MAPPING.md` - Questo documento
- `tests/api-endpoints.spec.cjs` - Test Playwright per API (400+ lines)

---

## Caratteristiche Implementate

✅ **UI Moderna Material-UI**
- Design responsivo con Grid layout
- Cards, Tables, Dialogs
- Icons, Chips, Tooltips
- Loading states e error handling

✅ **Funzionalità Complete**
- Paginazione server-side
- Filtri di ricerca multipli
- CRUD operations con validazione
- Real-time data dal database SQL Server

✅ **Type Safety**
- TypeScript completo
- Interfacce per tutte le API
- Type checking su form e stati

✅ **Best Practices**
- Gestione stati con hooks
- Error boundaries
- Success/Error feedback
- Conferme eliminazione

---

## Statistiche Progetto

### Linee di Codice
- **API Service**: 700+ linee (src/services/api.ts)
- **Pagine Core con API Reali**: ~1,630 linee totali
  - ItemsManagementPage: 650+ linee
  - ListsManagementPage: 550+ linee
  - StockPage: 180+ linee
  - MovementsPage: 150+ linee
  - DashboardPage: 100+ linee
- **Pagine Template/Estese**: 85+ pagine aggiuntive
- **Documentazione**: 600+ linee (API-DOCUMENTATION.md + JAVA-REACT-MAPPING.md)
- **Test Playwright**: 400+ linee (api-endpoints.spec.cjs)

### Componenti Java Analizzati
- **Totale componenti UI Java**: 400+ classi Swing/AWT
- **Framework base**: JFrameBase, JPanelBase, JDialogBase
- **Componenti custom**: JHibernateDataGrid, JTabbedClosablePane
- **Pannelli principali mappati**: 5 pannelli core → 5 pagine React funzionanti

### Architettura
- **Backend**: Spring Framework REST API + Hibernate ORM
- **Frontend**: React 18 + TypeScript + Material-UI v5
- **Database**: SQL Server 2019 - Database PROMAG (produzione)
- **Server**: Jetty 9.4.1 embedded
- **API Endpoint**: http://localhost:3079/EjLogHostVertimag

### Funzionalità Implementate con Database Reale
✅ **Gestione Articoli** - CRUD completo con validazione
✅ **Gestione Liste** - Picking, Refilling, Inventario con progresso
✅ **Giacenze** - Visualizzazione real-time stock
✅ **Movimenti** - Storico completo con trend analysis
✅ **Dashboard** - Statistiche aggregate multi-API

### Prossimi Sviluppi Possibili
- Implementare API reali per pagine template esistenti
- Aggiungere autenticazione JWT/OAuth
- Implementare WebSocket per notifiche real-time
- Aggiungere export Excel/PDF per report
- Implementare grafici e analytics avanzate
- Ottimizzare bundle con code-splitting
- Aggiungere PWA support per uso offline

---

**Versione**: 2.0
**Data**: 21 Novembre 2025
**Backend Version**: EjLog 2.3.12.4
**Progetto**: Migrazione completa da Java Swing Desktop a React Web Application

