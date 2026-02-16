import sql from 'mssql';

const dbConfig = {
  user: 'sa',
  password: 'fergrp_2012',
  server: 'localhost\\SQL2019',
  database: 'promag',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

(async () => {
  console.log('🔍 Ricerca tabelle per Liste...\n');

  try {
    const pool = await sql.connect(dbConfig);

    // Cerca tabelle con nomi correlati alle liste
    const tables = await pool.request().query(`
      SELECT TABLE_NAME,
             (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = t.TABLE_NAME) as COL_COUNT
      FROM INFORMATION_SCHEMA.TABLES t
      WHERE TABLE_TYPE = 'BASE TABLE'
      AND (
        TABLE_NAME LIKE '%List%' OR
        TABLE_NAME LIKE '%list%' OR
        TABLE_NAME LIKE '%Picking%' OR
        TABLE_NAME LIKE '%picking%' OR
        TABLE_NAME LIKE '%Refilling%' OR
        TABLE_NAME LIKE '%refilling%' OR
        TABLE_NAME LIKE '%Inventory%' OR
        TABLE_NAME LIKE '%inventory%'
      )
      ORDER BY TABLE_NAME
    `);

    console.log(`✅ Trovate ${tables.recordset.length} tabelle correlate a liste:\n`);

    for (const table of tables.recordset) {
      const countResult = await pool.request()
        .query(`SELECT COUNT(*) as total FROM ${table.TABLE_NAME}`);

      console.log(`📊 ${table.TABLE_NAME}`);
      console.log(`   Colonne: ${table.COL_COUNT}`);
      console.log(`   Record: ${countResult.recordset[0].total}\n`);
    }

    // Ottieni sample data dalla prima tabella con record
    if (tables.recordset.length > 0) {
      for (const table of tables.recordset) {
        const countResult = await pool.request()
          .query(`SELECT COUNT(*) as total FROM ${table.TABLE_NAME}`);

        if (countResult.recordset[0].total > 0) {
          console.log(`\n📋 Sample data da ${table.TABLE_NAME}:\n`);

          const sample = await pool.request()
            .query(`SELECT TOP 3 * FROM ${table.TABLE_NAME}`);

          console.log(JSON.stringify(sample.recordset, null, 2));
          break;
        }
      }
    }

    await pool.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error.message);
    process.exit(1);
  }
})();
