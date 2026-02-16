import sql from 'mssql';

const config = {
  server: 'localhost\\SQL2019',
  database: 'promag',
  user: 'sa',
  password: 'fergrp_2012',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

async function checkUbicazioni() {
  try {
    const pool = await sql.connect(config);

    console.log('\n=== TABELLA Ubicazioni - RICERCA ===\n');

    // Find location table
    const tables = await pool.request().query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE'
      AND TABLE_NAME LIKE '%bicaz%'
      ORDER BY TABLE_NAME
    `);

    if (tables.recordset.length === 0) {
      console.log('❌ No ubicazioni tables found');
      await pool.close();
      return;
    }

    console.log('Tables found:');
    tables.recordset.forEach(t => console.log(`- ${t.TABLE_NAME}`));

    // Check first table structure
    const tableName = tables.recordset[0].TABLE_NAME;

    console.log(`\n=== STRUTTURA ${tableName} ===\n`);

    const cols = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = '${tableName}'
      ORDER BY ORDINAL_POSITION
    `);

    cols.recordset.forEach(c => console.log(`- ${c.COLUMN_NAME} (${c.DATA_TYPE})`));

    console.log(`\n=== SAMPLE DATA ${tableName} ===\n`);

    const sample = await pool.request().query(`SELECT TOP 3 * FROM ${tableName}`);

    console.log(JSON.stringify(sample.recordset, null, 2));

    // Try to join with Liste
    console.log('\n=== JOIN Liste con ' + tableName + ' ===\n');

    const joinTest = await pool.request().query(`
      SELECT TOP 2
        L.id,
        L.numLista,
        L.idUbicazioneDestinazione,
        UB.id AS idUbicazione,
        UB.descrizione AS nomeUbicazione,
        UB.codice AS codiceUbicazione
      FROM Liste L
      LEFT JOIN ${tableName} UB ON L.idUbicazioneDestinazione = UB.id
      WHERE L.idUbicazioneDestinazione IS NOT NULL
      ORDER BY L.id DESC
    `);

    console.log(JSON.stringify(joinTest.recordset, null, 2));

    await pool.close();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkUbicazioni();
