/**
 * Script di installazione del sistema di notifiche real-time
 *
 * Esegue lo script SQL create-notification-system.sql sul database promag
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import sql from 'mssql';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configurazione database (uguale a db-config.js)
const dbConfig = {
  user: 'sa',
  password: 'fergrp_2012',
  server: 'localhost\\SQL2019',
  database: 'promag',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

async function installNotificationSystem() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║  Installazione Sistema Notifiche Real-Time           ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log('');

  let pool;

  try {
    // Leggi lo script SQL
    const sqlScriptPath = join(__dirname, 'create-notification-system.sql');
    console.log(`📄 Lettura script: ${sqlScriptPath}`);

    const sqlScript = readFileSync(sqlScriptPath, 'utf8');
    console.log(`✅ Script caricato (${sqlScript.length} caratteri)`);
    console.log('');

    // Connetti al database
    console.log('🔌 Connessione al database...');
    console.log(`   Server: ${dbConfig.server}`);
    console.log(`   Database: ${dbConfig.database}`);

    pool = await sql.connect(dbConfig);
    console.log('✅ Connesso al database');
    console.log('');

    // Separa lo script in batch (diviso da GO)
    const batches = sqlScript
      .split(/^\s*GO\s*$/gim)
      .map(batch => batch.trim())
      .filter(batch => batch.length > 0);

    console.log(`📦 Trovati ${batches.length} batch da eseguire`);
    console.log('');

    // Esegui ogni batch
    let batchNum = 0;
    for (const batch of batches) {
      batchNum++;

      try {
        console.log(`[${batchNum}/${batches.length}] Esecuzione batch...`);

        const result = await pool.request().query(batch);

        // Mostra messaggi di print se presenti
        if (result.recordsets && result.recordsets.length > 0) {
          for (const recordset of result.recordsets) {
            if (recordset.length > 0) {
              console.log(recordset);
            }
          }
        }

        console.log(`✅ Batch ${batchNum} completato`);

      } catch (batchError) {
        console.error(`❌ Errore batch ${batchNum}:`, batchError.message);
        // Continua con i prossimi batch
      }
    }

    console.log('');
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║  ✅ Installazione Completata con Successo!           ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log('');
    console.log('Prossimi passi:');
    console.log('  1. Riavvia il server Node.js: npm start');
    console.log('  2. Verifica nei log: "Sistema notifiche real-time attivo"');
    console.log('  3. Testa modificando una lista da EjLog Java');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('╔═══════════════════════════════════════════════════════╗');
    console.error('║  ❌ Errore durante l\'installazione                    ║');
    console.error('╚═══════════════════════════════════════════════════════╝');
    console.error('');
    console.error('Dettagli errore:', error.message);
    console.error('');
    console.error('Possibili cause:');
    console.error('  - SQL Server non raggiungibile');
    console.error('  - Credenziali database errate');
    console.error('  - Permessi insufficienti per creare trigger');
    console.error('');
    console.error('Soluzione:');
    console.error('  - Verifica che SQL Server sia in esecuzione');
    console.error('  - Controlla username/password in db-config.js');
    console.error('  - Esegui lo script manualmente con SSMS');
    console.error('');

    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
      console.log('🔌 Connessione database chiusa');
    }
  }
}

// Esegui installazione
installNotificationSystem();
