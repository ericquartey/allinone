/**
 * Menu Routes
 * Gestione menu dinamico basato sui permessi utente
 */

import express from 'express';

const router = express.Router();

// Menu completo con tutte le voci
const FULL_MENU = [
  { id: 'dashboard', label: 'Dashboard', icon: 'Dashboard', path: '/', order: 1, visible: true },
  { id: 'lists', label: 'Liste', icon: 'List', path: '/lists-management', order: 2, visible: true },
  { id: 'operazioni', label: 'OPERAZIONI', icon: '', path: '', order: 3, visible: true },
  { id: 'stock', label: 'Stock', icon: 'Inventory', path: '/stock', order: 4, visible: true },
  { id: 'movements', label: 'Movimenti', icon: 'SwapHoriz', path: '/movements', order: 5, visible: true },
  { id: 'products', label: 'Prodotti', icon: 'Category', path: '/products', order: 6, visible: true },
  { id: 'locations', label: 'Ubicazioni', icon: 'Place', path: '/locations', order: 7, visible: true },
  { id: 'magazzino', label: 'MAGAZZINO', icon: '', path: '', order: 8, visible: true },
  { id: 'udc', label: 'UDC', icon: 'Widgets', path: '/udc', order: 9, visible: true },
  { id: 'drawers', label: 'Gestione Cassetti', icon: 'Inbox', path: '/drawers', order: 10, visible: true },
  { id: 'machines', label: 'Macchine', icon: 'Settings', path: '/machines', order: 11, visible: true },
  { id: 'configurazione', label: 'CONFIGURAZIONE', icon: '', path: '', order: 12, visible: true },
  { id: 'users', label: 'Utenti', icon: 'People', path: '/users', order: 13, visible: true },
  { id: 'plc', label: 'PLC', icon: 'Settings', path: '/plc', order: 14, visible: true },
  { id: 'alarms', label: 'Allarmi', icon: 'Warning', path: '/alarms', order: 15, visible: true },
  { id: 'reports', label: 'Report', icon: 'Assessment', path: '/reports', order: 16, visible: true },
];

/**
 * GET /api/menu
 * Restituisce il menu per l'utente corrente
 */
router.get('/', (req, res) => {
  try {
    // Per ora restituiamo il menu completo
    // In futuro si può filtrare in base ai permessi utente
    res.json({
      success: true,
      items: FULL_MENU,
      userPermissions: ['*'], // Tutti i permessi
      userRoles: ['admin']
    });
  } catch (error) {
    console.error('Errore getMenu:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/menu/all
 * Restituisce tutti gli elementi del menu (per admin)
 */
router.get('/all', (req, res) => {
  try {
    res.json({
      success: true,
      items: FULL_MENU,
      userPermissions: ['*'],
      userRoles: ['admin']
    });
  } catch (error) {
    console.error('Errore getAllMenuItems:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/menu/permissions
 * Restituisce i permessi dell'utente corrente
 */
router.get('/permissions', (req, res) => {
  try {
    res.json({
      success: true,
      data: ['*'] // Tutti i permessi
    });
  } catch (error) {
    console.error('Errore getUserPermissions:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
