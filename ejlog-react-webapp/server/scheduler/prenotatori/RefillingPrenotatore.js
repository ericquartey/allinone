/**
 * RefillingPrenotatore - Gestione prenotazione liste refilling
 * Replica PrenotatoreListaRefillingDefault.java
 */

import PrenotatoreBase from './PrenotatoreBase.js';
import PrenotatoreRigaProdotto from './PrenotatoreRigaProdotto.js';

class RefillingPrenotatore extends PrenotatoreBase {
  constructor(config) {
    super(config);

    // Aggiungi prenotatori di riga
    this.addPrenotatoreRiga(new PrenotatoreRigaProdotto(config));
  }

  /**
   * Tipo lista: 2 = REFILLING
   */
  getIdTipoLista() {
    return 2; // REFILLING
  }

  /**
   * Accetta tutte le liste di tipo REFILLING
   */
  acceptLista(lista) {
    return lista.idTipoLista === this.getIdTipoLista();
  }

  /**
   * Override: Sort righe per refilling
   * Ordina per ubicazione destinazione per ottimizzare percorso
   */
  getSortedRigheLista(lista, righe) {
    // Per refilling: ordina per ubicazione destinazione + numero riga
    return righe.sort((a, b) => {
      if (a.idUbicazioneDestinazione !== b.idUbicazioneDestinazione) {
        return (a.idUbicazioneDestinazione || 0) - (b.idUbicazioneDestinazione || 0);
      }
      return a.numeroRiga - b.numeroRiga;
    });
  }
}

export default RefillingPrenotatore;
