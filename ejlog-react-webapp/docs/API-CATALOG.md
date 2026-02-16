# EjLog WMS API Catalog

This document lists the API surface in this repository, what each group connects to, and key dependencies.
It is based on server route mounts in server/api-server.js and the route files under server/routes.

## Runtime overview

- Frontend: Vite dev server on http://localhost:3000
- Backend HTTP (real data): http://localhost:3077
- Backend HTTPS: https://localhost:3079
- Legacy host path: /EjLogHostVertimag/* is still served by the Node backend for backward compatibility.

## Primary dependencies

- SQL Server database: localhost\SQL2019, database name promag
- WebSocket: ws://localhost:3077/ws
- Scheduler service: in-process in server/scheduler/*
- Adapter (integrated): server/routes/adapter-routes.js
- AI assistant: server/routes/ai-assistant.js, external providers via env
- Integrations: server/routes/integrations.js (SAP, ERP, EDI, OData, AS2, SFTP)

## API groups (mounted)

All mounted under /api unless noted.

### Auth
- /api/auth/login
- /api/auth/logout
- /api/auth/verify
- /api/auth/password-hint
- /api/auth/refresh
- /api/auth/refresh/logout
- /api/auth/refresh/revoked-count
Dependencies: JWT secrets, optional auth in dev; SQL for users.

### Users (core - Utenti table)
Mounted at /api/users (server/routes/users.js)
- GET /api/users
- GET /api/users/search
- GET /api/users/:id
- POST /api/users
- PUT /api/users/:id
- PUT /api/users/:id/password
- DELETE /api/users/:id
Dependencies: SQL tables Utenti, GruppiUtenti.

### User management (WmsUsers table)
Mounted at /api/user-management (server/routes/user-management.js)
- GET /api/user-management
- GET /api/user-management/:id
- POST /api/user-management
- PUT /api/user-management/:id
- DELETE /api/user-management/:id
- GET /api/user-management/roles/list
- POST /api/user-management/:id/reset-password
Dependencies: SQL tables WmsUsers, WmsRoles, WmsUserPermissions.

### User groups
Mounted at /api/user-groups (server/routes/groups.js)
- GET /api/user-groups
- GET /api/user-groups/:id
- POST /api/user-groups
- PUT /api/user-groups/:id
- DELETE /api/user-groups/:id
Dependencies: SQL tables GruppiUtenti and related mappings.

### Login history
Mounted at /api/login-history (server/routes/login-history.js)
- GET /api/login-history
- GET /api/login-history/stats
- POST /api/login-history
- DELETE /api/login-history/old
Dependencies: SQL login history tables.

### Items (real inventory)
Mounted at /api/items (server/routes/items.js)
- GET /api/items
- GET /api/items/:id
- POST /api/items
- PUT /api/items/:id
- DELETE /api/items/:id
- GET /api/items/:id/stock
- GET /api/items/:id/images
Legacy alias: /EjLogHostVertimag/Items
Dependencies: SQL tables Articoli, UdcProdotti, Udc, Locazioni.

### Item images (filesystem mapping)
Mounted at /api/item-images (server/routes/item-images.js)
- GET /api/item-images/settings
- PUT /api/item-images/settings
- GET /api/item-images/file/:itemCode
Dependencies: local filesystem path configured via settings.

### UDC (loading units)
Mounted at /api/udc (server/routes/udc.js)
- GET /api/udc
- GET /api/udc/:id
- GET /api/udc/:id/compartments
- POST /api/udc/:id/move
- POST /api/udc/:id/items
- DELETE /api/udc/:udcId/items/:itemId
- POST /api/udc/:id/sort
Dependencies: SQL tables Udc, UdcSupporti, UdcProdotti, MissioniTrasloBuffer, Locazioni.

### Loading units (new + legacy)
Mounted at /api/loading-units (server/routes/loading-units-new.js)
Legacy alias: /EjLogHostVertimag/api/loading-units (server/routes/loading-units.js)
Dependencies: SQL Udc + related tables.

### Compartments
Mounted at /api/compartments (server/routes/compartments.js)
- GET /api/compartments/loading-units/:id/compartments
- POST /api/compartments/loading-units/:id/compartments
- GET /api/compartments/:id
- PUT /api/compartments/:id
- DELETE /api/compartments/:id
Dependencies: SQL UdcSupporti.

### Lists (legacy host API)
Mounted at /api/lists and /EjLogHostVertimag/Lists (server/routes/lists.js)
Includes a large set of actions:
- GET /api/lists, GET /api/lists/:id, GET /api/lists/:listNumber
- PUT /api/lists/:id/execute
- PUT /api/lists/:id/book
- PUT /api/lists/:listNumber/waiting
- POST /api/lists/:id/terminate
- POST /api/lists/:id/duplicate
- POST /api/lists/:id/save-as-template
- POST /api/lists/merge, /priority, /sequence, /destination
- PTL control: /api/lists/ptl/*
Dependencies: SQL lists tables, legacy list workflows.

### Item lists (modern REST)
Mounted at /api/item-lists (server/routes/item-lists.js)
- GET /api/item-lists
- GET /api/item-lists/:id
- GET /api/item-lists/:code/num
- GET /api/item-lists/:id/items
- POST /api/item-lists
- POST /api/item-lists/:id/rows
- POST /api/item-lists/:id/reserve
- POST /api/item-lists/:id/rereserve
- POST /api/item-lists/:id/waiting
Dependencies: SQL lists and rows tables.

### Operations
Mounted at /api/operations (server/routes/operations.js)
- GET /api/operations
- GET /api/operations/:id
- GET /api/operations/:id/aggregate
- GET /api/operations/by-params
- POST /api/operations/:id/execute
- POST /api/operations/:id/complete
- POST /api/operations/:id/suspend
- POST /api/operations/send-id
- GET /api/operations/reasons
- GET /api/operations/available-orders
- GET /api/operations/extra-combo
Dependencies: SQL operations and mission tables.

### Missions
Mounted at /api/missions (server/routes/missions.js)
- GET /api/missions (active, completed, by-type, stats)
- GET /api/missions/:id
- POST /api/missions
- PUT /api/missions/:id/abort
- DELETE /api/missions/queue/:id
Dependencies: SQL mission tables, scheduler.

### Locations
Mounted at /api/locations and /EjLogHostVertimag/Locations (server/routes/locations.js)
- GET /api/locations
- GET /api/locations/:id
- GET /api/locations/:id/udcs
- POST /api/locations/:id/block
- POST /api/locations/:id/unblock
- GET /api/locations/:id/movements
- GET /api/locations/:id/statistics
Dependencies: SQL Locazioni and Udc.

### Stock and movements
Mounted at /api/stock (server/routes/stock.js)
Mounted at /api/stock-movements (server/routes/stock-movements.js)
Legacy alias: /EjLogHostVertimag/Stock
Dependencies: SQL UdcProdotti, Movimenti.

### Events
Mounted at /api/events and /EjLogHostVertimag/Events (server/routes/events.js)
- GET /api/events
- GET /api/events/stats
- GET /api/events/:id
Dependencies: SQL Events.

### Machines and destination groups
- /api/machines (server/routes/machines.js)
- /api/destination-groups (server/routes/destination-groups.js)
Dependencies: SQL machine and routing tables.

### PTL (Put To Light)
- /api/ptl (server/routes/ptl.js)
- /api/ptl-config (server/routes/ptl-config.js)
Dependencies: SQL PTL config tables and external PTL devices.

### Scheduler
- /api/scheduler (server/routes/scheduler.js)
- /api/scheduler-config (server/routes/scheduler-config.js)
- /api/scheduler-status (server/routes/scheduler-status.js)
- /api/scheduler-logics (server/routes/scheduler-logics.js)
Dependencies: SQL scheduler tables, scheduler workers.

### Reports and export/import
- /api/reports (server/routes/custom-reports.js)
- /api/data-export-import (server/routes/data-export-import.js)
- /api/report-scheduler (server/routes/report-scheduler.js)
Dependencies: SQL report tables and export jobs.

### Analytics
- /api/analytics (server/routes/analytics.js)
Dependencies: SQL reporting views.

### Notifications
- /api/notifications (server/routes/notifications.js)
Dependencies: SQL notifications tables.

### Barcodes
- /api/barcodes (server/routes/barcode-rules.js)
- /api/barcode (server/routes/barcode-scanner.js)
Dependencies: SQL barcode rules and scan history.

### Dashboard config
- /api/dashboard (server/routes/dashboard-config.js)
Dependencies: SQL dashboard preferences.

### User stats
- /api/user-stats (server/routes/user-stats.js)
Dependencies: SQL user activity.

### AI assistant
- /api/ai (server/routes/ai-assistant.js)
- /api/ai-config (server/routes/ai-config.js)
Dependencies: OpenAI or Anthropic API keys, optional.

### Integrations
- /api/integrations (server/routes/integrations.js)
Endpoints include:
- GET /api/integrations
- GET /api/integrations/status
- GET /api/integrations/logs
- GET /api/integrations/:key
- PUT /api/integrations/:key
- POST /api/integrations/:key/test
- POST /api/integrations/:key/sync
- OData helpers: /api/integrations/:key/odata/validate, /odata/suggest
- EDI/AS2: /api/integrations/:key/edi/*
Dependencies: external ERP/SAP/OData endpoints, AS2, SFTP.

### Adapter (integrated)
- /api/adapter/* (server/routes/adapter-routes.js)
Provides a REST facade for items, lists, loading units, and mission operations.
Dependencies: SQL and internal service logic; also file upload for images.

## Legacy routes (backward compatibility)

These are also served by the Node backend:
- /EjLogHostVertimag/Items
- /EjLogHostVertimag/Locations
- /EjLogHostVertimag/Stock
- /EjLogHostVertimag/Events
- /EjLogHostVertimag/Lists
- /EjLogHostVertimag/api/loading-units

## Present but not mounted (code exists, not wired in api-server.js)

- server/routes/warehouses.js
- server/routes/menu.js
- server/routes/ppc-installation.js
- server/routes/item-lists-enhanced.js
- server/routes/scheduler-management.js
- server/routes/users.js.backup (backup only)

## Frontend API clients (selected)

- src/services/api/itemsApi.ts -> /api/items (real SQL)
- src/services/drawersApi.ts -> /api/udc and /api/udc/:id/compartments (real SQL)
- src/services/api/usersApi.ts -> /api/users (Utenti)
- src/pages/UserManagement.tsx -> /api/user-management (WmsUsers)

## Duplications resolved

- /api/users had overlapping routers (Utenti and WmsUsers). The WmsUsers router now mounts at /api/user-management.

## Notes

- Real data lives in SQL Server database promag. If data is missing, verify backend on port 3077 and SQL connectivity.
- Vite proxy is used in development when API_BASE_URL is empty.

