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

async function checkLocazioniPTL() {
  try {
    const pool = await sql.connect(config);

    console.log('\n=== TABELLA LocazioniPTL - STRUTTURA ===\n');

    const cols = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'LocazioniPTL'
      ORDER BY ORDINAL_POSITION
    `);

    cols.recordset.forEach(c => console.log(`- ${c.COLUMN_NAME} (${c.DATA_TYPE})`));

    console.log('\n=== SAMPLE DATA LocazioniPTL ===\n');

    const sample = await pool.request().query(`SELECT TOP 5 * FROM LocazioniPTL`);

    console.log(JSON.stringify(sample.recordset, null, 2));

    // Verifica relazione con Liste tramite idUbicazioneDestinazione
    console.log('\n=== JOIN Liste con LocazioniPTL ===\n');

    const joinTest = await pool.request().query(`
      SELECT TOP 3
        L.id,
        L.numLista,
        L.idUbicazioneDestinazione,
        LOC.id AS idLocazionePTL,
        LOC.descrizione AS nomeLocazione,
        LOC.barcode AS barcodeLocazione
      FROM Liste L
      LEFT JOIN LocazioniPTL LOC ON L.idUbicazioneDestinazione = LOC.id
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

checkLocazioniPTL();
