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

async function checkTables() {
  try {
    const pool = await sql.connect(config);

    console.log('\n=== TABELLE AREE/UBICAZIONI ===\n');

    // Trova tabelle con 'area' o 'ubicaz' nel nome
    const tables = await pool.request().query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE'
      AND (TABLE_NAME LIKE '%area%' OR TABLE_NAME LIKE '%ubicaz%' OR TABLE_NAME LIKE '%location%' OR TABLE_NAME LIKE '%Aree%')
      ORDER BY TABLE_NAME
    `);

    console.log('Tabelle trovate:', tables.recordset.length);
    tables.recordset.forEach(t => console.log('-', t.TABLE_NAME));

    // Verifica sample data da Liste con ListeAreaDetails
    console.log('\n=== SAMPLE DATA LISTE + ListeAreaDetails ===\n');

    const sample = await pool.request().query(`
      SELECT TOP 2
        L.id,
        L.numLista,
        LAD.idArea,
        LAD.idGruppoDestinazione,
        LAD.priorita,
        LAD.sequenzaLancio
      FROM Liste L
      LEFT JOIN ListeAreaDetails LAD ON L.id = LAD.idLista
      ORDER BY L.id DESC
    `);

    console.log(JSON.stringify(sample.recordset, null, 2));

    // Se esiste una tabella Aree, mostra la struttura
    console.log('\n=== RICERCA TABELLA AREE ===\n');
    const areeCheck = await pool.request().query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_NAME = 'Aree' OR TABLE_NAME = 'Area'
    `);

    if (areeCheck.recordset.length > 0) {
      const tableName = areeCheck.recordset[0].TABLE_NAME;
      console.log(`✅ Tabella trovata: ${tableName}`);

      const cols = await pool.request().query(`
        SELECT COLUMN_NAME, DATA_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = '${tableName}'
        ORDER BY ORDINAL_POSITION
      `);

      console.log('\nColonne:');
      cols.recordset.forEach(c => console.log(`- ${c.COLUMN_NAME} (${c.DATA_TYPE})`));

      const sampleAree = await pool.request().query(`SELECT TOP 3 * FROM ${tableName}`);
      console.log('\nSample data:');
      console.log(JSON.stringify(sampleAree.recordset, null, 2));
    } else {
      console.log('❌ Tabella Aree non trovata');
    }

    await pool.close();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkTables();
