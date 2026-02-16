import React, { useState } from 'react';
import PpcActionButton from '../../../components/ppc/PpcActionButton';
import PpcFormField from '../../../components/ppc/PpcFormField';
import PpcWizardLayout from '../../../components/ppc/PpcWizardLayout';
import { ppcT } from '../../../features/ppc/ppcStrings';
import ppcAutomationService from '../../../services/ppc/automationService';

const PpcLoadFirstDrawerPage: React.FC = () => {
  const [loadUnitId, setLoadUnitId] = useState('');
  const [maxWeight, setMaxWeight] = useState('');
  const [cellId, setCellId] = useState('');

  const handleInsertDrawer = async () => {
    const id = Number(loadUnitId);
    if (!Number.isFinite(id)) {
      return;
    }
    await ppcAutomationService.moveLoadingUnitToBay(id);
  };

  const handleRecallDrawer = async () => {
    const id = Number(loadUnitId);
    if (!Number.isFinite(id)) {
      return;
    }
    await ppcAutomationService.moveLoadingUnitToBay(id);
  };

  const handleGoToFreeCell = async () => {
    const id = Number(loadUnitId);
    if (!Number.isFinite(id)) {
      return;
    }
    await ppcAutomationService.moveElevatorToFreeCell(id, true, false);
  };

  const handleStart = async () => {
    const id = Number(loadUnitId);
    if (!Number.isFinite(id)) {
      return;
    }
    await ppcAutomationService.startFirstTest(id);
  };

  return (
    <PpcWizardLayout
      code="4.4.5"
      title={ppcT('InstallationApp.LoadFirstDrawerPageHeader', 'Load first drawer')}
      description={ppcT('InstallationApp.CellTestMenuDescription', '')}
      steps={[
        { label: '1', active: true },
        { label: '2' },
        { label: '3' },
      ]}
      sideCards={[
        {
          title: ppcT('InstallationApp.LoadFirstDrawerTotCellsToCheck', 'Total cells to check'),
          lines: ['0'],
        },
        {
          title: ppcT('InstallationApp.LoadFirstDrawerTotCellsChecked', 'Total cells checked'),
          lines: ['0'],
        },
        {
          title: ppcT('InstallationApp.LoadFirstDrawerActualCellToCheck', 'Current cell to check'),
          lines: ['0'],
        },
      ]}
    >
      <div className="ppc-wizard__panel-title">
        {ppcT('InstallationApp.LoadFirstDrawerDrawerToInsert', 'Drawer to insert')}
      </div>
      <div className="ppc-error-wizard__description">
        {ppcT('InstallationApp.LoadFirstDrawerStartLoading', 'Insert drawer to start')}
      </div>
      <div className="ppc-form-grid">
        <PpcFormField
          label={ppcT('InstallationApp.LoadFirstDrawerDrawerToInsert', 'Drawer to insert')}
          value={loadUnitId}
          onChange={setLoadUnitId}
        />
        <PpcFormField
          label={ppcT('InstallationApp.LoadFirstDrawerMaxWeight', 'Max drawer weight (kg)')}
          value={maxWeight}
          onChange={setMaxWeight}
        />
        <PpcFormField label={ppcT('InstallationApp.Cell', 'Cell')} value={cellId} onChange={setCellId} />
      </div>
      <div className="ppc-form-row">
        <PpcActionButton label={ppcT('InstallationApp.LoadFirstDrawerStartLoading', 'Insert drawer')} onClick={handleInsertDrawer} />
        <PpcActionButton label={ppcT('InstallationApp.LoadFirstDrawerRecallDrawer', 'Recall drawer')} onClick={handleRecallDrawer} />
        <PpcActionButton label={ppcT('InstallationApp.GoToFreeCell', 'Go to free cell')} onClick={handleGoToFreeCell} />
      </div>
      <div className="ppc-form-actions">
        <PpcActionButton label={ppcT('InstallationApp.Start', 'Start')} onClick={handleStart} />
      </div>
    </PpcWizardLayout>
  );
};

export default PpcLoadFirstDrawerPage;
