import React, { useMemo, useState } from 'react';
import PpcActionButton from '../../../components/ppc/PpcActionButton';
import PpcFormField from '../../../components/ppc/PpcFormField';
import PpcSensorCard from '../../../components/ppc/PpcSensorCard';
import { ppcT } from '../../../features/ppc/ppcStrings';
import { useGetBayQuery } from '../../../services/api/ppcAutomationApi';
import ppcAutomationService from '../../../services/ppc/automationService';
import { LoadingUnitLocation } from '../../../services/ppc/automationTypes';
import { PPC_BAY_NUMBER } from '../../../config/api';

const PpcCallDrawerPage: React.FC = () => {
  const [loadingUnitId, setLoadingUnitId] = useState('');
  const [selectedPositionId, setSelectedPositionId] = useState<number | null>(null);

  const bayQuery = useGetBayQuery(PPC_BAY_NUMBER, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const positions = bayQuery.data?.Positions ?? [];
  const lowerPosition = positions.find((pos) => !pos.IsUpper);
  const upperPosition = positions.find((pos) => pos.IsUpper);

  const selectedLocation = useMemo(() => {
    const position = positions.find((pos) => pos.Id === selectedPositionId);
    if (position?.Location != null) {
      return position.Location;
    }
    return LoadingUnitLocation.Elevator;
  }, [positions, selectedPositionId]);

  const handleCallUnit = async () => {
    const unitId = Number(loadingUnitId);
    if (!Number.isFinite(unitId)) {
      return;
    }
    await ppcAutomationService.startMovingLoadingUnitToBay(unitId, selectedLocation);
  };

  const handleStop = async () => {
    await ppcAutomationService.stopAllMovements();
  };

  return (
    <div className="ppc-page">
      <div className="ppc-elevator">
        <div className="ppc-elevator__title">
          {ppcT('InstallationApp.CallUnit', 'Call unit')}:
        </div>

        <div className="ppc-elevator__grid">
          <div className="ppc-elevator__main">
            <div className="ppc-elevator__description">
              {ppcT(
                'InstallationApp.LoadingUnitFromBayToBaySelectDrawerPosition',
                'Select drawer position',
              )}
            </div>

            <div className="ppc-form-row">
              <PpcActionButton
                label={ppcT('InstallationApp.BayPositionDown', 'Bay position down')}
                onClick={() => setSelectedPositionId(lowerPosition?.Id ?? null)}
              />
              <PpcActionButton
                label={ppcT('InstallationApp.BayPositionUp', 'Bay position up')}
                onClick={() => setSelectedPositionId(upperPosition?.Id ?? null)}
              />
            </div>

            <div className="ppc-form-grid">
              <PpcFormField
                label={ppcT('InstallationApp.DrawerNumber', 'Drawer number')}
                value={loadingUnitId}
                onChange={setLoadingUnitId}
              />
              <div className="ppc-form-actions ppc-form-actions--start">
                <PpcActionButton label={ppcT('InstallationApp.CallUnit', 'Call unit')} onClick={handleCallUnit} />
              </div>
            </div>

            <div className="ppc-elevator__actions">
              <PpcActionButton label={ppcT('General.Cancel', 'Cancel')} />
            </div>
          </div>

          <div className="ppc-elevator__side">
            <PpcSensorCard title={ppcT('SensorCard.AxisHorizontal', 'Axis horizontal')} />
            <PpcSensorCard title={ppcT('SensorCard.AxisVertical', 'Axis vertical')} />
            <PpcSensorCard title={ppcT('SensorCard.Shutter', 'Shutter')} />
            <PpcSensorCard title={ppcT('SensorCard.Position', 'Position')} />
            <PpcActionButton label={ppcT('InstallationApp.Stop', 'Stop')} onClick={handleStop} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PpcCallDrawerPage;
