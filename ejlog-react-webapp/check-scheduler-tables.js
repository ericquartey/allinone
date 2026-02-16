import { getPool } from './server/db-config.js';

(async () => {
  try {
    console.log('🔍 Controllo tabelle Scheduler nel database promag...\n');

    const pool = await getPool();

    // Check for Schedulazione and related tables
    const result = await pool.request().query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_NAME IN ('Schedulazione', 'Prenotazioni', 'Liste', 'SchedulerHeartbeat')
      ORDER BY TABLE_NAME
    `);

    console.log('📊 Tabelle trovate:');
    if (result.recordset.length === 0) {
      console.log('  ❌ Nessuna tabella trovata!');
    } else {
      result.recordset.forEach(row => {
        console.log(`  ✅ ${row.TABLE_NAME}`);
      });
    }

    console.log('\n🔍 Cerco tabelle con nomi simili...');
    const similarResult = await pool.request().query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_NAME LIKE '%Schedul%'
         OR TABLE_NAME LIKE '%Prenot%'
         OR TABLE_NAME LIKE '%Liste%'
         OR TABLE_NAME LIKE '%Heartbeat%'
      ORDER BY TABLE_NAME
    `);

    if (similarResult.recordset.length > 0) {
      console.log('📋 Tabelle con nomi simili:');
      similarResult.recordset.forEach(row => {
        console.log(`  - ${row.TABLE_NAME}`);
      });
    } else {
      console.log('  ❌ Nessuna tabella simile trovata');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error.message);
    process.exit(1);
  }
})();
