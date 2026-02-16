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

async function checkListeStructure() {
  try {
    const pool = await sql.connect(config);

    console.log('\n=== LISTE TABLE STRUCTURE ===\n');

    const result = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Liste'
      ORDER BY ORDINAL_POSITION
    `);

    console.log(`Total columns found: ${result.recordset.length}\n`);
    result.recordset.forEach((col, idx) => {
      console.log(`${(idx + 1).toString().padStart(2)}. ${col.COLUMN_NAME.padEnd(35)} ${col.DATA_TYPE.padEnd(15)} Nullable: ${col.IS_NULLABLE.padEnd(3)} Default: ${col.COLUMN_DEFAULT || 'N/A'}`);
    });

    // Check if daVerificare column exists
    const daVerificareExists = result.recordset.find(col => col.COLUMN_NAME === 'daVerificare');

    if (daVerificareExists) {
      console.log('\n✅ Column "daVerificare" EXISTS');
      console.log(`   Type: ${daVerificareExists.DATA_TYPE}`);
      console.log(`   Nullable: ${daVerificareExists.IS_NULLABLE}`);
      console.log(`   Default: ${daVerificareExists.COLUMN_DEFAULT || 'N/A'}`);
    } else {
      console.log('\n❌ Column "daVerificare" NOT FOUND!');
    }

    await pool.close();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    process.exit(1);
  }
}

checkListeStructure();
