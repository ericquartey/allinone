// @ts-check
const { test } = require('@playwright/test');
const sql = require('mssql');

/**
 * Check valid states in StatoControlloEvadibilita table
 */
test.describe('Check Valid List States', () => {
  test('should check valid states in database', async () => {
    const config = {
      server: 'localhost\\SQL2019',
      database: 'promag',
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
      },
      authentication: {
        type: 'default',
        options: {
          userName: 'sa',
          password: 'Sql2019',
        },
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    };

    try {
      console.log('\n🔌 Connecting to database...');
      const pool = await sql.connect(config);
      console.log('✅ Connected to database');

      // Check StatoControlloEvadibilita table
      console.log('\n📊 Querying StatoControlloEvadibilita table...');
      const result = await pool.request().query(`
        SELECT id, descrizione
        FROM StatoControlloEvadibilita
        ORDER BY id
      `);

      console.log(`\n📦 Found ${result.recordset.length} valid states:`);
      result.recordset.forEach((row, index) => {
        console.log(`  ${index + 1}. ID: ${row.id}, Descrizione: "${row.descrizione}"`);
      });

      // Check if ID 0 exists
      const id0Exists = result.recordset.some(row => row.id === 0);
      console.log(`\n❓ State ID 0 exists: ${id0Exists}`);

      if (!id0Exists && result.recordset.length > 0) {
        const firstId = result.recordset[0].id;
        console.log(`\n⚠️  WARNING: State ID 0 does not exist!`);
        console.log(`✅ Suggested fix: Use idStatoControlloEvadibilita = ${firstId} as default instead of 0`);
      }

      await pool.close();
      console.log('\n🔒 Database connection closed');

    } catch (error) {
      console.error('\n❌ Database Error:', error.message);
      throw error;
    }
  });
});
