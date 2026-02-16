import React, { useMemo } from 'react';
import PpcActionButton from '../../../components/ppc/PpcActionButton';
import PpcWizardLayout from '../../../components/ppc/PpcWizardLayout';
import { ppcT } from '../../../features/ppc/ppcStrings';
import { useGetBayQuery } from '../../../services/api/ppcAutomationApi';
import { HorizontalMovementDirection } from '../../../services/ppc/automationTypes';
import ppcAutomationService from '../../../services/ppc/automationService';
import { PPC_BAY_NUMBER } from '../../../config/api';

const PpcHorizontalResolutionCalibrationPage: React.FC = () => {
  const bayQuery = useGetBayQuery(PPC_BAY_NUMBER, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const defaultBayPosition = useMemo(() => {
    const positions = bayQuery.data?.Positions ?? [];
    if (!positions.length) {
      return null;
    }
    return positions.find((pos) => !pos.IsUpper) ?? positions[0];
  }, [bayQuery.data]);

  const handleChainCalibration = async () => {
    await ppcAutomationService.moveHorizontalCalibration(HorizontalMovementDirection.Forwards);
  };

  const handleGoToBay = async () => {
    const bayPositionId = Number(defaultBayPosition?.Id);
    if (!bayPositionId) {
      return;
    }
    await ppcAutomationService.moveElevatorToBayPosition(bayPositionId, true, false);
  };

  const handleStart = async () => {
    await ppcAutomationService.moveHorizontalResolution(HorizontalMovementDirection.Forwards);
  };

  const handleStop = async () => {
    await ppcAutomationService.stopAllMovements();
  };

  return (
    <PpcWizardLayout
      code="4.2.6"
      title={ppcT('InstallationApp.HorizontalResolutionCalibration', 'Horizontal resolution calibration')}
      description={ppcT('InstallationApp.HorizontalResolutionCalibrationHelp', '')}
      steps={[
        { label: '1', active: true },
        { label: '2' },
        { label: '3' },
      ]}
      sideCards={[
        { title: ppcT('SensorCard.AxisHorizontal', 'Axis horizontal') },
        { title: ppcT('SensorCard.AxisVertical', 'Axis vertical') },
        { title: ppcT('SensorCard.Shutter', 'Shutter') },
        { title: ppcT('SensorCard.Position', 'Position') },
      ]}
    >
      <div className="ppc-wizard__panel-title">
        {ppcT('InstallationApp.BeforeStart', 'Before start')}
      </div>
      <div className="ppc-error-wizard__description">
        {ppcT('InstallationApp.CheckEmptyBayAndCell', '')}
      </div>
      <div className="ppc-form-row">
        <PpcActionButton label={ppcT('InstallationApp.ChainCalibration', 'Chain calibration')} onClick={handleChainCalibration} />
        <PpcActionButton label={ppcT('InstallationApp.GoToBay', 'Go to bay')} onClick={handleGoToBay} />
      </div>
      <div className="ppc-form-actions">
        <PpcActionButton label={ppcT('InstallationApp.Start', 'Start')} onClick={handleStart} />
        <PpcActionButton label={ppcT('InstallationApp.StopProcedure', 'Stop procedure')} onClick={handleStop} />
      </div>
    </PpcWizardLayout>
  );
};

export default PpcHorizontalResolutionCalibrationPage;
