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

async function checkLogEventiStructure() {
  try {
    const pool = await sql.connect(config);

    console.log('=== LogEventi Table Structure ===\n');

    // Get columns
    const columns = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'LogEventi'
      ORDER BY ORDINAL_POSITION
    `);

    console.log('Columns:');
    for (const col of columns.recordset) {
      console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? '(' + col.CHARACTER_MAXIMUM_LENGTH + ')' : ''}) ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
    }

    // Get sample records
    console.log('\n=== Sample Records (5 most recent) ===\n');
    const sample = await pool.request().query(`
      SELECT TOP 5 * FROM LogEventi
      ORDER BY id DESC
    `);

    for (const record of sample.recordset) {
      console.log('Record ID:', record.id);
      console.log(JSON.stringify(record, null, 2));
      console.log('---');
    }

    // Count records
    const count = await pool.request().query(`SELECT COUNT(*) as total FROM LogEventi`);
    console.log(`\nTotal Records: ${count.recordset[0].total}`);

    await pool.close();
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit(0);
  }
}

checkLogEventiStructure();
