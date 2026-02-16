import React, { useMemo } from 'react';
import PpcActionButton from '../../../components/ppc/PpcActionButton';
import PpcWizardLayout from '../../../components/ppc/PpcWizardLayout';
import { ppcT } from '../../../features/ppc/ppcStrings';
import { useGetBayQuery } from '../../../services/api/ppcAutomationApi';
import ppcAutomationService from '../../../services/ppc/automationService';
import { PPC_BAY_NUMBER } from '../../../config/api';

const PpcDepositAndPickUpTestPage: React.FC = () => {
  const bayQuery = useGetBayQuery(PPC_BAY_NUMBER, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const targetInfo = useMemo(() => {
    const positions = bayQuery.data?.Positions ?? [];
    const positionWithUnit = positions.find((pos) => pos.LoadingUnit?.Id);
    const position = positionWithUnit ?? positions[0];
    return {
      bayPositionId: position?.Id ?? null,
      loadingUnitId: position?.LoadingUnit?.Id ?? null,
    };
  }, [bayQuery.data]);

  const handleStart = async () => {
    if (!targetInfo.bayPositionId || !targetInfo.loadingUnitId) {
      return;
    }
    await ppcAutomationService.startEnduranceHorizontalMovements(
      targetInfo.bayPositionId,
      targetInfo.loadingUnitId
    );
  };

  const handleStop = async () => {
    await ppcAutomationService.stopEnduranceHorizontalMovements();
  };

  return (
    <PpcWizardLayout
      code="4.3.4"
      title={ppcT('InstallationApp.DepositAndPickUpTest', 'Deposit and pick up test')}
      description={ppcT('InstallationApp.DepositAndPickUpTestDescription', '')}
      steps={[
        { label: '1', active: true },
        { label: '2' },
      ]}
      sideCards={[
        { title: ppcT('SensorCard.Position', 'Position') },
        { title: ppcT('SensorCard.Shutter', 'Shutter') },
      ]}
    >
      <div className="ppc-wizard__panel-title">
        {ppcT('InstallationApp.Test', 'Test')}
      </div>
      <div className="ppc-error-wizard__description">
        {ppcT('InstallationApp.DepositAndPickUpTestDescription', '')}
      </div>
      <div className="ppc-form-actions">
        <PpcActionButton label={ppcT('General.Start', 'Start')} onClick={handleStart} />
        <PpcActionButton label={ppcT('InstallationApp.Stop', 'Stop')} onClick={handleStop} />
      </div>
    </PpcWizardLayout>
  );
};

export default PpcDepositAndPickUpTestPage;
