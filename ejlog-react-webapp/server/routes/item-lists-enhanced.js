/**
 * Enhanced Item Lists Routes
 * Complete CRUD endpoints + gestione esecuzione + funzioni avanzate
 */

import express from 'express';
import { asyncHandler } from '../middleware/error-handler.js';
import { validate, validateId, validatePagination } from '../middleware/validator.js';
import { body } from 'express-validator';
import { sql, getPool } from '../db-config.js';
import {
  getItemLists,
  getItemListById,
  createItemList,
  updateItemList,
  deleteItemList,
  deleteAllLists,
  executeList,
  pauseList,
  resumeList,
  completeList,
  cancelList,
  copyList,
  getItemListItems,
  addItemToList,
  updateListItem,
  removeItemFromList,
  getListHistory
} from '../controllers/item-lists-enhanced.controller.js';

const router = express.Router();

// ============================================
// CRUD Liste
// ============================================

/**
 * GET /api/lists
 * Lista liste con filtri avanzati
 * Query params: type, status, priority, dateFrom, dateTo, operator, destination, hasInevadibili, search
 */
router.get('/',
  validatePagination,
  asyncHandler(getItemLists)
);

/**
 * GET /api/lists/:id
 * Dettaglio lista singola
 */
router.get('/:id',
  validateId('id'),
  asyncHandler(getItemListById)
);

/**
 * POST /api/lists
 * Crea nuova lista
 */
router.post('/',
  [
    body('code').notEmpty().withMessage('Codice lista obbligatorio'),
    body('type').notEmpty().isIn(['Picking', 'Refilling', 'Inventario', 'Riordino'])
      .withMessage('Tipo lista non valido'),
    body('priority').optional().isIn(['Alta', 'Media', 'Bassa'])
      .withMessage('Priorità non valida'),
    body('userId').isInt().withMessage('ID utente obbligatorio'),
  ],
  validate,
  asyncHandler(createItemList)
);

/**
 * PUT /api/lists/:id
 * Modifica lista
 */
router.put('/:id',
  validateId('id'),
  [
    body('code').optional().notEmpty(),
    body('priority').optional().isIn(['Alta', 'Media', 'Bassa']),
  ],
  validate,
  asyncHandler(updateItemList)
);

/**
 * GET /api/lists/:id/dependencies
 * Verifica dipendenze lista prima dell'eliminazione
 */
router.get('/:id/dependencies',
  validateId('id'),
  asyncHandler(async (req, res) => {
    const pool = await getPool();
    const { id } = req.params;

    const dependencies = {
      canDelete: true,
      reasons: [],
      details: {}
    };

    // Check operazioni
    try {
      const opsCheck = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT COUNT(*) as count FROM LogOperazioni WHERE idLista = @id');

      if (opsCheck.recordset[0].count > 0) {
        dependencies.canDelete = false;
        dependencies.reasons.push(`${opsCheck.recordset[0].count} operazioni collegate`);
        dependencies.details.operations = opsCheck.recordset[0].count;
      }
    } catch (err) {
      // Tabella non esiste
    }

    // Check missioni
    try {
      const missionsCheck = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT COUNT(*) as count FROM MissioniTraslo WHERE idLista = @id');

      if (missionsCheck.recordset[0].count > 0) {
        dependencies.canDelete = false;
        dependencies.reasons.push(`${missionsCheck.recordset[0].count} missioni collegate`);
        dependencies.details.missions = missionsCheck.recordset[0].count;
      }
    } catch (err) {
      // Tabella non esiste
    }

    // Check prenotazioni
    try {
      const reservationsCheck = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT COUNT(*) as count FROM Prenotazioni WHERE idLista = @id');

      if (reservationsCheck.recordset[0].count > 0) {
        dependencies.canDelete = false;
        dependencies.reasons.push(`${reservationsCheck.recordset[0].count} prenotazioni attive`);
        dependencies.details.reservations = reservationsCheck.recordset[0].count;
      }
    } catch (err) {
      // Tabella non esiste
    }

    res.json({
      success: true,
      data: dependencies
    });
  })
);

/**
 * DELETE /api/lists/all
 * Elimina TUTTE le liste
 * Query params:
 *  - force: true/false (elimina anche dipendenze)
 *  - excludeInProgress: true/false (esclude liste in esecuzione)
 * ⚠️ OPERAZIONE PERICOLOSA
 */
router.delete('/all',
  asyncHandler(deleteAllLists)
);

/**
 * DELETE /api/lists/:id
 * Elimina lista singola
 */
router.delete('/:id',
  validateId('id'),
  asyncHandler(deleteItemList)
);

// ============================================
// Esecuzione Liste
// ============================================

/**
 * POST /api/lists/:id/execute
 * Avvia esecuzione lista
 */
router.post('/:id/execute',
  validateId('id'),
  [
    body('userId').isInt().withMessage('ID utente obbligatorio')
  ],
  validate,
  asyncHandler(executeList)
);

/**
 * POST /api/lists/:id/pause
 * Metti in pausa
 */
router.post('/:id/pause',
  validateId('id'),
  asyncHandler(pauseList)
);

/**
 * POST /api/lists/:id/resume
 * Riprendi esecuzione
 */
router.post('/:id/resume',
  validateId('id'),
  asyncHandler(resumeList)
);

/**
 * POST /api/lists/:id/complete
 * Completa lista
 */
router.post('/:id/complete',
  validateId('id'),
  asyncHandler(completeList)
);

/**
 * POST /api/lists/:id/cancel
 * Annulla lista
 */
router.post('/:id/cancel',
  validateId('id'),
  [
    body('reason').notEmpty().withMessage('Motivo annullamento obbligatorio')
  ],
  validate,
  asyncHandler(cancelList)
);

/**
 * POST /api/lists/:id/copy
 * Duplica lista
 */
router.post('/:id/copy',
  validateId('id'),
  [
    body('newCode').notEmpty().withMessage('Codice nuova lista obbligatorio'),
    body('userId').isInt().withMessage('ID utente obbligatorio')
  ],
  validate,
  asyncHandler(copyList)
);

// ============================================
// Gestione Righe Liste
// ============================================

/**
 * GET /api/lists/:id/items
 * Righe lista (dettaglio)
 */
router.get('/:id/items',
  validateId('id'),
  asyncHandler(getItemListItems)
);

/**
 * POST /api/lists/:id/items
 * Aggiungi riga a lista
 */
router.post('/:id/items',
  validateId('id'),
  [
    body('itemId').isInt().withMessage('ID articolo obbligatorio'),
    body('quantity').isFloat({ min: 0.01 }).withMessage('Quantità deve essere maggiore di 0')
  ],
  validate,
  asyncHandler(addItemToList)
);

/**
 * PUT /api/lists/:listId/items/:itemId
 * Modifica riga lista
 */
router.put('/:listId/items/:itemId',
  validateId('listId'),
  validateId('itemId'),
  asyncHandler(updateListItem)
);

/**
 * DELETE /api/lists/:listId/items/:itemId
 * Elimina riga da lista
 */
router.delete('/:listId/items/:itemId',
  validateId('listId'),
  validateId('itemId'),
  asyncHandler(removeItemFromList)
);

// ============================================
// Storico e Report
// ============================================

/**
 * GET /api/lists/:id/history
 * Storico lista
 */
router.get('/:id/history',
  validateId('id'),
  asyncHandler(getListHistory)
);

export default router;
