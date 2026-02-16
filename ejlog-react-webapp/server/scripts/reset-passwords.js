/**
 * Script per resettare le password degli utenti reali
 * ESCLUDE il superuser che mantiene la password dinamica
 *
 * Password di reset: "test1234" (MD5: 16d7a4fca7442dda3ad93c9a726597e4)
 */

import sql from 'mssql';
import crypto from 'crypto';

// Configurazione database
const dbConfig = {
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

// Nuova password per tutti gli utenti (eccetto superuser)
const NEW_PASSWORD = 'test1234';
const NEW_PASSWORD_MD5 = crypto.createHash('md5').update(NEW_PASSWORD).digest('hex');

async function resetPasswords() {
  let pool;

  try {
    console.log('\n🔐 RESET PASSWORD UTENTI\n');
    console.log('━'.repeat(60));
    console.log(`Database: ${dbConfig.server} / ${dbConfig.database}`);
    console.log(`Nuova password: ${NEW_PASSWORD}`);
    console.log(`MD5 Hash: ${NEW_PASSWORD_MD5}`);
    console.log('━'.repeat(60));
    console.log('');

    // Connessione al database
    console.log('📡 Connessione al database...');
    pool = await sql.connect(dbConfig);
    console.log('✅ Connesso!\n');

    // 1. Recupera tutti gli utenti (ESCLUSO superuser)
    console.log('📋 Recupero lista utenti da aggiornare...');
    const usersResult = await pool.request().query(`
      SELECT
        id,
        utente AS username,
        password AS currentPassword
      FROM Utenti
      WHERE utente != 'superuser'
        AND utente != 'Artur superuser'
      ORDER BY utente
    `);

    const users = usersResult.recordset;
    console.log(`✅ Trovati ${users.length} utenti da aggiornare\n`);

    if (users.length === 0) {
      console.log('⚠️  Nessun utente da aggiornare.');
      return;
    }

    // 2. Mostra preview
    console.log('📝 PREVIEW - Utenti che verranno aggiornati:');
    console.log('━'.repeat(60));
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (ID: ${user.id})`);
    });
    console.log('━'.repeat(60));
    console.log('');

    // 3. Aggiorna le password
    console.log('🔄 Aggiornamento password in corso...\n');

    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        await pool.request()
          .input('password', sql.VarChar(255), NEW_PASSWORD_MD5)
          .input('userId', sql.Int, user.id)
          .query(`
            UPDATE Utenti
            SET password = @password
            WHERE id = @userId
          `);

        console.log(`✅ ${user.username} - Password aggiornata`);
        successCount++;
      } catch (error) {
        console.log(`❌ ${user.username} - ERRORE: ${error.message}`);
        errorCount++;
      }
    }

    console.log('');
    console.log('━'.repeat(60));
    console.log('📊 RISULTATO FINALE');
    console.log('━'.repeat(60));
    console.log(`✅ Successi: ${successCount}`);
    console.log(`❌ Errori: ${errorCount}`);
    console.log(`📝 Totale: ${users.length}`);
    console.log('━'.repeat(60));
    console.log('');

    if (successCount > 0) {
      console.log('🎉 Password resettate con successo!\n');
      console.log('📌 CREDENZIALI DI TEST:');
      console.log(`   Username: <qualsiasi utente eccetto superuser>`);
      console.log(`   Password: ${NEW_PASSWORD}`);
      console.log('');
      console.log('📌 SUPERUSER (non modificato):');
      console.log(`   Username: superuser`);
      console.log(`   Password: promag31 (per development)`);
      console.log(`   Password: promag{31-day} (per production)`);
      console.log('');
    }

    // 4. Verifica risultato
    console.log('🔍 Verifica aggiornamento...');
    const verifyResult = await pool.request()
      .input('password', sql.VarChar(255), NEW_PASSWORD_MD5)
      .query(`
        SELECT COUNT(*) as count
        FROM Utenti
        WHERE password = @password
          AND utente != 'superuser'
          AND utente != 'Artur superuser'
      `);

    const updatedCount = verifyResult.recordset[0].count;
    console.log(`✅ ${updatedCount} utenti con password "${NEW_PASSWORD}"\n`);

  } catch (error) {
    console.error('\n❌ ERRORE FATALE:', error.message);
    console.error(error);
  } finally {
    if (pool) {
      await pool.close();
      console.log('🔌 Connessione database chiusa.\n');
    }
  }
}

// Esegui lo script
resetPasswords();
