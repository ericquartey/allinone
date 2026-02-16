/**
 * SAFE Lists Routes - WORKAROUND per problema INSERT NULL
 * Questo endpoint GARANTISCE che daVerificare e prenotazioneIncrementale siano sempre presenti
 */

import express from 'express';
import { getPool } from '../db-config.js';

const router = express.Router();

// POST /api/lists-safe - SAFE endpoint che funziona SEMPRE
router.post('/', async (req, res) => {
  try {
    const pool = await getPool();
    const {
      listNumber,
      description,
      tipoLista,
      stato = 1,
      priority = 1,
      areaId = 1
    } = req.body;

    console.log('[SAFE] Creating list with GUARANTEED fields:', { description, tipoLista, priority, areaId });

    // Validate
    if (tipoLista === undefined || tipoLista === null) {
      return res.status(400).json({
        success: false,
        message: 'tipoLista è obbligatorio'
      });
    }

    // Generate list number
    const prefixMap = {
      0: 'PICK',
      1: 'REF',
      2: 'INV',
      3: 'TRA',
      4: 'RET',
      5: 'PRO',
    };

    const prefix = prefixMap[tipoLista] || 'LST';
    const maxIdQuery = 'SELECT ISNULL(MAX(id), 0) as maxId FROM Liste';
    const maxIdResult = await pool.request().query(maxIdQuery);
    const finalId = maxIdResult.recordset[0].maxId + 1;
    const numLista = listNumber || `${prefix}${String(finalId).padStart(4, '0')}`;

    console.log(`[SAFE] Using ID: ${finalId}, numLista: ${numLista}`);

    // INSERT con TUTTI i campi obbligatori - GARANTITO
    const insertQuery = `
      INSERT INTO Liste (
        id,
        numLista,
        descrizione,
        idTipoLista,
        idStatoControlloEvadibilita,
        dataCreazione,
        dataModifica,
        terminata,
        daVerificare,
        prenotazioneIncrementale
      )
      VALUES (
        @id,
        @numLista,
        @descrizione,
        @idTipoLista,
        @stato,
        GETDATE(),
        GETDATE(),
        0,
        0,
        0
      )
    `;

    await pool.request()
      .input('id', finalId)
      .input('numLista', numLista)
      .input('descrizione', description || numLista)
      .input('idTipoLista', tipoLista)
      .input('stato', stato)
      .query(insertQuery);

    // Insert area details if provided
    if (areaId) {
      const insertAreaQuery = `
        INSERT INTO ListeAreaDetails (
          idLista,
          idArea,
          priorita,
          sequenzaLancio
        )
        VALUES (
          @idLista,
          @idArea,
          @priorita,
          1
        )
      `;

      await pool.request()
        .input('idLista', finalId)
        .input('idArea', areaId)
        .input('priorita', priority)
        .query(insertAreaQuery);
    }

    console.log(`[SAFE] ✅ List created successfully: ${numLista} (ID: ${finalId})`);

    res.status(201).json({
      success: true,
      message: 'Lista creata con successo',
      data: {
        id: finalId,
        listNumber: numLista,
        description: description || numLista,
        type: tipoLista,
        status: stato
      }
    });

  } catch (error) {
    console.error('[SAFE] ❌ Error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante la creazione',
      error: error.message
    });
  }
});

export default router;
