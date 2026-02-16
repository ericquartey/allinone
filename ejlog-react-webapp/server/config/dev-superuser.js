/**
 * Configurazione Superuser Hardcoded per Sviluppo
 *
 * IMPORTANTE: Questo file è utilizzato SOLO in ambiente di sviluppo.
 * In produzione, il superuser deve esistere nel database con password dinamica.
 *
 * Credenziali fisse per facilitare lo sviluppo frontend:
 * - Username: superuser
 * - Password: promag31 (FISSA, no calcolo dinamico)
 * - Livello: 0 (massimi privilegi)
 * - Data creazione: 2025-12-04
 *
 * @author Agent Swaggy (Swaggy Routing Architect)
 * @date 2025-12-04
 */

/**
 * Configurazione superuser di sviluppo
 *
 * Questo oggetto viene utilizzato quando:
 * 1. NODE_ENV === 'development'
 * 2. Username === 'superuser'
 * 3. Password === 'promag31'
 *
 * Il superuser hardcoded bypassa completamente il database
 * e restituisce questi dati statici.
 */
export const DEV_SUPERUSER = {
  id: 999999, // ID fittizio, non presente nel database
  username: 'superuser',
  groupId: 0,
  groupName: 'SUPERUSERS',
  groupLevel: 0,
  languageId: 1,
  barcode: 'DEV-SU-2025',
  createdAt: '2025-12-04T00:00:00Z',
  isHardcoded: true, // Flag per identificare che è hardcoded
  description: 'Superuser di sviluppo con credenziali fisse'
};

/**
 * Password dinamica del superuser (Development e Production)
 *
 * Formula: promag + (31 - giorno_corrente)
 * Esempio: Se oggi è il 4 → promag27 (31-4=27)
 *
 * @returns {string} Password del giorno
 */
function getDynamicSuperuserPassword() {
  const today = new Date();
  const day = today.getDate();
  const suffix = (31 - day);  // NO padding, numero naturale
  return `promag${suffix}`;
}

/**
 * Password del superuser per sviluppo (DINAMICA!)
 *
 * La password cambia ogni giorno seguendo la formula: promag + (31 - giorno)
 */
export const DEV_SUPERUSER_PASSWORD = getDynamicSuperuserPassword();

/**
 * Verifica se siamo in ambiente di sviluppo
 *
 * @returns {boolean} true se NODE_ENV è 'development' o non impostato
 */
export function isDevelopmentEnvironment() {
  return !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
}

/**
 * Verifica se le credenziali corrispondono al superuser hardcoded
 *
 * @param {string} username - Username fornito
 * @param {string} password - Password fornita
 * @returns {boolean} true se match con superuser hardcoded
 */
export function matchesHardcodedSuperuser(username, password) {
  if (!isDevelopmentEnvironment()) {
    return false; // In produzione, non usare mai il superuser hardcoded
  }

  return (
    username &&
    username.toLowerCase() === 'superuser' &&
    password === DEV_SUPERUSER_PASSWORD
  );
}

/**
 * Restituisce i dati del superuser hardcoded
 *
 * Utilizzare questa funzione SOLO dopo aver verificato
 * matchesHardcodedSuperuser() === true
 *
 * @returns {Object} Dati completi superuser
 */
export function getHardcodedSuperuser() {
  return {
    ...DEV_SUPERUSER,
    lastLoginAt: new Date().toISOString(),
    environment: 'development'
  };
}

/**
 * Log di sicurezza per tracciare utilizzo superuser hardcoded
 *
 * @param {string} ip - Indirizzo IP del client
 * @param {string} userAgent - User agent del browser
 */
export function logHardcodedSuperuserUsage(ip, userAgent) {
  console.log('\n⚠️  SUPERUSER HARDCODED LOGIN');
  console.log('═'.repeat(60));
  console.log(`  Username:    ${DEV_SUPERUSER.username}`);
  console.log(`  Password:    ${DEV_SUPERUSER_PASSWORD}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  IP Address:  ${ip || 'unknown'}`);
  console.log(`  User Agent:  ${userAgent || 'unknown'}`);
  console.log(`  Timestamp:   ${new Date().toISOString()}`);
  console.log('═'.repeat(60));
  console.log('⚠️  ATTENZIONE: Questo login bypassa il database!');
  console.log('⚠️  Utilizzare SOLO per sviluppo frontend.\n');
}

/**
 * Tabella di riepilogo credenziali per quick reference
 */
export function printSuperuserCredentials() {
  if (!isDevelopmentEnvironment()) {
    return; // Non stampare in produzione
  }

  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║           CREDENZIALI SUPERUSER SVILUPPO                  ║');
  console.log('╠═══════════════════════════════════════════════════════════╣');
  console.log(`║  Username:       ${DEV_SUPERUSER.username.padEnd(39)}║`);
  console.log(`║  Password:       ${DEV_SUPERUSER_PASSWORD.padEnd(39)}║`);
  console.log(`║  Gruppo:         ${DEV_SUPERUSER.groupName.padEnd(39)}║`);
  console.log(`║  Livello:        ${String(DEV_SUPERUSER.groupLevel).padEnd(39)}║`);
  console.log(`║  Data creazione: ${DEV_SUPERUSER.createdAt.padEnd(39)}║`);
  console.log('╠═══════════════════════════════════════════════════════════╣');
  console.log('║  NOTA: Queste credenziali funzionano SOLO in sviluppo    ║');
  console.log('║        In produzione usa password dinamica del giorno     ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
}

/**
 * Permessi del superuser (per reference)
 *
 * Il superuser ha accesso completo a:
 * - Tutti gli endpoint API
 * - Tutte le operazioni CRUD
 * - Gestione utenti e gruppi
 * - Configurazioni di sistema
 * - Operazioni di manutenzione
 */
export const SUPERUSER_PERMISSIONS = {
  users: ['create', 'read', 'update', 'delete'],
  groups: ['create', 'read', 'update', 'delete'],
  items: ['create', 'read', 'update', 'delete'],
  lists: ['create', 'read', 'update', 'delete', 'execute'],
  loadingUnits: ['create', 'read', 'update', 'delete'],
  locations: ['create', 'read', 'update', 'delete'],
  movements: ['create', 'read', 'update', 'delete'],
  reports: ['read', 'export'],
  system: ['configure', 'maintain', 'audit']
};

export default {
  DEV_SUPERUSER,
  DEV_SUPERUSER_PASSWORD,
  isDevelopmentEnvironment,
  matchesHardcodedSuperuser,
  getHardcodedSuperuser,
  logHardcodedSuperuserUsage,
  printSuperuserCredentials,
  SUPERUSER_PERMISSIONS
};
