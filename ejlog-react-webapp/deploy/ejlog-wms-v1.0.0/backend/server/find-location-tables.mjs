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

async function findLocationTables() {
  try {
    const pool = await sql.connect(config);

    console.log('\n=== RICERCA TABELLE UBICAZIONI/SLOT/PTL ===\n');

    // Cerca tabelle con parole chiave relative alle ubicazioni
    const tables = await pool.request().query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE'
      AND (
        TABLE_NAME LIKE '%ubicaz%' OR
        TABLE_NAME LIKE '%location%' OR
        TABLE_NAME LIKE '%slot%' OR
        TABLE_NAME LIKE '%ptl%' OR
        TABLE_NAME LIKE '%Position%' OR
        TABLE_NAME LIKE '%Cassett%' OR
        TABLE_NAME LIKE '%Scaffal%'
      )
      ORDER BY TABLE_NAME
    `);

    console.log(`✅ Tabelle trovate: ${tables.recordset.length}\n`);
    tables.recordset.forEach(t => console.log(`- ${t.TABLE_NAME}`));

    // Cerca anche nelle colonne esistenti in Liste e ListeAreaDetails
    console.log('\n=== COLONNE IN Liste CHE POTREBBERO CONTENERE UBICAZIONE ===\n');

    const listeCols = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Liste'
      AND (
        COLUMN_NAME LIKE '%ubicaz%' OR
        COLUMN_NAME LIKE '%location%' OR
        COLUMN_NAME LIKE '%slot%' OR
        COLUMN_NAME LIKE '%ptl%' OR
        COLUMN_NAME LIKE '%position%' OR
        COLUMN_NAME LIKE '%cassett%'
      )
      ORDER BY ORDINAL_POSITION
    `);

    if (listeCols.recordset.length > 0) {
      console.log('Colonne trovate in Liste:');
      listeCols.recordset.forEach(c => console.log(`- ${c.COLUMN_NAME} (${c.DATA_TYPE})`));
    } else {
      console.log('❌ Nessuna colonna trovata in Liste');
    }

    console.log('\n=== COLONNE IN ListeAreaDetails CHE POTREBBERO CONTENERE UBICAZIONE ===\n');

    const ladCols = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'ListeAreaDetails'
      AND (
        COLUMN_NAME LIKE '%ubicaz%' OR
        COLUMN_NAME LIKE '%location%' OR
        COLUMN_NAME LIKE '%slot%' OR
        COLUMN_NAME LIKE '%ptl%' OR
        COLUMN_NAME LIKE '%position%' OR
        COLUMN_NAME LIKE '%cassett%'
      )
      ORDER BY ORDINAL_POSITION
    `);

    if (ladCols.recordset.length > 0) {
      console.log('Colonne trovate in ListeAreaDetails:');
      ladCols.recordset.forEach(c => console.log(`- ${c.COLUMN_NAME} (${c.DATA_TYPE})`));
    } else {
      console.log('❌ Nessuna colonna trovata in ListeAreaDetails');
    }

    // Mostra sample data completo da ListeAreaDetails per vedere tutti i campi
    console.log('\n=== SAMPLE COMPLETO DA ListeAreaDetails ===\n');

    const sample = await pool.request().query(`SELECT TOP 2 * FROM ListeAreaDetails`);

    console.log(JSON.stringify(sample.recordset, null, 2));

    await pool.close();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

findLocationTables();
