import sql from 'mssql';

const config = {
  server: 'localhost\\SQL2019',
  database: 'promag',
  user: 'sa',
  password: 'fergrp_2012',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

async function checkColumns() {
  try {
    const pool = await sql.connect(config);

    console.log('=== UdcProdotti columns ===');
    const columns = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'UdcProdotti'
      ORDER BY ORDINAL_POSITION
    `);

    for (const col of columns.recordset) {
      console.log(`${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? '(' + col.CHARACTER_MAXIMUM_LENGTH + ')' : ''})`);
    }

    // Sample data
    console.log('\n=== Sample data ===');
    const sample = await pool.request().query(`SELECT TOP 3 * FROM UdcProdotti WHERE recordCancellato = 0`);
    console.log(sample.recordset);

    await pool.close();
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit(0);
  }
}

checkColumns();
