import React, { useMemo, useState } from 'react';
import PpcActionButton from '../../../components/ppc/PpcActionButton';
import PpcFormField from '../../../components/ppc/PpcFormField';
import PpcSelectField from '../../../components/ppc/PpcSelectField';
import PpcWizardLayout from '../../../components/ppc/PpcWizardLayout';
import { ppcT } from '../../../features/ppc/ppcStrings';
import ppcAutomationService from '../../../services/ppc/automationService';
import { WarehouseSide } from '../../../services/ppc/automationTypes';

const PpcCellsSideControlPage: React.FC = () => {
  const sideOptions = useMemo(
    () => [
      { label: ppcT('General.WarehouseSide_Front', 'Front'), value: String(WarehouseSide.Front) },
      { label: ppcT('General.WarehouseSide_Back', 'Back'), value: String(WarehouseSide.Back) },
    ],
    []
  );
  const [initialCell, setInitialCell] = useState('');
  const [finalCell, setFinalCell] = useState('');
  const [correction, setCorrection] = useState('');
  const [selectedSide, setSelectedSide] = useState(String(WarehouseSide.Front));

  const handleStart = async () => {
    const fromid = Number(initialCell);
    const toid = Number(finalCell);
    const height = Number(correction);
    const side = Number(selectedSide);
    if (!Number.isFinite(fromid) || !Number.isFinite(toid) || !Number.isFinite(height) || !Number.isFinite(side)) {
      return;
    }
    await ppcAutomationService.updateCellsHeight({ fromid, toid, side, height });
  };

  const handleSave = async () => {
    const fromid = Number(initialCell);
    const toid = Number(finalCell);
    const height = Number(correction);
    const side = Number(selectedSide);
    if (!Number.isFinite(fromid) || !Number.isFinite(toid) || !Number.isFinite(height) || !Number.isFinite(side)) {
      return;
    }
    await ppcAutomationService.updateCellsHeight({ fromid, toid, side, height });
  };

  return (
    <PpcWizardLayout
      code="4.4.3"
      title={ppcT('InstallationApp.CellsSideControl', 'Cells side control')}
      description={ppcT('InstallationApp.CellsSideControlDescription', '')}
      steps={[
        { label: '1', active: true },
        { label: '2' },
      ]}
      sideCards={[
        { title: ppcT('InstallationApp.CellManagement', 'Cell management') },
        { title: ppcT('InstallationApp.CellEditing', 'Cell editing') },
      ]}
    >
      <div className="ppc-wizard__panel-title">
        {ppcT('InstallationApp.CellsSideControlDescription', 'Adjust cell heights')}
      </div>
      <div className="ppc-error-wizard__description">
        {ppcT('InstallationApp.CellsSideControlDescription', '')}
      </div>
      <div className="ppc-form-grid">
        <PpcFormField
          label={ppcT('InstallationApp.CellsSideControlInitialCell', 'Initial cell')}
          value={initialCell}
          onChange={setInitialCell}
        />
        <PpcFormField
          label={ppcT('InstallationApp.CellsSideControlFinalCell', 'Final cell')}
          value={finalCell}
          onChange={setFinalCell}
        />
        <PpcSelectField
          label={ppcT('InstallationApp.CellsSideControlSelectedSide', 'Selected side')}
          options={sideOptions}
          value={selectedSide}
          onChange={setSelectedSide}
        />
        <PpcFormField
          label={ppcT('InstallationApp.CellsSideControlCorrection', 'Correction (mm)')}
          value={correction}
          onChange={setCorrection}
        />
      </div>
      <div className="ppc-form-actions">
        <PpcActionButton label={ppcT('InstallationApp.Start', 'Start')} onClick={handleStart} />
        <PpcActionButton label={ppcT('InstallationApp.SaveCell', 'Save cell')} onClick={handleSave} />
      </div>
    </PpcWizardLayout>
  );
};

export default PpcCellsSideControlPage;
