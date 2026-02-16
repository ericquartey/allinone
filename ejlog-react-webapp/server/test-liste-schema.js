/**
 * Test script to discover Liste table schema
 */

import { getPool } from './db-config.js';

async function discoverListeSchema() {
  const pool = await getPool();

  console.log('='.repeat(80));
  console.log('DISCOVERING LISTE TABLE SCHEMA');
  console.log('='.repeat(80));

  try {
    // 1. Get column names and types
    const schemaQuery = `
      SELECT
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Liste'
      ORDER BY ORDINAL_POSITION
    `;

    console.log('\n📋 LISTE TABLE COLUMNS:');
    console.log('-'.repeat(80));

    const schema = await pool.request().query(schemaQuery);
    schema.recordset.forEach(col => {
      const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
      const length = col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : '';
      console.log(`  ${col.COLUMN_NAME.padEnd(35)} ${col.DATA_TYPE}${length.padEnd(10)} ${nullable}`);
    });

    // 2. Get sample data
    const sampleQuery = `
      SELECT TOP 5 * FROM Liste
      ORDER BY id DESC
    `;

    console.log('\n📊 SAMPLE DATA (TOP 5):');
    console.log('-'.repeat(80));

    const sample = await pool.request().query(sampleQuery);
    console.log(JSON.stringify(sample.recordset, null, 2));

    // 3. Check for state-related columns
    console.log('\n🔍 SEARCHING FOR STATE/STATUS COLUMNS:');
    console.log('-'.repeat(80));

    const stateColumns = schema.recordset.filter(col =>
      col.COLUMN_NAME.toLowerCase().includes('stat') ||
      col.COLUMN_NAME.toLowerCase().includes('stato')
    );

    stateColumns.forEach(col => {
      console.log(`  ✓ ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
    });

    // 4. Check for priority-related columns
    console.log('\n⭐ SEARCHING FOR PRIORITY COLUMNS:');
    console.log('-'.repeat(80));

    const priorityColumns = schema.recordset.filter(col =>
      col.COLUMN_NAME.toLowerCase().includes('prior')
    );

    priorityColumns.forEach(col => {
      console.log(`  ✓ ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
    });

    // 5. Check for date-related columns
    console.log('\n📅 SEARCHING FOR DATE COLUMNS:');
    console.log('-'.repeat(80));

    const dateColumns = schema.recordset.filter(col =>
      col.COLUMN_NAME.toLowerCase().includes('data') ||
      col.COLUMN_NAME.toLowerCase().includes('date') ||
      col.DATA_TYPE.includes('date') ||
      col.DATA_TYPE.includes('time')
    );

    dateColumns.forEach(col => {
      console.log(`  ✓ ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
    });

    // 6. Get distinct values for what looks like idStatoLista
    const possibleStateColumns = schema.recordset.filter(col =>
      col.COLUMN_NAME.toLowerCase().includes('stato') &&
      col.DATA_TYPE.includes('int')
    );

    if (possibleStateColumns.length > 0) {
      console.log('\n🎯 DISTINCT VALUES FOR POSSIBLE STATE COLUMNS:');
      console.log('-'.repeat(80));

      for (const col of possibleStateColumns) {
        const distinctQuery = `
          SELECT DISTINCT TOP 10 ${col.COLUMN_NAME}, COUNT(*) as count
          FROM Liste
          WHERE ${col.COLUMN_NAME} IS NOT NULL
          GROUP BY ${col.COLUMN_NAME}
          ORDER BY count DESC
        `;

        const distinct = await pool.request().query(distinctQuery);
        console.log(`\n  ${col.COLUMN_NAME}:`);
        distinct.recordset.forEach(row => {
          console.log(`    ${col.COLUMN_NAME}=${row[col.COLUMN_NAME]} → ${row.count} records`);
        });
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ SCHEMA DISCOVERY COMPLETE');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error discovering schema:', error);
  }

  process.exit(0);
}

discoverListeSchema();
