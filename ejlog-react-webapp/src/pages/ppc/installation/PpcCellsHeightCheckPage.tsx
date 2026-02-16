import React, { useState } from 'react';
import PpcActionButton from '../../../components/ppc/PpcActionButton';
import PpcFormField from '../../../components/ppc/PpcFormField';
import PpcWizardLayout from '../../../components/ppc/PpcWizardLayout';
import { ppcT } from '../../../features/ppc/ppcStrings';
import ppcAutomationService from '../../../services/ppc/automationService';

const PpcCellsHeightCheckPage: React.FC = () => {
  const [cellId, setCellId] = useState('');
  const [cellHeight, setCellHeight] = useState('');
  const [referenceHeight, setReferenceHeight] = useState('');
  const [cellCorrection, setCellCorrection] = useState('');

  const handleGoToCell = async () => {
    const id = Number(cellId);
    if (!Number.isFinite(id)) {
      return;
    }
    await ppcAutomationService.moveElevatorToCell(id, true, false);
  };

  const handleMeasureCell = async () => {
    const id = Number(cellId);
    const heightValue = Number(cellHeight);
    if (!Number.isFinite(id) || !Number.isFinite(heightValue)) {
      return;
    }
    await ppcAutomationService.updateCellHeight(id, heightValue);
  };

  const handleSaveCell = async () => {
    const id = Number(cellId);
    const heightValue = Number(cellHeight);
    if (!Number.isFinite(id) || !Number.isFinite(heightValue)) {
      return;
    }
    await ppcAutomationService.updateCellHeight(id, heightValue);
  };

  return (
    <PpcWizardLayout
      code="4.4.2"
      title={ppcT('InstallationApp.CellsControl', 'Cells height check')}
      description={ppcT('InstallationApp.CheckCellDimensionMenuDescription', '')}
      steps={[
        { label: '1', active: true },
        { label: '2' },
        { label: '3' },
      ]}
      sideCards={[
        { title: ppcT('InstallationApp.CurrentCell', 'Current cell'), lines: ['0'] },
        { title: ppcT('InstallationApp.SelectedCell', 'Selected cell'), lines: ['0'] },
      ]}
    >
      <div className="ppc-wizard__panel-title">
        {ppcT('InstallationApp.ExecuteCellMeasurement', 'Execute cell measurement')}
      </div>
      <div className="ppc-error-wizard__description">
        {ppcT('InstallationApp.ExecuteElevatorCellPositioning', '')}
      </div>
      <div className="ppc-form-grid">
        <PpcFormField label={ppcT('InstallationApp.Cell', 'Cell')} value={cellId} onChange={setCellId} />
        <PpcFormField
          label={ppcT('InstallationApp.CellHeight', 'Cell height (mm)')}
          value={cellHeight}
          onChange={setCellHeight}
        />
        <PpcFormField
          label={ppcT('InstallationApp.ReferenceCellHeight', 'Reference cell height (mm)')}
          value={referenceHeight}
          onChange={setReferenceHeight}
        />
        <PpcFormField
          label={ppcT('InstallationApp.CellCorrection', 'Cell correction (mm)')}
          value={cellCorrection}
          onChange={setCellCorrection}
        />
      </div>
      <div className="ppc-form-actions">
        <PpcActionButton label={ppcT('InstallationApp.GoToCell', 'Go to cell')} onClick={handleGoToCell} />
        <PpcActionButton label={ppcT('InstallationApp.ExecuteCellMeasurement', 'Measure cell')} onClick={handleMeasureCell} />
        <PpcActionButton label={ppcT('InstallationApp.SaveCell', 'Save cell')} onClick={handleSaveCell} />
      </div>
    </PpcWizardLayout>
  );
};

export default PpcCellsHeightCheckPage;
