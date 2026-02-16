/**
 * InventarioPrenotatore - Gestione prenotazione liste inventario
 * Replica PrenotatoreListaInventarioDefault.java
 */

import PrenotatoreBase from './PrenotatoreBase.js';
import PrenotatoreRigaProdotto from './PrenotatoreRigaProdotto.js';

class InventarioPrenotatore extends PrenotatoreBase {
  constructor(config) {
    super(config);

    // Aggiungi prenotatori di riga
    this.addPrenotatoreRiga(new PrenotatoreRigaProdotto(config));
  }

  /**
   * Tipo lista: 3 = INVENTARIO
   */
  getIdTipoLista() {
    return 3; // INVENTARIO
  }

  /**
   * Accetta tutte le liste di tipo INVENTARIO
   */
  acceptLista(lista) {
    return lista.idTipoLista === this.getIdTipoLista();
  }

  /**
   * Override: Sort righe per inventario
   * Ordina per ubicazione per ottimizzare scansione magazzino
   */
  getSortedRigheLista(lista, righe) {
    // Per inventario: ordina per ubicazione origine + numero riga
    return righe.sort((a, b) => {
      if (a.idUbicazioneOrigine !== b.idUbicazioneOrigine) {
        return (a.idUbicazioneOrigine || 0) - (b.idUbicazioneOrigine || 0);
      }
      return a.numeroRiga - b.numeroRiga;
    });
  }
}

export default InventarioPrenotatore;
