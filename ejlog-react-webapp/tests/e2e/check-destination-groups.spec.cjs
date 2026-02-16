// @ts-check
const { test, expect } = require('@playwright/test');
const sql = require('mssql');

/**
 * Check GruppiDestinazione table to see what IDs exist
 */
test.describe('Check Destination Groups', () => {
  test('should check existing destination groups in database', async () => {
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

      // Check GruppiDestinazione table
      console.log('\n📊 Querying GruppiDestinazione table...');
      const result = await pool.request().query(`
        SELECT TOP 20
          id,
          descrizione,
          idArea,
          activo
        FROM GruppiDestinazione
        ORDER BY id
      `);

      console.log(`\n📦 Found ${result.recordset.length} destination groups:`);
      result.recordset.forEach((row, index) => {
        console.log(`  ${index + 1}. ID: ${row.id}, Descrizione: "${row.descrizione}", Area: ${row.idArea}, Attivo: ${row.activo}`);
      });

      // Check if ID 10 exists
      const id10Exists = result.recordset.some(row => row.id === 10);
      console.log(`\n❓ ID 10 exists: ${id10Exists}`);

      if (!id10Exists) {
        console.log('\n⚠️  WARNING: idGruppoDestinazione = 10 does not exist in GruppiDestinazione table!');
        console.log('   This will cause a foreign key constraint error when creating a list.');

        // Find first available ID
        if (result.recordset.length > 0) {
          const firstId = result.recordset[0].id;
          console.log(`\n✅ Suggested fix: Use idGruppoDestinazione = ${firstId} instead`);
        }
      }

      await pool.close();
      console.log('\n🔒 Database connection closed');

    } catch (error) {
      console.error('\n❌ Database Error:', error.message);
      throw error;
    }
  });
});
