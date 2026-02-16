import React, { useState } from 'react';
import PpcActionButton from '../../../components/ppc/PpcActionButton';
import PpcCheckboxField from '../../../components/ppc/PpcCheckboxField';
import PpcFormField from '../../../components/ppc/PpcFormField';
import PpcWizardLayout from '../../../components/ppc/PpcWizardLayout';
import { ppcT } from '../../../features/ppc/ppcStrings';
import ppcAutomationService from '../../../services/ppc/automationService';

const PpcNewCellPanelsCheckPage: React.FC = () => {
  const [cellId, setCellId] = useState('');
  const [cellHeight, setCellHeight] = useState('');
  const [referenceHeight, setReferenceHeight] = useState('');
  const [cellCorrection, setCellCorrection] = useState('');
  const [photocellsCheck, setPhotocellsCheck] = useState(false);
  const [panelCheck, setPanelCheck] = useState(false);

  const handleMeasure = async () => {
    const id = Number(cellId);
    const heightValue = Number(cellHeight);
    if (!Number.isFinite(id) || !Number.isFinite(heightValue)) {
      return;
    }
    await ppcAutomationService.updateCellHeight(id, heightValue);
  };

  const handleSave = async () => {
    const id = Number(cellId);
    const heightValue = Number(cellHeight);
    if (!Number.isFinite(id) || !Number.isFinite(heightValue)) {
      return;
    }
    await ppcAutomationService.updateCellHeight(id, heightValue);
  };

  const handleReset = async () => {
    await ppcAutomationService.resetAllCells();
  };

  return (
    <PpcWizardLayout
      code="4.4.6"
      title={ppcT('InstallationApp.NewCellsControl', 'New cells control')}
      description={ppcT('InstallationApp.CheckCellDimensionMenuDescription', '')}
      steps={[
        { label: '1', active: true },
        { label: '2' },
        { label: '3' },
      ]}
      sideCards={[
        { title: ppcT('InstallationApp.CellsControl', 'Cells control') },
        { title: ppcT('InstallationApp.CellPanelsCheckPanel', 'Panel check') },
      ]}
    >
      <div className="ppc-wizard__panel-title">
        {ppcT('InstallationApp.CellPanelsCheckPanel', 'Panel check')}
      </div>
      <div className="ppc-error-wizard__description">
        {ppcT('InstallationApp.CheckCellDimensionMenuDescription', '')}
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
      <div className="ppc-form-row">
        <PpcCheckboxField
          label={ppcT('InstallationApp.CellPanelsCheckPhotocells', 'Photocells check')}
          checked={photocellsCheck}
          onChange={setPhotocellsCheck}
        />
        <PpcCheckboxField
          label={ppcT('InstallationApp.CellPanelsCheckPanel', 'Panel check')}
          checked={panelCheck}
          onChange={setPanelCheck}
        />
      </div>
      <div className="ppc-form-actions">
        <PpcActionButton label={ppcT('InstallationApp.ExecuteCellMeasurement', 'Measure cell')} onClick={handleMeasure} />
        <PpcActionButton label={ppcT('InstallationApp.SaveCell', 'Save cell')} onClick={handleSave} />
        <PpcActionButton label={ppcT('InstallationApp.ResetAllCell', 'Reset cells')} onClick={handleReset} />
      </div>
    </PpcWizardLayout>
  );
};

export default PpcNewCellPanelsCheckPage;
