import React from 'react';
import { ppcT } from '../../../features/ppc/ppcStrings';

const helpTopics = [
  'HelpInitialPage',
  'HelpGeneralInfo',
  'HelpItemSearch',
  'HelpItemSearchDetail',
  'HelpListsInWait',
  'HelpDetailListInWait',
  'HelpDrawerActivityPicking',
  'HelpDrawerActivityRefilling',
  'HelpDrawerActivityInventory',
  'HelpDrawerCompacting',
  'HelpDrawerSpaceSaturation',
  'HelpDrawerWeightSaturation',
  'HelpErrorsStatistics',
  'HelpMachineStatistics',
  'HelpMaintenanceMainPage',
  'HelpMaintenanceDetail',
  'HelpStatisticsGeneralData',
  'HelpImmediateDrawerCall',
  'HelpDrawerWait',
];

const PpcOperatorHelpPage: React.FC = () => {
  return (
    <div className="ppc-page">
      <div className="ppc-accessories__title">
        <span>{ppcT('OperatorApp.Help', 'Aiuto')}</span>
      </div>
      <div className="ppc-accessories__description">
        {ppcT('OperatorApp.HelpDescription', 'Argomenti di aiuto del modulo operatore.')}
      </div>

      <div className="ppc-panel">
        <div className="ppc-chip-grid">
          {helpTopics.map((topic) => (
            <div key={topic} className="ppc-chip">
              {topic.replace(/^Help/, '').replace(/([A-Z])/g, ' $1').trim()}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PpcOperatorHelpPage;
