/**
 * PickingPrenotatore - Gestione prenotazione liste picking
 * Replica PrenotatoreListaPickingDefault.java
 */

import PrenotatoreBase from './PrenotatoreBase.js';
import PrenotatoreRigaProdotto from './PrenotatoreRigaProdotto.js';

class PickingPrenotatore extends PrenotatoreBase {
  constructor(config) {
    super(config);

    // Aggiungi prenotatori di riga
    this.addPrenotatoreRiga(new PrenotatoreRigaProdotto(config));
  }

  /**
   * Tipo lista: 1 = PICKING
   */
  getIdTipoLista() {
    return 1; // PICKING
  }

  /**
   * Accetta tutte le liste di tipo PICKING
   */
  acceptLista(lista) {
    return lista.idTipoLista === this.getIdTipoLista();
  }

  /**
   * Override: Sort righe per picking
   * Ordina per priorità ubicazione + numero riga
   */
  getSortedRigheLista(lista, righe) {
    // Per picking: ordina per numero riga (sequenza predefinita)
    return righe.sort((a, b) => a.numeroRiga - b.numeroRiga);
  }
}

export default PickingPrenotatore;
