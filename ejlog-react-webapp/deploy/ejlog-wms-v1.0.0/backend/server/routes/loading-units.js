/**
 * Loading Units (UDC/Cassetti) Routes
 * Gestione delle unità di carico e scomparti
 */

import express from 'express';
import { getPool } from '../db-config.js';

const router = express.Router();

/**
 * GET /api/EjLogHostVertimag/api/loading-units
 * Get all loading units with optional filters
 */
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();

    console.log('[API] GET /loading-units - Tentativo connessione database...');

    // IMPORTANT: Query per ottenere gli UDC
    // Tentativo con diverse possibili strutture di tabelle comuni nei WMS
    let result = null;
    let tableName = null;

    // Try 1: Tabella "Supporti" (tipica nei WMS italiani)
    try {
      result = await pool.request().query(`
        SELECT TOP 100
          id_supporto AS id,
          barcode,
          note AS description,
          larghezza AS width,
          profondita AS depth,
          altezza AS height,
          numero_scomparti AS compartmentCount,
          CASE WHEN bloccato = 1 THEN 'true' ELSE 'false' END AS isBlocked
        FROM Supporti
        WHERE cancellato = 0
        ORDER BY id_supporto DESC
      `);
      tableName = 'Supporti';
      console.log(`[API] Tabella trovata: ${tableName}`);
    } catch (err1) {
      console.log(`[API] Tabella 'Supporti' non trovata, provo alternative...`);

      // Try 2: Tabella "UDC" (schema database reale Promag)
      try {
        result = await pool.request().query(`
          SELECT TOP 100
            id AS id,
            barcode,
            descrizione AS description,
            larghezza AS width,
            profondita AS depth,
            altezza AS height,
            numSupporti AS compartmentCount,
            CASE WHEN bloccataManualmente = 1 THEN 1 ELSE 0 END AS isBlockedFromEjlog,
            numeroUdc AS code,
            idLocazione AS locationId,
            idMagazzino AS warehouseId,
            numProdotti AS productsCount,
            pctRiempimento AS fillPercentage
          FROM UDC
          WHERE recordCancellato = 0
          ORDER BY id DESC
        `);
        tableName = 'UDC';
        console.log(`[API] Tabella trovata: ${tableName}`);
      } catch (err2) {
        console.log(`[API] Tabella 'UDC' non trovata, provo LoadingUnits...`);

        // Try 3: Tabella generica "LoadingUnits"
        try {
          result = await pool.request().query(`
            SELECT TOP 100
              id,
              code AS barcode,
              description,
              width,
              depth,
              height,
              0 AS compartmentCount,
              CAST(0 AS BIT) AS isBlocked
            FROM LoadingUnits
            ORDER BY id DESC
          `);
          tableName = 'LoadingUnits';
          console.log(`[API] Tabella trovata: ${tableName}`);
        } catch (err3) {
          // Nessuna tabella trovata, ritorna array vuoto
          console.warn('[API] Nessuna tabella UDC trovata nel database');
          console.warn('[API] Errori:', err1.message, err2.message, err3.message);

          return res.json({
            items: [],
            totalCount: 0,
            message: 'Database connesso ma nessuna tabella UDC trovata. Crea la struttura database.'
          });
        }
      }
    }

    console.log(`[API] Loading Units da tabella '${tableName}': ${result.recordset.length} trovati`);
    res.json(result.recordset);

  } catch (err) {
    console.error('[API] Error fetching loading units:', err);
    res.status(500).json({
      error: 'Errore nel recupero degli UDC',
      message: err.message,
      details: err.stack
    });
  }
});

/**
 * GET /api/EjLogHostVertimag/api/loading-units/:id
 * Get loading unit by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;

    console.log(`[API] GET /loading-units/${id}`);

    let result = null;

    // Try different table names
    try {
      result = await pool.request()
        .input('id', id)
        .query(`
          SELECT
            id_supporto AS id,
            barcode,
            note AS description,
            larghezza AS width,
            profondita AS depth,
            altezza AS height,
            numero_scomparti AS compartmentCount,
            CASE WHEN bloccato = 1 THEN 'true' ELSE 'false' END AS isBlocked
          FROM Supporti
          WHERE id_supporto = @id AND cancellato = 0
        `);
    } catch (err1) {
      try {
        result = await pool.request()
          .input('id', id)
          .query(`
            SELECT
              id, barcode, descrizione AS description,
              larghezza AS width, profondita AS depth, altezza AS height,
              numSupporti AS compartmentCount,
              CASE WHEN bloccataManualmente = 1 THEN 1 ELSE 0 END AS isBlockedFromEjlog,
              numeroUdc AS code, idLocazione AS locationId,
              idMagazzino AS warehouseId, numProdotti AS productsCount,
              pctRiempimento AS fillPercentage
            FROM UDC
            WHERE id = @id AND recordCancellato = 0
          `);
      } catch (err2) {
        result = await pool.request()
          .input('id', id)
          .query(`
            SELECT
              id, code AS barcode, description, width, depth, height,
              0 AS compartmentCount, CAST(0 AS BIT) AS isBlocked
            FROM LoadingUnits
            WHERE id = @id
          `);
      }
    }

    if (!result || result.recordset.length === 0) {
      return res.status(404).json({ error: 'UDC non trovato' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error('[API] Error fetching loading unit:', err);
    res.status(500).json({
      error: 'Errore nel recupero dell\'UDC',
      message: err.message
    });
  }
});

/**
 * GET /api/EjLogHostVertimag/api/loading-units/:id/compartments
 * Get compartments for a specific loading unit
 * Genera scomparti virtuali basati sui prodotti in giacenza
 */
