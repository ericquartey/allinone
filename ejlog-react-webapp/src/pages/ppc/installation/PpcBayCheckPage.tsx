import React, { useMemo, useState } from 'react';
import PpcActionButton from '../../../components/ppc/PpcActionButton';
import PpcFormField from '../../../components/ppc/PpcFormField';
import PpcWizardLayout from '../../../components/ppc/PpcWizardLayout';
import { ppcT } from '../../../features/ppc/ppcStrings';
import { useGetBayQuery } from '../../../services/api/ppcAutomationApi';
import ppcAutomationService from '../../../services/ppc/automationService';
import { PPC_BAY_NUMBER } from '../../../config/api';

const PpcBayCheckPage: React.FC = () => {
  const bayQuery = useGetBayQuery(PPC_BAY_NUMBER, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const [bayNumber] = useState(String(PPC_BAY_NUMBER));
  const [position, setPosition] = useState('UP');
  const [initialPosition, setInitialPosition] = useState('');
  const [displacement, setDisplacement] = useState('');

  const bayPositionId = useMemo(() => {
    const positions = bayQuery.data?.Positions ?? [];
    const isUpper = position.toUpperCase() === 'UP';
    const target = positions.find((pos) => Boolean(pos.IsUpper) === isUpper) ?? positions[0];
    return target?.Id ?? null;
  }, [bayQuery.data, position]);

  const handleMoveToPosition = async () => {
    if (!bayPositionId) {
      return;
    }
    await ppcAutomationService.moveElevatorToBayPosition(bayPositionId, true, false);
  };

  const handleMoveElevator = async () => {
    const target = Number(initialPosition);
    if (!Number.isFinite(target)) {
      return;
    }
    await ppcAutomationService.moveElevatorToHeight(target, false);
  };

  const handleNext = async () => {
    const displacementValue = Number(displacement);
    if (!Number.isFinite(displacementValue) || !bayPositionId) {
      return;
    }
    await ppcAutomationService.updateBayHeight(bayPositionId, displacementValue);
  };

  return (
    <PpcWizardLayout
      code="4.3.1"
      title={ppcT('InstallationApp.BayHeightCheck', 'Bay height check')}
      description={ppcT('HelpDescriptions.HelpBCTRDescription', '')}
      steps={[
        { label: '1', active: true },
        { label: '2' },
        { label: '3' },
      ]}
      sideCards={[
        { title: ppcT('SensorCard.AxisVertical', 'Axis vertical') },
        { title: ppcT('SensorCard.AxisHorizontal', 'Axis horizontal') },
        { title: ppcT('SensorCard.Shutter', 'Shutter') },
      ]}
    >
      <div className="ppc-wizard__panel-title">
        {ppcT('InstallationApp.HighPositionControl', 'High position control')}
      </div>
      <div className="ppc-error-wizard__description">
        {ppcT('InstallationApp.MoveElevatorAtBayHeightOpenShutter', 'Move elevator at bay height')}
      </div>
      <div className="ppc-form-grid">
        <PpcFormField label={ppcT('InstallationApp.Bay', 'Bay')} value={bayNumber} disabled />
        <PpcFormField
          label={ppcT('InstallationApp.Position', 'Position')}
          value={position}
          onChange={setPosition}
        />
        <PpcFormField
          label={ppcT('InstallationApp.InitialPosition', 'Initial position')}
          value={initialPosition}
          onChange={setInitialPosition}
        />
        <PpcFormField
          label={ppcT('InstallationApp.Displacement', 'Displacement')}
          value={displacement}
          onChange={setDisplacement}
        />
      </div>
      <div className="ppc-form-row">
        <PpcActionButton label={ppcT('InstallationApp.MoveToPosition', 'Move to position')} onClick={handleMoveToPosition} />
        <PpcActionButton label={ppcT('InstallationApp.MoveElevator', 'Move elevator')} onClick={handleMoveElevator} />
        <PpcActionButton label={ppcT('InstallationApp.NextLarge', 'Next')} onClick={handleNext} />
      </div>
    </PpcWizardLayout>
  );
};

export default PpcBayCheckPage;
