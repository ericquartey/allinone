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

async function checkColumns() {
  try {
    const pool = await sql.connect(config);

    console.log('\n=== ListeAreaDetails TABLE STRUCTURE ===\n');

    const result = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'ListeAreaDetails'
      ORDER BY ORDINAL_POSITION
    `);

    console.log('Columns found:', result.recordset.length);
    result.recordset.forEach((col, idx) => {
      console.log(`${idx + 1}. ${col.COLUMN_NAME} (${col.DATA_TYPE}) - Nullable: ${col.IS_NULLABLE}`);
    });

    console.log('\n=== Sample Data ===\n');

    const sample = await pool.request().query(`SELECT TOP 3 * FROM ListeAreaDetails`);

    console.log(JSON.stringify(sample.recordset, null, 2));

    await pool.close();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkColumns();
