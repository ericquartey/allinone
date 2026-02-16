import { getPool } from './db-config.js';

async function queryUdcStructure() {
  try {
    const pool = await getPool();

    // Struttura tabella Udc
    console.log('\n=== STRUTTURA TABELLA Udc ===');
    const udcColumns = await pool.request().query(`
      SELECT TOP 5 * FROM Udc
    `);
    console.log(JSON.stringify(udcColumns.recordset, null, 2));

    // Struttura tabella UdcSupporti (cassetti)
    console.log('\n=== STRUTTURA TABELLA UdcSupporti (Cassetti) ===');
    const supportiColumns = await pool.request().query(`
      SELECT TOP 5 * FROM UdcSupporti
    `);
    console.log(JSON.stringify(supportiColumns.recordset, null, 2));

    // Struttura tabella UdcProdotti
    console.log('\n=== STRUTTURA TABELLA UdcProdotti ===');
    const prodottiColumns = await pool.request().query(`
      SELECT TOP 5 * FROM UdcProdotti
    `);
    console.log(JSON.stringify(prodottiColumns.recordset, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('Errore:', err);
    process.exit(1);
  }
}

queryUdcStructure();
