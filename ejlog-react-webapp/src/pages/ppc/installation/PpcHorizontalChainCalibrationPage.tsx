import React from 'react';
import PpcActionButton from '../../../components/ppc/PpcActionButton';
import PpcWizardLayout from '../../../components/ppc/PpcWizardLayout';
import { ppcT } from '../../../features/ppc/ppcStrings';
import ppcAutomationService from '../../../services/ppc/automationService';
import { HorizontalMovementDirection, ShutterPosition } from '../../../services/ppc/automationTypes';

const PpcHorizontalChainCalibrationPage: React.FC = () => {
  const handleChainCalibration = async () => {
    await ppcAutomationService.moveHorizontalCalibration(HorizontalMovementDirection.Forwards);
  };

  const handleGateClose = async () => {
    await ppcAutomationService.moveShutterToPosition(ShutterPosition.Closed);
  };

  const handleForwards = async () => {
    await ppcAutomationService.moveHorizontalCalibration(HorizontalMovementDirection.Forwards);
  };

  return (
    <PpcWizardLayout
      code="4.2.5"
      title={ppcT('InstallationApp.HorizontalZeroOffset', 'Horizontal zero offset')}
      description={ppcT('InstallationApp.HorizontalZeroOffsetHelp', '')}
      steps={[
        { label: '1', active: true },
        { label: '2' },
        { label: '3' },
        { label: '4' },
        { label: '5' },
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
        {ppcT('InstallationApp.HorizontalZeroOffsetProcedure', '')}
      </div>
      <div className="ppc-form-row">
        <PpcActionButton label={ppcT('InstallationApp.ChainCalibration', 'Chain calibration')} onClick={handleChainCalibration} />
        <PpcActionButton label={ppcT('InstallationApp.GateClose', 'Gate close')} onClick={handleGateClose} />
      </div>
      <div className="ppc-form-actions">
        <PpcActionButton label={ppcT('InstallationApp.Forwards', 'Forwards')} onClick={handleForwards} />
      </div>
    </PpcWizardLayout>
  );
};

export default PpcHorizontalChainCalibrationPage;
