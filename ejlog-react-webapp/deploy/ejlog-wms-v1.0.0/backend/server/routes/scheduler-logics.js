/**
 * Scheduler Logics Routes
 * Gestione logiche prenotatore (TipoGestioneArticolo.elencoLogiche)
 */

import express from 'express';
import { getPool } from '../db-config.js';
import logicCatalog from '../../src/data/logic-catalog.json' with { type: 'json' };

const router = express.Router();

const logicSets = {
  picking: {
    ids: new Set(logicCatalog.picking.map((item) => item.id)),
    classes: new Set(logicCatalog.picking.map((item) => item.className)),
  },
  refilling: {
    ids: new Set(logicCatalog.refilling.map((item) => item.id)),
    classes: new Set(logicCatalog.refilling.map((item) => item.className)),
  },
};

const getLogicTypeKey = (idTipoLista) => (idTipoLista === 1 ? 'picking' : 'refilling');

const normalizeLogicList = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return String(value)
    .split(/[,\\s]+/)
    .map((token) => token.trim())
    .filter(Boolean);
};

const validateLogicSteps = (steps, format, typeKey) => {
  const sets = logicSets[typeKey];
  if (!sets) return;
  const allowed = format === 'legacy' ? sets.ids : sets.classes;

  steps.forEach((step) => {
    const logics = normalizeLogicList(step.logics);
    logics.forEach((logic) => {
      if (!allowed.has(logic)) {
        throw new Error(`Logica non valida: ${logic} (${typeKey}, ${format})`);
      }
    });
  });
};

