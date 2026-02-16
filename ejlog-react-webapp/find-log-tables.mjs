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

async function findLogTables() {
  try {
    const pool = await sql.connect(config);

    console.log('=== Searching for Log tables ===\n');
    const tables = await pool.request().query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE'
      AND (
        TABLE_NAME LIKE '%log%' OR
        TABLE_NAME LIKE '%event%' OR
        TABLE_NAME LIKE '%audit%' OR
        TABLE_NAME LIKE '%storico%'
      )
      ORDER BY TABLE_NAME
    `);

    for (const table of tables.recordset) {
      console.log(`\nTable: ${table.TABLE_NAME}`);
      try {
        const count = await pool.request().query(`SELECT COUNT(*) as total FROM ${table.TABLE_NAME} WHERE recordCancellato = 0`);
        console.log(`  Records: ${count.recordset[0].total}`);

        // Show sample
        const sample = await pool.request().query(`SELECT TOP 1 * FROM ${table.TABLE_NAME} WHERE recordCancellato = 0 ORDER BY id DESC`);
        if (sample.recordset.length > 0) {
          console.log(`  Sample columns:`, Object.keys(sample.recordset[0]).slice(0, 10).join(', '));
        }
      } catch (e) {
        try {
          const count = await pool.request().query(`SELECT COUNT(*) as total FROM ${table.TABLE_NAME}`);
          console.log(`  Records (all): ${count.recordset[0].total}`);
        } catch (e2) {
          console.log(`  Error: ${e2.message}`);
        }
      }
    }

    await pool.close();
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit(0);
  }
}

findLogTables();
