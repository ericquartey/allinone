import React from 'react';
import PpcActionButton from '../../../components/ppc/PpcActionButton';
import PpcWizardLayout from '../../../components/ppc/PpcWizardLayout';
import { ppcT } from '../../../features/ppc/ppcStrings';
import ppcAutomationService from '../../../services/ppc/automationService';

const PpcExternalBayCalibrationPage: React.FC = () => {
  const handleStart = async () => {
    await ppcAutomationService.startExternalBayCalibration();
  };

  const handleConfirm = async () => {
    await ppcAutomationService.setExternalBayCalibrationCompleted();
  };

  return (
    <PpcWizardLayout
      code="4.3.4"
      title={ppcT('InstallationApp.ExternalBayCalibration', 'External bay calibration')}
      description={ppcT('InstallationApp.ExternalBayCalibrationMenuDescription', '')}
      steps={[
        { label: '1', active: true },
        { label: '2' },
        { label: '3' },
      ]}
      sideCards={[
        { title: ppcT('SensorCard.AxisVertical', 'Axis vertical') },
        { title: ppcT('SensorCard.Shutter', 'Shutter') },
      ]}
    >
      <div className="ppc-wizard__panel-title">
        {ppcT('InstallationApp.Calibration', 'Calibration')}
      </div>
      <div className="ppc-error-wizard__description">
        {ppcT('InstallationApp.ExternalBayCalibrationMenuDescription', '')}
      </div>
      <div className="ppc-form-actions">
        <PpcActionButton label={ppcT('InstallationApp.Start', 'Start')} onClick={handleStart} />
        <PpcActionButton label={ppcT('InstallationApp.ConfirmProcedure', 'Confirm procedure')} onClick={handleConfirm} />
      </div>
    </PpcWizardLayout>
  );
};

export default PpcExternalBayCalibrationPage;
