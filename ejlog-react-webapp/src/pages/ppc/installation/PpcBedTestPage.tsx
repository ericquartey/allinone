import React, { useMemo } from 'react';
import PpcActionButton from '../../../components/ppc/PpcActionButton';
import PpcWizardLayout from '../../../components/ppc/PpcWizardLayout';
import { ppcT } from '../../../features/ppc/ppcStrings';
import { useGetLoadingUnitsQuery } from '../../../services/api/ppcAutomationApi';
import ppcAutomationService from '../../../services/ppc/automationService';

const PpcBedTestPage: React.FC = () => {
  const loadingUnitsQuery = useGetLoadingUnitsQuery();
  const loadingUnits = loadingUnitsQuery.data ?? [];

  const loadUnitIds = useMemo(
    () => loadingUnits.map((unit) => unit.Id).filter((id): id is number => typeof id === 'number'),
    [loadingUnits]
  );

  const handleStart = async () => {
    if (loadUnitIds.length === 0) {
      return;
    }
    await ppcAutomationService.startFullTest({
      loadunits: loadUnitIds,
      cycles: 1,
      randomCells: false,
      randomBays: false,
    });
  };

  const handleStop = async () => {
    await ppcAutomationService.stopFullTest();
  };

  return (
    <PpcWizardLayout
      code="4.3.5"
      title={ppcT('InstallationApp.BedTest', 'BED test')}
      description={ppcT('InstallationApp.BedTestDescription', '')}
      steps={[
        { label: '1', active: true },
        { label: '2' },
      ]}
      sideCards={[
        { title: ppcT('SensorCard.AxisVertical', 'Axis vertical') },
        { title: ppcT('SensorCard.AxisHorizontal', 'Axis horizontal') },
      ]}
    >
      <div className="ppc-wizard__panel-title">
        {ppcT('InstallationApp.Test', 'Test')}
      </div>
      <div className="ppc-error-wizard__description">
        {ppcT('InstallationApp.BedTestInstruction', 'Run the bed test procedure')}
      </div>
      <div className="ppc-form-actions">
        <PpcActionButton label={ppcT('General.Start', 'Start')} onClick={handleStart} />
        <PpcActionButton label={ppcT('InstallationApp.Stop', 'Stop')} onClick={handleStop} />
      </div>
    </PpcWizardLayout>
  );
};

export default PpcBedTestPage;
