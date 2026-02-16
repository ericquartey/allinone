# PPC UI Migration (WPF -> React)

## Scope
- Source UI: `C:\F_WMS\VerticalWarehouses\Panel PC UI` (WPF/XAML).
- Target app: `C:\F_WMS\dev\workspacesEjlog\EjLog\documentazioni\ejlog-react-webapp`.
- Goal: port Panel PC UI to React with functional parity and matching visuals.

## Inventory Summary (from `src/features/ppc/ppcViews.ts`)
- controls: 52 views
- controls-converters: 1 view
- controls-skins: 39 views
- controls-styles: 25 views
- controls-templates: 12 views
- errors: 5 views
- installation: 105 views
- keyboards-controls: 2 views
- layout: 4 views
- login: 2 views
- menu: 11 views
- operator: 108 views
- scaffolding-app-xaml: 1 view
- scaffolding-controls: 3 views
- scaffolding-keyboard-window-xaml: 1 view
- scaffolding-scaffolder-window-xaml: 1 view
- scaffolding-styles: 1 view
- ferretto-vw-app-app-xaml: 1 view
- ferretto-vw-app-shell-xaml: 1 view

## WPF UI Structure Notes
- Layout: `Ferretto.VW.App.Modules/Layout/Views/LayoutView.xaml` defines header/main/footer regions.
- Login: `Ferretto.VW.App.Modules/Login/Views/LoginView.xaml` uses a two-column card with background image, banner, and login controls.
- Menu: `Ferretto.VW.App.Modules/Menu/Views/MainMenuView.xaml` and `InstallationMenuView.xaml` are the main navigation entry points.
- Operator: `Ferretto.VW.App.Modules/Operator/Views/OperatorMenuView.xaml` is the operator landing menu.
- Errors: `Ferretto.VW.App.Modules/Errors/Views/ErrorDetailsView.xaml` is the primary error detail screen.
- Controls/Templates/Skins: `Ferretto.VW.App.Controls` defines core UI atoms (buttons, sensors, grids) and themes.

## Backend Integration Map (MAS Automation Service)
- App settings source: `C:\F_WMS\VerticalWarehouses\Panel PC UI\Ferretto.VW.App\App.config`.
- REST base URL: `AutomationService:Url` (default `http://localhost:5000`).
- SignalR hubs:
  - Installation: `AutomationService:Hubs:Installation:Path` (default `/installation-endpoint`).
  - Operator: `AutomationService:Hubs:Operator:Path` (default `/operator-endpoint`).
- Health checks:
  - Live: `/health/live`
  - Ready: `/health/ready`
- Common headers in WPF:
  - `Bay-Number`: value from `BayNumber` app setting (default `1`).
  - `Accept-Language`: value from `Language` app setting (default `it-IT`).
- Core REST endpoints used in menu/header flows:
  - Identity: `GET /api/identity`
  - Mode: `GET /api/mode`, `POST /api/mode/automatic`, `POST /api/mode/manual`
  - Power: `GET /api/power`, `POST /api/power/on`, `POST /api/power/off`
  - WMS status: `GET /api/wms/status/enabled`
  - Errors: `GET /api/errors/current`
  - Cells (warehouse fill): `GET /api/cells`

## React Entry Routes (PPC menu defaults)
- PPC Home: `/ppc`
- PPC Module Index: `/ppc/:module`
- PPC View: `/ppc/:module/:view`
- Operator: `/ppc/operator`
- Installation: `/ppc/installation`
- Errors: `/ppc/errors`
- Menu: `/ppc/menu`
- Layout: `/ppc/layout`
- Login: `/ppc/login`
- Admin (React-only): `/ppc/admin`

## PPC UI Pages Report
- Full list of PPC routes + labels: `docs/PPC_UI_PAGES_REPORT.md`.
- Playwright smoke report (module index routes): `docs/PPC_UI_PLAYWRIGHT_REPORT.md`.
- Playwright full report (all PPC routes): `docs/PPC_UI_PLAYWRIGHT_REPORT_FULL.md`.

