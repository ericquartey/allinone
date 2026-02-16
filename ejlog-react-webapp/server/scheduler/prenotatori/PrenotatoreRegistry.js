/**
 * PrenotatoreRegistry - Registro prenotatori per tipo lista
 * Mappa idTipoLista → Prenotatore instance
 */

import PickingPrenotatore from './PickingPrenotatore.js';
import RefillingPrenotatore from './RefillingPrenotatore.js';
import InventarioPrenotatore from './InventarioPrenotatore.js';

class PrenotatoreRegistry {
  constructor(config = {}) {
    this.prenotatori = new Map();
    this.config = config;

    // Registra prenotatori di default
    this.register(new PickingPrenotatore(config));
    this.register(new RefillingPrenotatore(config));
    this.register(new InventarioPrenotatore(config));
  }

  /**
   * Registra un prenotatore
   * @param {Object} prenotatore - Istanza di PrenotatoreBase
   */
  register(prenotatore) {
    const idTipoLista = prenotatore.getIdTipoLista();
    this.prenotatori.set(idTipoLista, prenotatore);
    console.log(`[PrenotatoreRegistry] Registered ${prenotatore.constructor.name} for idTipoLista ${idTipoLista}`);
  }

  /**
   * Ottiene il prenotatore per un tipo lista
   * @param {number} idTipoLista
   * @returns {Object|null}
   */
  getPrenotatore(idTipoLista) {
    return this.prenotatori.get(idTipoLista) || null;
  }

  /**
   * Trova il prenotatore appropriato per una lista
   * @param {Object} lista
   * @returns {Object|null}
   */
  findPrenotatore(lista) {
    const prenotatore = this.getPrenotatore(lista.idTipoLista);

    if (!prenotatore) {
      return null;
    }

    // Verifica accettazione
    if (!prenotatore.acceptLista(lista)) {
      return null;
    }

    return prenotatore;
  }

  /**
   * Lista tutti i prenotatori registrati
   * @returns {Array}
   */
  getAll() {
    return Array.from(this.prenotatori.values());
  }

  /**
   * Ottiene statistiche registry
   * @returns {Object}
   */
  getStats() {
    return {
      count: this.prenotatori.size,
      types: Array.from(this.prenotatori.entries()).map(([id, p]) => ({
        idTipoLista: id,
        className: p.constructor.name
      }))
    };
  }
}

export default PrenotatoreRegistry;
