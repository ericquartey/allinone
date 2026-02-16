/**
 * Script per verificare lo schema esatto delle tabelle
 */

import { getPool, closePool } from './db-config.js';

async function checkSchema() {
  try {
    const pool = await getPool();

    console.log('\n📋 SCHEMA TABELLA UTENTI:\n');
    const utentiColumns = await pool.request().query(`
      SELECT
        COLUMN_NAME,
        DATA_TYPE,
        CHARACTER_MAXIMUM_LENGTH,
        IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Utenti'
      ORDER BY ORDINAL_POSITION
    `);

    utentiColumns.recordset.forEach(col => {
      console.log(`  ${col.COLUMN_NAME.padEnd(30)} ${col.DATA_TYPE.padEnd(15)} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    console.log('\n\n📋 SCHEMA TABELLA GRUPPIUTENTI:\n');
    const gruppiColumns = await pool.request().query(`
      SELECT
        COLUMN_NAME,
        DATA_TYPE,
        CHARACTER_MAXIMUM_LENGTH,
        IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'GruppiUtenti'
      ORDER BY ORDINAL_POSITION
    `);

    gruppiColumns.recordset.forEach(col => {
      console.log(`  ${col.COLUMN_NAME.padEnd(30)} ${col.DATA_TYPE.padEnd(15)} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // Mostra alcuni record di esempio
    console.log('\n\n🔍 ESEMPIO RECORD UTENTI (primi 3):\n');
    const sampleUsers = await pool.request().query(`
      SELECT TOP 3 * FROM Utenti ORDER BY id
    `);

    console.log(JSON.stringify(sampleUsers.recordset, null, 2));

    console.log('\n\n🔍 ESEMPIO RECORD GRUPPIUTENTI:\n');
    const sampleGroups = await pool.request().query(`
      SELECT * FROM GruppiUtenti ORDER BY id
    `);

    console.log(JSON.stringify(sampleGroups.recordset, null, 2));

  } catch (error) {
    console.error('Errore:', error);
  } finally {
    await closePool();
  }
}

checkSchema();
