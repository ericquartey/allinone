import React, { useState } from 'react';
import PpcActionButton from '../../../components/ppc/PpcActionButton';
import PpcFormField from '../../../components/ppc/PpcFormField';
import PpcWizardLayout from '../../../components/ppc/PpcWizardLayout';
import { ppcT } from '../../../features/ppc/ppcStrings';
import { useGetCellsQuery } from '../../../services/api/ppcAutomationApi';
import ppcAutomationService from '../../../services/ppc/automationService';
import { WarehouseSide } from '../../../services/ppc/automationTypes';

const PpcFixBackDrawersPage: React.FC = () => {
  const [correction, setCorrection] = useState('');
  const cellsQuery = useGetCellsQuery();
  const totalCells = cellsQuery.data?.length ?? 0;

  const handleStart = async () => {
    const height = Number(correction);
    if (!Number.isFinite(height) || totalCells === 0) {
      return;
    }
    await ppcAutomationService.updateCellsHeight({
      fromid: 1,
      toid: totalCells,
      side: WarehouseSide.Back,
      height,
    });
  };

  const handleConfirm = async () => {
    const height = Number(correction);
    if (!Number.isFinite(height) || totalCells === 0) {
      return;
    }
    await ppcAutomationService.updateCellsHeight({
      fromid: 1,
      toid: totalCells,
      side: WarehouseSide.Back,
      height,
    });
  };

  return (
    <PpcWizardLayout
      code="4.4.4"
      title={ppcT('InstallationApp.FixBackDrawers', 'Fix back drawers')}
      description={ppcT('InstallationApp.FixBackDrawersDescription', '')}
      steps={[{ label: '1', active: true }]}
      sideCards={[
        { title: ppcT('SensorCard.Back', 'Back') },
        { title: ppcT('InstallationApp.Cells', 'Cells') },
      ]}
    >
      <div className="ppc-wizard__panel-title">
        {ppcT('InstallationApp.Calibration', 'Calibration')}
      </div>
      <div className="ppc-error-wizard__description">
        {ppcT('InstallationApp.FixBackDrawersAsk', 'Apply back drawers correction?')}
      </div>
      <div className="ppc-form-grid">
        <PpcFormField
          label={ppcT('InstallationApp.CellsSideControlCorrection', 'Correction (mm)')}
          value={correction}
          onChange={setCorrection}
        />
      </div>
      <div className="ppc-form-actions">
        <PpcActionButton label={ppcT('InstallationApp.Start', 'Start')} onClick={handleStart} />
        <PpcActionButton label={ppcT('InstallationApp.ConfirmProcedure', 'Confirm procedure')} onClick={handleConfirm} />
      </div>
    </PpcWizardLayout>
  );
};

export default PpcFixBackDrawersPage;
