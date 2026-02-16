/**
 * Script di test connessione database
 *
 * Uso: node server/test-connection.js
 *
 * Verifica che:
 * - SQL Server sia raggiungibile
 * - Le credenziali siano corrette
 * - Le tabelle Utenti e GruppiUtenti esistano
 * - Sia possibile fare query di base
 */

import { sql, getPool, closePool } from './db-config.js';

async function testConnection() {
  console.log('\n🔍 Test Connessione SQL Server\n');
  console.log('=' .repeat(60));

  try {
    // Test 1: Connessione
    console.log('\n1️⃣  Test connessione al database...');
    const pool = await getPool();
    console.log('   ✅ Connessione riuscita!');

    // Test 2: Verifica esistenza tabella Utenti
    console.log('\n2️⃣  Verifica tabella Utenti...');
    const usersTableCheck = await pool.request().query(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_NAME = 'Utenti'
    `);

    if (usersTableCheck.recordset[0].count === 0) {
      throw new Error('Tabella Utenti non trovata!');
    }
    console.log('   ✅ Tabella Utenti trovata');

    // Test 3: Verifica esistenza tabella GruppiUtenti
    console.log('\n3️⃣  Verifica tabella GruppiUtenti...');
    const groupsTableCheck = await pool.request().query(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_NAME = 'GruppiUtenti'
    `);

    if (groupsTableCheck.recordset[0].count === 0) {
      throw new Error('Tabella GruppiUtenti non trovata!');
    }
    console.log('   ✅ Tabella GruppiUtenti trovata');

    // Test 4: Conta utenti
    console.log('\n4️⃣  Conta utenti nel database...');
    const usersCount = await pool.request().query('SELECT COUNT(*) as total FROM Utenti');
    const totalUsers = usersCount.recordset[0].total;
    console.log(`   ✅ Trovati ${totalUsers} utenti`);

    // Test 5: Conta gruppi
    console.log('\n5️⃣  Conta gruppi utenti...');
    const groupsCount = await pool.request().query('SELECT COUNT(*) as total FROM GruppiUtenti');
    const totalGroups = groupsCount.recordset[0].total;
    console.log(`   ✅ Trovati ${totalGroups} gruppi`);

    // Test 6: Verifica colonne tabella Utenti
    console.log('\n6️⃣  Verifica struttura tabella Utenti...');
    const userColumns = await pool.request().query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Utenti'
      ORDER BY ORDINAL_POSITION
    `);

    const requiredColumns = ['id', 'utente', 'password', 'idGruppo', 'idLinguaDefault', 'barcode'];
    const foundColumns = userColumns.recordset.map(c => c.COLUMN_NAME);

    console.log('   Colonne trovate:', foundColumns.slice(0, 10).join(', '), '...');

    const missingColumns = requiredColumns.filter(col => !foundColumns.includes(col));
    if (missingColumns.length > 0) {
      console.log(`   ⚠️  Colonne necessarie mancanti: ${missingColumns.join(', ')}`);
    } else {
      console.log('   ✅ Tutte le colonne necessarie sono presenti');
    }

    // Test 7: Query di esempio con JOIN
    console.log('\n7️⃣  Test query JOIN Utenti + GruppiUtenti...');
    const sampleQuery = await pool.request().query(`
      SELECT TOP 3
        u.id,
        u.utente AS username,
        u.idGruppo AS groupId,
        g.nome AS groupName
      FROM Utenti u
      LEFT JOIN GruppiUtenti g ON u.idGruppo = g.id
      ORDER BY u.id
    `);

    console.log(`   ✅ Query eseguita con successo - ${sampleQuery.recordset.length} risultati`);

    if (sampleQuery.recordset.length > 0) {
      console.log('\n   Esempio dati:');
      sampleQuery.recordset.forEach(row => {
        console.log(`   - ID: ${row.id}, Username: ${row.username}, Gruppo: ${row.groupName || 'N/A'}`);
      });
    }

    // Test 8: Verifica gruppi disponibili
    console.log('\n8️⃣  Lista gruppi disponibili...');
    const groupsList = await pool.request().query(`
      SELECT id, nome AS name, livelloPrivilegi AS level
      FROM GruppiUtenti
      ORDER BY nome
    `);

    console.log(`   ✅ Trovati ${groupsList.recordset.length} gruppi:`);
    groupsList.recordset.forEach(group => {
      console.log(`   - [${group.id}] ${group.name} (Livello: ${group.level})`);
    });

    // Riepilogo finale
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ TUTTI I TEST COMPLETATI CON SUCCESSO!\n');
    console.log('📊 Riepilogo:');
    console.log(`   • Database: promag`);
    console.log(`   • Server: localhost\\SQL2019`);
    console.log(`   • Utenti totali: ${totalUsers}`);
    console.log(`   • Gruppi totali: ${totalGroups}`);
    console.log('\n💡 Il server API può essere avviato con: npm run dev:api\n');

  } catch (error) {
    console.error('\n❌ ERRORE DURANTE I TEST:\n');
    console.error('   Tipo:', error.name);
    console.error('   Messaggio:', error.message);

    if (error.code) {
      console.error('   Codice:', error.code);
    }

    console.log('\n🔧 Suggerimenti:');
    console.log('   1. Verifica che SQL Server sia in esecuzione');
    console.log('   2. Controlla le credenziali in server/db-config.js');
    console.log('   3. Verifica che il database "promag" esista');
    console.log('   4. Controlla che SQL Server accetti connessioni TCP/IP');
    console.log('   5. Verifica che le tabelle Utenti e GruppiUtenti esistano\n');

    process.exit(1);
  } finally {
    await closePool();
  }
}

// Esegui test
testConnection();
