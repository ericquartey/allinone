import React from 'react';
import ListsManagement from '../../ListsManagement';
import { ppcT } from '../../../features/ppc/ppcStrings';

const PpcOperatorWaitingListsPage: React.FC = () => {
  return (
    <div className="ppc-page">
      <div className="ppc-accessories__title">
        <span>{ppcT('OperatorApp.WaitingList', 'Liste in attesa')}</span>
      </div>
      <div className="ppc-accessories__description">
        {ppcT('OperatorApp.WaitingListDescription', 'Gestione liste in attesa ed esecuzione.')}
      </div>

      <div className="ppc-panel">
        <ListsManagement />
      </div>
    </div>
  );
};

export default PpcOperatorWaitingListsPage;
