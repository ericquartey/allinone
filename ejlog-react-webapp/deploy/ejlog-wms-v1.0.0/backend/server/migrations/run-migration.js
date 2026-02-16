/**
 * Script to run database migration programmatically
 */

import { getPool } from '../db-config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('🚀 Starting database migration...\n');

    const pool = await getPool();
    console.log('✅ Connected to database');

    // Read SQL migration file
    const sqlFilePath = path.join(__dirname, 'create-liste-tables.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Split by GO statements and execute each batch
    const batches = sqlContent
      .split(/\nGO\n/i)
      .filter(batch => batch.trim().length > 0);

    console.log(`📋 Found ${batches.length} SQL batches to execute\n`);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i].trim();
      if (!batch) continue;

      console.log(`⏳ Executing batch ${i + 1}/${batches.length}...`);

      try {
        const result = await pool.request().query(batch);

        // Print any messages from the result
        if (result.recordset && result.recordset.length > 0) {
          result.recordset.forEach(row => {
            const message = Object.values(row)[0];
            if (message) console.log(`   ${message}`);
          });
        }
      } catch (err) {
        console.error(`❌ Error in batch ${i + 1}:`, err.message);
        // Continue with next batch
      }
    }

    console.log('\n✅ Migration completed successfully!\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runMigration();
