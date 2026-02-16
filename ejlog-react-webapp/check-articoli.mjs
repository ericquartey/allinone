import sql from 'mssql';

const config = {
  user: 'sa',
  password: 'fergrp_2012',
  server: 'localhost\\SQL2019',
  database: 'promag',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

(async () => {
  try {
    const pool = await sql.connect(config);

    // Get column names
    const columns = await pool.request().query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Articoli'
      ORDER BY ORDINAL_POSITION
    `);

    console.log('📋 Colonne disponibili in Articoli:');
    columns.recordset.forEach(col => console.log(`  - ${col.COLUMN_NAME}`));

    // Get sample data
    const sample = await pool.request().query(`
      SELECT TOP 2 * FROM Articoli WHERE recordCancellato = 0
    `);

    console.log('\n📦 Primi 2 record:');
    console.log(JSON.stringify(sample.recordset, null, 2));

    await pool.close();
  } catch (err) {
    console.error('❌ Errore:', err.message);
  }
})();