## Plan & Status
- [x] Inventory WPF XAML modules and React PPC registry.
- [x] Define PPC menu default routes for correct entry screens.
- [x] Publish PPC UI pages report from the PPC registry.
- [x] Update main app menu to link PPC modules (module index routes).
- [x] Validate PPC module index routes with Playwright smoke; document report.
- [x] Validate all PPC routes with Playwright; document report.
- [x] Add MAS Automation REST client + config (base URL, headers, hub paths).
- [ ] Add MAS Automation SignalR client layer for installation/operator hubs.
- [x] Wire main menu + header to live machine identity/mode/power/errors data.
- [ ] Replace PPC placeholder data across modules with real API calls and hub events.
- [ ] Re-run Playwright sweep after data integration.

## Progress Log
- 2025-12-30: Inventory completed; PPC menu defaults aligned with WPF entry screens.
- 2025-12-30: PPC UI pages report published; PPC menu updated to module links.
- 2025-12-30: Playwright smoke (module index routes) completed; report published.
- 2025-12-30: Playwright full PPC routes completed; report published.
- 2025-12-30: Copied WPF PPC assets to `public/ppc-assets` and extracted IT strings to `src/features/ppc/ppcStrings.it.json`.
- 2025-12-30: Implemented PPC shell + header/footer and initial Menu/Login pages in React.
- 2025-12-30: Playwright quick check passed for `/ppc/menu/main-menu`, `/ppc/login/login`, `/ppc/login/loader`.
- 2025-12-30: Implemented PPC menu subpages (accessories/bays/cells/elevator/installation/loading-units/maintenance/other) and navigation menu/footer.
- 2025-12-30: Playwright quick check passed for all PPC menu/login routes.
- 2025-12-30: Implemented PPC Errors module screens (details, inverter fault, load unit errors, loadunit missing, zero sensor) with React layouts and assets.
- 2025-12-30: Implemented Layout module screens (header/footer/layout/diagnostic details) and wired layout handling in `PpcShell`.
- 2025-12-30: Playwright smoke check passed for PPC Errors/Layout routes.
- 2025-12-30: Playwright full PPC route sweep re-run after Errors/Layout changes; no failures.
- 2025-12-30: Started Installation module port; added Sensors navigation and core sensor pages (bay IO 1/2/3, bays, other, admin, vertical axis).
- 2025-12-30: Added Installation Accessories screens (alphanumeric bar, barcode reader config/settings, card reader, label printer, laser pointer, token reader, weighting scale) plus device info and browser placeholders.
- 2025-12-30: Added Installation Bays/Cells/Profile calibration screens (bay check, BED test, carousel/external bay calibration, deposit/pickup, sensitive alarm, cell panels, cell height/side control, fix back drawers, load first drawer, new cell panels, profile height/resolution).
- 2025-12-30: Playwright full PPC route sweep re-run after Installation bays/cells/profile additions; no failures.
- 2025-12-30: Added Installation Elevator calibration screens (belt burnishing, call drawer, weight analysis/check, horizontal chain/resolution, vertical origin/offset/resolution, weight calibration).
- 2025-12-30: Playwright full PPC route sweep re-run after Installation elevator additions; no failures.
- 2025-12-30: Main menu updated to match WPF PPC UI layout/colors and card navigation.
- 2025-12-30: Added MAS Automation Service proxy/config + PPC REST client and live data hook for main menu/header.
- 2025-12-30: Error details page now reads current MAS errors and resolves via API.
- 2025-12-30: Accessories settings pages wired to MAS Automation Service (alpha bar, barcode reader, card reader, label printer, laser pointer, token reader, weighting scale).
- 2025-12-30: Main menu status bar updated with logo + icon set to match PPC UI reference.
- 2025-12-30: Main app PPC UI menu trimmed to core modules and linked to default PPC entry routes.
- 2025-12-30: Main menu button 04 now routes to Movements for operator access or Installation for installer access.
- 2025-12-30: Added Movements page layout + MAS wiring (sensors, light, elevator moves, carousel/external bay/shutter, machine config).
- 2025-12-30: Expanded Movements guided/manual actions (calibrations, shutter positions, bay/external bay moves, load unit routing, policy bypass).
