import React, { useEffect, useState } from 'react';
import PpcActionButton from '../../../components/ppc/PpcActionButton';
import PpcFormField from '../../../components/ppc/PpcFormField';
import PpcWizardLayout from '../../../components/ppc/PpcWizardLayout';
import { ppcT } from '../../../features/ppc/ppcStrings';
import ppcAutomationService from '../../../services/ppc/automationService';
import type { VerticalResolutionCalibrationProcedure } from '../../../services/ppc/automationTypes';

const PpcVerticalResolutionCalibrationPage: React.FC = () => {
  const [params, setParams] = useState<VerticalResolutionCalibrationProcedure | null>(null);
  const [startPosition, setStartPosition] = useState('0');
  const [destinationPosition, setDestinationPosition] = useState('0');
  const [measuredDistance, setMeasuredDistance] = useState('0');
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const data = await ppcAutomationService.getVerticalResolutionParameters();
        if (!isMounted) {
          return;
        }
        setParams(data);
        if (data.StartPosition != null) setStartPosition(String(data.StartPosition));
        if (data.FinalPosition != null) setDestinationPosition(String(data.FinalPosition));
      } catch {
        // Ignore fetch errors for now.
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const currentResolution = params?.Resolution ?? null;

  const handleMoveToStart = async () => {
    const targetPosition = Number(startPosition);
    if (!Number.isFinite(targetPosition)) {
      return;
    }
    await ppcAutomationService.moveElevatorToHeight(targetPosition, false);
  };

  const handleMoveToDestination = async () => {
    const targetPosition = Number(destinationPosition);
    if (!Number.isFinite(targetPosition)) {
      return;
    }
    await ppcAutomationService.moveElevatorToHeight(targetPosition, false);
  };

  const handleSave = async () => {
    const measured = Number(measuredDistance);
    const expected = Math.abs(Number(destinationPosition) - Number(startPosition));
    if (!Number.isFinite(measured) || measured <= 0 || !Number.isFinite(expected) || expected <= 0) {
      return;
    }
    try {
      setIsBusy(true);
      const newResolution = await ppcAutomationService.getAdjustedVerticalResolution(measured, expected);
      await ppcAutomationService.updateVerticalResolution(newResolution);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <PpcWizardLayout
      code="4.2.2"
      title={ppcT('InstallationApp.VerticalResolutionCalibration', 'Vertical resolution calibration')}
      description={ppcT('HelpDescriptions.ResolutionCalibrationFunctionDescription', '')}
      steps={[
        { label: '1', active: true },
        { label: '2' },
        { label: '3' },
        { label: '4' },
      ]}
      sideCards={[
        { title: ppcT('SensorCard.AxisVertical', 'Axis vertical') },
        { title: ppcT('SensorCard.AxisHorizontal', 'Axis horizontal') },
        { title: ppcT('SensorCard.Drawer', 'Drawer') },
        {
          title: ppcT('InstallationApp.CurrentResolution', 'Current resolution'),
          lines: [currentResolution != null ? currentResolution.toFixed(6) : '--'],
        },
      ]}
    >
      <div className="ppc-wizard__panel-title">
        {ppcT('InstallationApp.AttachMeter', 'Attach meter')}
      </div>
      <div className="ppc-error-wizard__description">
        {ppcT('InstallationApp.ElevatorHighAttachMeter', '')}
      </div>
      <div className="ppc-form-grid">
        <PpcFormField
          label={ppcT('InstallationApp.StartQuote', 'Start quote')}
          value={startPosition}
          onChange={setStartPosition}
        />
        <PpcActionButton label={ppcT('InstallationApp.GoToPosition', 'Go to position')} onClick={handleMoveToStart} />
        <PpcFormField
          label={ppcT('InstallationApp.DestinationPosition', 'Destination position')}
          value={destinationPosition}
          onChange={setDestinationPosition}
        />
        <PpcActionButton
          label={ppcT('InstallationApp.GoToInitialPosition', 'Go to initial position')}
          onClick={handleMoveToDestination}
        />
        <PpcFormField
          label={ppcT('InstallationApp.MisuredPosition', 'Measured position')}
          value={measuredDistance}
          onChange={setMeasuredDistance}
        />
      </div>
      <div className="ppc-form-actions">
        <PpcActionButton label={ppcT('InstallationApp.Forwards', 'Forwards')} onClick={handleMoveToDestination} />
        <PpcActionButton label={ppcT('InstallationApp.Save', 'Save')} onClick={handleSave} disabled={isBusy} />
      </div>
    </PpcWizardLayout>
  );
};

export default PpcVerticalResolutionCalibrationPage;
