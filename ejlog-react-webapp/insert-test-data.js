/**
 * Script per inserire dati di test per Playwright tests
 * Inserisce: 1 Location (ID=1) e 1 UDC (ID=1)
 */

import sql from 'mssql';

const config = {
  user: 'sa',
  password: 'fergrp_2012',
  server: 'localhost\\SQL2019',
  database: 'promag',
  options: {
    trustServerCertificate: true,
    enableArithAbort: true,
    encrypt: false
  }
};

async function insertTestData() {
  let pool;

  try {
    console.log('Connecting to database...');
    pool = await sql.connect(config);
    console.log('✓ Connected to SQL Server\n');

    // 1. Check if Location ID=1 already exists
    console.log('[1/4] Checking if Location ID=1 exists...');
    const checkLoc = await pool.request()
      .input('id', 1)
      .query('SELECT id FROM Locazioni WHERE id = @id');

    if (checkLoc.recordset.length > 0) {
      console.log('  Location ID=1 already exists - skipping insert');
    } else {
      // Get Locazioni table structure
      console.log('  Getting Locazioni table structure...');
      const locSchema = await pool.request().query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'Locazioni'
        ORDER BY ORDINAL_POSITION
      `);

      console.log('  Locazioni columns:', locSchema.recordset.map(c => c.COLUMN_NAME).join(', '));

      // Insert minimal Location record
      console.log('  Inserting Location ID=1...');
      await pool.request()
        .input('id', 1)
        .input('descrizione', 'TEST-LOC-001')
        .input('maxUdc', 10)
        .query(`
          INSERT INTO Locazioni (id, descrizione, maxUdc)
          VALUES (@id, @descrizione, @maxUdc);
        `);

      console.log('  ✓ Location ID=1 inserted successfully');
    }

    // 2. Check if UDC ID=1 already exists
    console.log('\n[2/4] Checking if UDC ID=1 exists...');
    const checkUdc = await pool.request()
      .input('id', 1)
      .query('SELECT id FROM Udc WHERE id = @id');

    if (checkUdc.recordset.length > 0) {
      console.log('  UDC ID=1 already exists - skipping insert');
    } else {
      // Get Udc table structure
      console.log('  Getting Udc table structure...');
      const udcSchema = await pool.request().query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'Udc'
        ORDER BY ORDINAL_POSITION
      `);

      console.log('  Udc columns:', udcSchema.recordset.map(c => c.COLUMN_NAME).join(', '));

      // Insert minimal UDC record
      console.log('  Inserting UDC ID=1...');
      await pool.request()
        .input('id', 1)
        .input('numeroUdc', 'TEST-UDC-001')
        .input('idLocazione', 1)
        .input('recordCancellato', 0)
        .input('idTipoContenitore', 1)
        .query(`
          INSERT INTO Udc (id, numeroUdc, idLocazione, recordCancellato, idTipoContenitore)
          VALUES (@id, @numeroUdc, @idLocazione, @recordCancellato, @idTipoContenitore);
        `);

      console.log('  ✓ UDC ID=1 inserted successfully');
    }

    // 3. Insert some test movements in LogMissioni for Location ID=1
    console.log('\n[3/4] Checking if test movements exist...');
    const checkMovements = await pool.request()
      .input('idLoc', 1)
      .query(`
        SELECT COUNT(*) as count
        FROM LogMissioni
        WHERE idLocazioneDeposito = @idLoc OR idLocazionePrelievo = @idLoc
      `);

    if (checkMovements.recordset[0].count > 0) {
      console.log(`  Found ${checkMovements.recordset[0].count} existing movements for Location ID=1`);
    } else {
      console.log('  No movements found - this is OK for basic testing');
    }

    console.log('\n[4/4] Verification:');
    const verifyLoc = await pool.request().query('SELECT id, descrizione FROM Locazioni WHERE id = 1');
    const verifyUdc = await pool.request().query('SELECT id, numeroUdc FROM Udc WHERE id = 1');

    console.log('  Location ID=1:', verifyLoc.recordset[0]);
    console.log('  UDC ID=1:', verifyUdc.recordset[0]);

    console.log('\n✅ Test data insertion completed successfully!');

  } catch (err) {
    console.error('\n❌ Error:', err.message);
    console.error('Stack:', err.stack);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
      console.log('\n✓ Database connection closed');
    }
  }
}

insertTestData();
