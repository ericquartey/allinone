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

async function checkStockCounts() {
  try {
    const pool = await sql.connect(config);

    // Check Giacenze table
    console.log('=== Giacenze table ===');
    try {
      const giacenze = await pool.request().query(`SELECT COUNT(*) as total FROM Giacenze WHERE recordCancellato = 0`);
      console.log('Total records:', giacenze.recordset[0].total);

      const sample = await pool.request().query(`SELECT TOP 5 * FROM Giacenze WHERE recordCancellato = 0 ORDER BY id DESC`);
      console.log('Sample records:', sample.recordset.length);
    } catch (e) {
      console.log('Table not found or error:', e.message);
    }

    // Check UDC table with filter
    console.log('\n=== UDC table (numProdotti > 0) ===');
    const udc = await pool.request().query(`SELECT COUNT(*) as total FROM UDC WHERE recordCancellato = 0 AND numProdotti > 0`);
    console.log('Total UDC with products:', udc.recordset[0].total);

    // Check UDC table without product filter
    console.log('\n=== UDC table (all non-deleted) ===');
    const udcAll = await pool.request().query(`SELECT COUNT(*) as total FROM UDC WHERE recordCancellato = 0`);
    console.log('Total UDC (all):', udcAll.recordset[0].total);

    await pool.close();
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit(0);
  }
}

checkStockCounts();