const ensureSchedulerConfigTable = async (pool) => {
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'SchedulerConfig')
    BEGIN
      CREATE TABLE SchedulerConfig (
        id INT IDENTITY(1,1) PRIMARY KEY,
        configKey NVARCHAR(100) NOT NULL UNIQUE,
        configValue NVARCHAR(MAX),
        valueType NVARCHAR(20) DEFAULT 'string',
        description NVARCHAR(500),
        category NVARCHAR(50),
        createdAt DATETIME DEFAULT GETDATE(),
        updatedAt DATETIME DEFAULT GETDATE()
      )
    END
  `);
};

const isXstream = (value, elencoFiltri) => {
  if (elencoFiltri && String(elencoFiltri).toUpperCase().includes('XSTREAM')) return true;
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.startsWith('<?xml') || trimmed.startsWith('<com.promag');
};

const parseLegacyElencoLogiche = (value) => {
  if (!value || typeof value !== 'string') return [];
  return value
    .split(';')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const [key, rawLogics = ''] = chunk.split('=');
      const logics = rawLogics
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      return { key, logics };
    });
};

const parseXstreamElencoLogiche = (value) => {
  if (!value || typeof value !== 'string') return [];
  const steps = [];
  const stepRegex =
    /<com\.promag[^>]*PrenotatoreRigaListaDefaultStep[^>]*>([\s\S]*?)<\/com\.promag[^>]*PrenotatoreRigaListaDefaultStep>/g;
  let match = null;
  let idx = 1;
  while ((match = stepRegex.exec(value)) !== null) {
    const block = match[0];
    const nameMatch = block.match(/<name>([^<]+)<\/name>/);
    const key = nameMatch ? nameMatch[1].trim() : `Step${idx++}`;
    const logics = [];
    ['hqlFilterCriterions', 'logicCriterions'].forEach((section) => {
      const sectionRegex = new RegExp(`<${section}[^>]*>([\\s\\S]*?)<\\/${section}>`);
      const sectionMatch = block.match(sectionRegex);
      if (!sectionMatch) return;
      const content = sectionMatch[1];
      const classRegex = /<([a-zA-Z0-9_.]+)(\s|>)/g;
      let classMatch = null;
      while ((classMatch = classRegex.exec(content)) !== null) {
        const className = classMatch[1];
        if (className.includes('.criterions.')) {
          logics.push(className);
        }
      }
    });
    const unique = Array.from(new Set(logics));
    steps.push({ key, logics: unique });
  }
  return steps;
};

const parseElencoLogiche = (value, elencoFiltri) => {
  if (isXstream(value, elencoFiltri)) {
    return parseXstreamElencoLogiche(value);
  }
  return parseLegacyElencoLogiche(value);
};

const buildLegacyElencoLogiche = (steps) => {
  if (!Array.isArray(steps)) return '';
  const entries = steps.map((step) => {
    const key = String(step.key || '').trim();
    const logics = Array.isArray(step.logics) ? step.logics : [];
    const logicList = logics.map((item) => String(item).trim()).filter(Boolean).join(',');
    return `${key}=${logicList}`;
  });
  return entries.filter(Boolean).join(';') + (entries.length ? ';' : '');
};

const collectCriterionBlocks = (content) => {
  const blocks = new Map();
  if (!content) return blocks;
  const fullRegex = /<([a-zA-Z0-9_.]+)(\s[^>]*)?>([\s\S]*?)<\/\1>/g;
  let match = null;
  while ((match = fullRegex.exec(content)) !== null) {
    const className = match[1];
    if (className.includes('.criterions.')) {
      blocks.set(className, match[0]);
    }
  }
  const selfRegex = /<([a-zA-Z0-9_.]+)(\s[^>]*)?\/>/g;
  while ((match = selfRegex.exec(content)) !== null) {
    const className = match[1];
    if (className.includes('.criterions.') && !blocks.has(className)) {
      blocks.set(className, match[0]);
    }
  }
  return blocks;
};

const replaceCriteriaSection = (block, sectionTag, selected) => {
  const sectionRegex = new RegExp(`(<${sectionTag}[^>]*>)([\\s\\S]*?)(</${sectionTag}>)`);
  const sectionMatch = block.match(sectionRegex);
  if (!sectionMatch) return block;
  const [full, openTag, inner, closeTag] = sectionMatch;
  const existingBlocks = collectCriterionBlocks(inner);
  const cleaned = Array.isArray(selected) ? selected.map((s) => String(s).trim()).filter(Boolean) : [];
  const rendered = cleaned.map((className) => existingBlocks.get(className) || `<${className}/>`);
  const body = rendered.length ? `\n        ${rendered.join('\n        ')}\n      ` : '\n      ';
  return block.replace(full, `${openTag}${body}${closeTag}`);
};

const updateXstreamElencoLogiche = (xml, steps) => {
  if (!xml || typeof xml !== 'string' || !Array.isArray(steps)) return xml;
  const stepMap = new Map(steps.map((step) => [step.key, step.logics || []]));
  const stepRegex =
    /<com\.promag[^>]*PrenotatoreRigaListaDefaultStep[^>]*>([\s\S]*?)<\/com\.promag[^>]*PrenotatoreRigaListaDefaultStep>/g;
  return xml.replace(stepRegex, (block) => {
    const nameMatch = block.match(/<name>([^<]+)<\/name>/);
    if (!nameMatch) return block;
    const key = nameMatch[1].trim();
    if (!stepMap.has(key)) return block;
    const selected = stepMap.get(key) || [];
    const filters = selected.filter((className) => className.includes('.hqlfilter.'));
    const logics = selected.filter((className) => className.includes('.logic.'));
    let updated = block;
    updated = replaceCriteriaSection(updated, 'hqlFilterCriterions', filters);
    updated = replaceCriteriaSection(updated, 'logicCriterions', logics);
    return updated;
  });
};

const ensureTableExists = async (pool) => {
  const tableCheck = await pool.request().query(`
    SELECT COUNT(*) as tableExists
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_NAME = 'TipoGestioneArticolo'
  `);
  return tableCheck.recordset[0]?.tableExists > 0;
};

/**
 * GET /api/scheduler-logics
 * Restituisce le logiche attive del prenotatore dal DB
 */
router.get('/', async (_req, res) => {
  try {
    const pool = await getPool();
    const tableExists = await ensureTableExists(pool);
    if (!tableExists) {
      return res.status(404).json({
        success: false,
        message: 'Tabella TipoGestioneArticolo non trovata',
      });
    }

    const result = await pool.request().query(`
      SELECT id, idTipoLista, descrizione, elencoLogiche, elencoFiltri
      FROM TipoGestioneArticolo
      ORDER BY idTipoLista, id
    `);

    res.json({
      success: true,
      data: result.recordset.map((row) => {
        const elencoLogiche = row.elencoLogiche || '';
        const elencoFiltri = row.elencoFiltri || '';
        const format = isXstream(elencoLogiche, elencoFiltri) ? 'xstream' : 'legacy';
        return {
          id: row.id,
          idTipoLista: row.idTipoLista,
          descrizione: row.descrizione,
          elencoLogiche,
          elencoFiltri,
          format,
          steps: parseElencoLogiche(elencoLogiche, elencoFiltri),
        };
      }),
    });
  } catch (error) {
    console.error('[Scheduler Logics] Error loading logics:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il caricamento delle logiche',
      error: error.message,
    });
  }
});

/**
 * PUT /api/scheduler-logics
 * Aggiorna le logiche di un TipoGestioneArticolo
 * Body: { id?: number, idTipoLista?: number, steps: [{ key, logics: [] }] }
 */
router.put('/', async (req, res) => {
  try {
    const pool = await getPool();
    const tableExists = await ensureTableExists(pool);
    if (!tableExists) {
      return res.status(404).json({
        success: false,
        message: 'Tabella TipoGestioneArticolo non trovata',
      });
    }

    const { id, idTipoLista, steps } = req.body || {};

    let targetId = id;
    if (!targetId && idTipoLista) {
      const lookup = await pool.request()
        .input('idTipoLista', idTipoLista)
        .query(`
          SELECT TOP 1 id
          FROM TipoGestioneArticolo
          WHERE idTipoLista = @idTipoLista
          ORDER BY id
        `);
      targetId = lookup.recordset[0]?.id;
    }

    if (!targetId) {
      return res.status(400).json({
        success: false,
        message: 'Id non valido per aggiornare le logiche',
      });
    }

    const current = await pool.request()
      .input('id', targetId)
      .query(`
        SELECT elencoLogiche, elencoFiltri
        FROM TipoGestioneArticolo
        WHERE id = @id
      `);
    const currentRow = current.recordset[0];
    if (!currentRow) {
      return res.status(404).json({
        success: false,
        message: 'TipoGestioneArticolo non trovato',
      });
    }

    const isXml = isXstream(currentRow.elencoLogiche || '', currentRow.elencoFiltri || '');
    const normalizedSteps = (Array.isArray(steps) ? steps : []).map((step) => ({
      key: String(step.key || '').trim(),
      logics: normalizeLogicList(step.logics),
    }));
    try {
      validateLogicSteps(normalizedSteps, isXml ? 'xstream' : 'legacy', getLogicTypeKey(currentRow.idTipoLista));
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError.message,
      });
    }

    const elencoLogiche = isXml
      ? updateXstreamElencoLogiche(currentRow.elencoLogiche || '', normalizedSteps)
      : buildLegacyElencoLogiche(normalizedSteps);

    const updateResult = await pool.request()
      .input('id', targetId)
      .input('elencoLogiche', elencoLogiche)
      .query(`
        UPDATE TipoGestioneArticolo
        SET elencoLogiche = @elencoLogiche
        WHERE id = @id
      `);

    res.json({
      success: true,
      message: 'Logiche aggiornate con successo',
      id: targetId,
      elencoLogiche,
      format: isXml ? 'xstream' : 'legacy',
    });
  } catch (error) {
    console.error('[Scheduler Logics] Error updating logics:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il salvataggio delle logiche',
      error: error.message,
    });
  }
});

/**
 * PUT /api/scheduler-logics/batch
 * Aggiorna piu record in un colpo
 * Body: { items: [{ id?: number, idTipoLista?: number, steps: [...] }] }
 */
router.put('/batch', async (req, res) => {
  try {
    const pool = await getPool();
    const tableExists = await ensureTableExists(pool);
    if (!tableExists) {
      return res.status(404).json({
        success: false,
        message: 'Tabella TipoGestioneArticolo non trovata',
      });
    }

    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!items.length) {
      return res.status(400).json({
        success: false,
        message: 'Nessun elemento da aggiornare',
      });
    }

    const updates = [];
    for (const item of items) {
      let targetId = item.id;

      if (!targetId && item.idTipoLista) {
        const lookup = await pool.request()
          .input('idTipoLista', item.idTipoLista)
          .query(`
            SELECT TOP 1 id
            FROM TipoGestioneArticolo
            WHERE idTipoLista = @idTipoLista
            ORDER BY id
          `);
        targetId = lookup.recordset[0]?.id;
      }

      if (!targetId) {
        updates.push({ success: false, message: 'Id non valido', item });
        continue;
      }

      const current = await pool.request()
        .input('id', targetId)
        .query(`
          SELECT elencoLogiche, elencoFiltri, idTipoLista
          FROM TipoGestioneArticolo
          WHERE id = @id
        `);
      const currentRow = current.recordset[0];
      if (!currentRow) {
        updates.push({ success: false, message: 'TipoGestioneArticolo non trovato', id: targetId });
        continue;
      }

      const isXml = isXstream(currentRow.elencoLogiche || '', currentRow.elencoFiltri || '');
      const normalizedSteps = (Array.isArray(item.steps) ? item.steps : []).map((step) => ({
        key: String(step.key || '').trim(),
        logics: normalizeLogicList(step.logics),
      }));
      try {
        validateLogicSteps(
          normalizedSteps,
          isXml ? 'xstream' : 'legacy',
          getLogicTypeKey(currentRow.idTipoLista)
        );
      } catch (validationError) {
        updates.push({
          id: targetId,
          success: false,
          message: validationError.message,
        });
        continue;
      }

      const elencoLogiche = isXml
        ? updateXstreamElencoLogiche(currentRow.elencoLogiche || '', normalizedSteps)
        : buildLegacyElencoLogiche(normalizedSteps);

      const updateResult = await pool.request()
        .input('id', targetId)
        .input('elencoLogiche', elencoLogiche)
        .query(`
          UPDATE TipoGestioneArticolo
          SET elencoLogiche = @elencoLogiche
          WHERE id = @id
        `);

      updates.push({
        id: targetId,
        success: updateResult.rowsAffected?.[0] > 0,
        elencoLogiche,
        format: isXml ? 'xstream' : 'legacy',
      });
    }

    res.json({
      success: true,
      updates,
    });
  } catch (error) {
    console.error('[Scheduler Logics] Error batch updating logics:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante il salvataggio batch delle logiche',
      error: error.message,
    });
  }
});

/**
 * POST /api/scheduler-logics/refresh
 * Registra un timestamp di refresh per il modulo Java
 */
router.post('/refresh', async (_req, res) => {
  try {
    const pool = await getPool();
    await ensureSchedulerConfigTable(pool);

    const timestamp = new Date().toISOString();
    const key = 'schedulerLogics.lastRefresh';

    await pool.request()
      .input('key', key)
      .input('value', timestamp)
      .input('type', 'string')
      .query(`
        IF EXISTS (SELECT 1 FROM SchedulerConfig WHERE configKey = @key)
          UPDATE SchedulerConfig
          SET configValue = @value,
              valueType = @type,
              updatedAt = GETDATE()
          WHERE configKey = @key
        ELSE
          INSERT INTO SchedulerConfig (configKey, configValue, valueType)
          VALUES (@key, @value, @type)
      `);

    res.json({
      success: true,
      message: 'Refresh logiche schedulatore registrato',
      timestamp,
    });
  } catch (error) {
    console.error('[Scheduler Logics] Error refreshing logics:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante la registrazione del refresh',
      error: error.message,
    });
  }
});

export default router;
