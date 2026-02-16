import { getPool } from './db-config.js';

async function queryTables() {
  try {
    const pool = await getPool();

    // Query per trovare tabelle relative agli UDC
    const result = await pool.request().query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_NAME LIKE '%UDC%'
         OR TABLE_NAME LIKE '%cassett%'
         OR TABLE_NAME LIKE '%loading%'
         OR TABLE_NAME LIKE '%support%'
         OR TABLE_NAME LIKE '%drawer%'
      ORDER BY TABLE_NAME
    `);

    console.log('Tabelle trovate:');
    console.log(JSON.stringify(result.recordset, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('Errore:', err);
    process.exit(1);
  }
}

queryTables();
