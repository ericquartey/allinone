import React, { useState } from 'react';
import PpcActionButton from '../../../components/ppc/PpcActionButton';
import PpcCheckboxField from '../../../components/ppc/PpcCheckboxField';
import PpcFormField from '../../../components/ppc/PpcFormField';
import PpcWizardLayout from '../../../components/ppc/PpcWizardLayout';
import { ppcT } from '../../../features/ppc/ppcStrings';
import ppcAutomationService from '../../../services/ppc/automationService';

const PpcCellPanelsCheckPage: React.FC = () => {
  const [cellId, setCellId] = useState('');
  const [cellHeight, setCellHeight] = useState('');
  const [referenceHeight, setReferenceHeight] = useState('');
  const [photocellsCheck, setPhotocellsCheck] = useState(false);
  const [panelCheck, setPanelCheck] = useState(false);

  const handleMeasure = async () => {
    const panelId = Number(cellId);
    const heightValue = Number(cellHeight);
    if (!Number.isFinite(panelId) || !Number.isFinite(heightValue)) {
      return;
    }
    await ppcAutomationService.updateCellPanelHeight(panelId, heightValue);
  };

  const handleSave = async () => {
    const panelId = Number(cellId);
    const heightValue = Number(cellHeight);
    if (!Number.isFinite(panelId) || !Number.isFinite(heightValue)) {
      return;
    }
    await ppcAutomationService.updateCellPanelHeight(panelId, heightValue);
  };

  return (
    <PpcWizardLayout
      code="4.4.1"
      title={ppcT('InstallationApp.CheckCellDimensionMenuTitle', 'Cell panels check')}
      description={ppcT('InstallationApp.CellPanelsCheckDescription', '')}
      steps={[
        { label: '1', active: true },
        { label: '2' },
        { label: '3' },
      ]}
      sideCards={[
        { title: ppcT('SensorCard.AxisVertical', 'Axis vertical') },
        { title: ppcT('SensorCard.AxisHorizontal', 'Axis horizontal') },
        { title: ppcT('SensorCard.Bay', 'Bay') },
      ]}
    >
      <div className="ppc-wizard__panel-title">
        {ppcT('InstallationApp.CellPanelsCheckPanel', 'Panel check')}
      </div>
      <div className="ppc-error-wizard__description">
        {ppcT('InstallationApp.CellPanelsCheckDescription', '')}
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
      </div>
    </PpcWizardLayout>
  );
};

export default PpcCellPanelsCheckPage;
