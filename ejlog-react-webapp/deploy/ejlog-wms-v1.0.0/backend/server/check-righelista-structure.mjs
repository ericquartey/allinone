import sql from 'mssql';

const config = {
  server: 'localhost\\SQL2019',
  database: 'promag',
  user: 'sa',
  password: 'fergrp_2012',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

async function checkRigheListaStructure() {
  try {
    const pool = await sql.connect(config);

    console.log('\n=== RIGHELISTA TABLE STRUCTURE ===\n');

    const result = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'RigheLista'
      ORDER BY ORDINAL_POSITION
    `);

    console.log(`Total columns found: ${result.recordset.length}\n`);
    result.recordset.forEach((col, idx) => {
      console.log(`${(idx + 1).toString().padStart(2)}. ${col.COLUMN_NAME.padEnd(35)} ${col.DATA_TYPE.padEnd(15)} Nullable: ${col.IS_NULLABLE.padEnd(3)} Default: ${col.COLUMN_DEFAULT || 'N/A'}`);
    });

    // Sample articolo data for reference
    console.log('\n=== SAMPLE ARTICOLO DATA ===\n');
    const articoloSample = await pool.request().query(`
      SELECT TOP 1 * FROM Articoli
    `);

    if (articoloSample.recordset.length > 0) {
      const articolo = articoloSample.recordset[0];
      console.log('Available fields in Articoli table:');
      Object.keys(articolo).forEach((key, idx) => {
        console.log(`${(idx + 1).toString().padStart(2)}. ${key.padEnd(30)} = ${articolo[key]}`);
      });
    }

    await pool.close();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    process.exit(1);
  }
}

checkRigheListaStructure();
