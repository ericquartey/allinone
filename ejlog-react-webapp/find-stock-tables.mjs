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

async function findStockTables() {
  try {
    const pool = await sql.connect(config);

    // Get all tables
    console.log('=== Searching for stock-related tables ===\n');
    const tables = await pool.request().query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE'
      AND (
        TABLE_NAME LIKE '%giacen%' OR
        TABLE_NAME LIKE '%stock%' OR
        TABLE_NAME LIKE '%invent%' OR
        TABLE_NAME LIKE '%magaz%' OR
        TABLE_NAME LIKE '%prodott%' OR
        TABLE_NAME LIKE '%articol%' OR
        TABLE_NAME LIKE '%UDC%'
      )
      ORDER BY TABLE_NAME
    `);

    console.log('Found tables:');
    for (const table of tables.recordset) {
      console.log(`  - ${table.TABLE_NAME}`);

      // Try to count records
      try {
        const count = await pool.request().query(`SELECT COUNT(*) as total FROM ${table.TABLE_NAME} WHERE recordCancellato = 0`);
        console.log(`    Records (recordCancellato=0): ${count.recordset[0].total}`);
      } catch (e) {
        try {
          const count = await pool.request().query(`SELECT COUNT(*) as total FROM ${table.TABLE_NAME}`);
          console.log(`    Records (all): ${count.recordset[0].total}`);
        } catch (e2) {
          console.log(`    Error counting: ${e2.message}`);
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

findStockTables();