router.get('/:id/compartments', async (req, res) => {
  try {
    const pool = await getPool();
    const { id } = req.params;
    const includeProducts = req.query.includeProducts === 'true';

    console.log(`[API] GET /loading-units/${id}/compartments - includeProducts: ${includeProducts}`);

    // Get UDC info per calcolare le suddivisioni
    const udcResult = await pool.request()
      .input('id', id)
      .query(`
        SELECT
          id, barcode, larghezza AS width, profondita AS depth, altezza AS height,
          numSupporti AS compartmentCount,
          numeroSuddivisioniX, numeroSuddivisioniY,
          modoVisualizzazioneCoordScomparti
        FROM UDC
        WHERE id = @id AND recordCancellato = 0
      `);

    if (udcResult.recordset.length === 0) {
      return res.status(404).json({ error: 'UDC non trovato' });
    }

    const udc = udcResult.recordset[0];

    // IMPORTANTE: numeroSuddivisioniX/Y sono quasi sempre 1x1 nel database
    // Il numero reale di cassetti è in compartmentCount (numSupporti)
    // Calcoliamo una griglia ottimale basata su compartmentCount
    const totalCompartments = udc.compartmentCount || 1;

    // Calcola una griglia ottimale (es: 76 cassetti → 19x4 o 12x6+4)
    let numX, numY;

    if (totalCompartments === 1) {
      numX = 1;
      numY = 1;
    } else {
      // Trova il divisore più vicino alla radice quadrata per griglia quasi quadrata
      const sqrt = Math.sqrt(totalCompartments);
      numY = Math.floor(sqrt);

      // Cerca il migliore divisore
      while (totalCompartments % numY !== 0 && numY > 1) {
        numY--;
      }

      numX = Math.ceil(totalCompartments / numY);
    }

    console.log(`[API] UDC ${id}: ${totalCompartments} cassetti → griglia ${numX}x${numY}`);

    // Genera scomparti virtuali basati sulla griglia calcolata
    const compartments = [];
    const compartmentWidth = Math.floor(udc.width / numX);
    const compartmentDepth = Math.floor(udc.depth / numY);

    for (let row = 0; row < numY; row++) {
      for (let col = 0; col < numX; col++) {
        const compartmentNumber = row * numX + col + 1;
        compartments.push({
          id: parseInt(`${id}${String(compartmentNumber).padStart(3, '0')}`), // Virtual ID
          loadingUnitId: parseInt(id),
          barcode: `${udc.barcode}-S${compartmentNumber}`,
          row: row + 1,
          column: col + 1,
          progressive: compartmentNumber,
          xPosition: col * compartmentWidth,
          yPosition: row * compartmentDepth,
          width: compartmentWidth,
          depth: compartmentDepth,
          fillPercentage: 0,
          isBlocked: false,
          products: []
        });
      }
    }

    // Se richiesto, carica i prodotti per ciascuno scomparto
    // NOTA: La tabella Giacenze non esiste nel database promag
    // I prodotti vengono generati come mockup per dimostrare la funzionalità
    if (includeProducts) {
      console.log(`[API] Generazione prodotti mock per UDC ${id}...`);

      // Genera prodotti fittizi basati sui dati reali dell'UDC
      const numProdotti = udc.compartmentCount || Math.floor(Math.random() * 5) + 1;

      for (let i = 0; i < numProdotti && i < compartments.length; i++) {
        const targetCompartmentIndex = i % compartments.length;

        const mockProduct = {
          id: parseInt(`${id}${String(i + 1).padStart(3, '0')}`),
          stockedQuantity: Math.floor(Math.random() * 20) + 1,
          reservedQuantity: Math.floor(Math.random() * 5),
          lot: `LOT-${Date.now()}-${i + 1}`,
          serialNumber: `SN${id}${i + 1}`,
          item: {
            id: 1000 + i,
            code: `ART-${1000 + i}`,
            description: `Prodotto ${i + 1} nell'UDC ${udc.barcode}`,
            barcode: `BC${id}${String(i + 1).padStart(4, '0')}`
          }
        };

        compartments[targetCompartmentIndex].products.push(mockProduct);

        // Calcola fill percentage basato sul numero di prodotti
        const currentProducts = compartments[targetCompartmentIndex].products.length;
        compartments[targetCompartmentIndex].fillPercentage = Math.min(
          Math.round((currentProducts / 5) * 100),
          100
        );
      }

      console.log(`[API] Generati ${numProdotti} prodotti mock`);
    }

    console.log(`[API] Ritorno ${compartments.length} scomparti`);
    res.json(compartments);

  } catch (err) {
    console.error('[API] Error fetching compartments:', err);
    res.status(500).json({
      error: 'Errore nel recupero degli scomparti',
      message: err.message
    });
  }
});

export default router;
