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

async function checkUdcTable() {
  try {
    const pool = await sql.connect(config);

    console.log('=== UDC Table Columns ===');
    const cols = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Udc'
      ORDER BY ORDINAL_POSITION
    `);

    for (const col of cols.recordset) {
      console.log(`${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? '(' + col.CHARACTER_MAXIMUM_LENGTH + ')' : ''})`);
    }

    console.log('\n=== Total UDC Count ===');
    const count = await pool.request().query('SELECT COUNT(*) as total FROM Udc WHERE recordCancellato = 0');
    console.log('Total UDC:', count.recordset[0].total);

    console.log('\n=== Sample UDC Data (3 records) ===');
    const sample = await pool.request().query('SELECT TOP 3 * FROM Udc WHERE recordCancellato = 0 ORDER BY id DESC');
    console.log(JSON.stringify(sample.recordset, null, 2));

    await pool.close();
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit(0);
  }
}

checkUdcTable();
