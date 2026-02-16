import React from 'react';
import PpcSensorControl from '../../../components/ppc/PpcSensorControl';
import PpcSensorsNavMenu from '../../../components/ppc/PpcSensorsNavMenu';
import { ppcT } from '../../../features/ppc/ppcStrings';
import { useGetSensorsQuery } from '../../../services/api/ppcAutomationApi';

const verticalSensors = [
  ppcT('InstallationApp.EmergencyEndRun', 'Emergency end run'),
  ppcT('InstallationApp.ZeroVerticalSensor', 'Zero vertical sensor'),
  ppcT('InstallationApp.ElevatorEngineSelected', 'Elevator engine selected'),
  ppcT('InstallationApp.CradleEngineSelected', 'Cradle engine selected'),
];

const cradleSensors = [
  ppcT('InstallationApp.ZeroPawlSensor', 'Zero pawl sensor'),
  ppcT('InstallationApp.LuPresenceOnMachineCradleSide', 'LU presence machine side'),
  ppcT('InstallationApp.LuPresenceOnOperatorCradleSide', 'LU presence operator side'),
];

const PpcVerticalAxisSensorsPage: React.FC = () => {
  const sensorsQuery = useGetSensorsQuery(undefined, {
    pollingInterval: 1000,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const sensors = sensorsQuery.data ?? [];

  return (
    <div className="ppc-page">
      <div className="ppc-sensors-layout">
        <PpcSensorsNavMenu activeKey="vertical-axis" />

        <div className="ppc-sensors-content">
          <div className="ppc-sensors-columns">
            <div className="ppc-sensors-column">
              <div className="ppc-sensors-section">
                <div className="ppc-sensors-section__title">
                  {ppcT('InstallationApp.VerticalAxis', 'Vertical axis')}
                </div>
                <div className="ppc-sensors-section__list">
                  {verticalSensors.map((label, index) => (
                    <PpcSensorControl key={label} label={label} active={Boolean(sensors[index])} />
                  ))}
                </div>
              </div>
            </div>
            <div className="ppc-sensors-column">
              <div className="ppc-sensors-section">
                <div className="ppc-sensors-section__title">
                  {ppcT('InstallationApp.Cradle', 'Cradle')}
                </div>
                <div className="ppc-sensors-section__list">
                  {cradleSensors.map((label, index) => (
                    <PpcSensorControl key={label} label={label} active={Boolean(sensors[index + verticalSensors.length])} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="ppc-legend">
          <div className="ppc-legend-inner">
            <div className="ppc-legend-content">
              <div className="ppc-title ppc-title--legend">
                {ppcT('InstallationApp.Legend', 'Legend')}
              </div>
              <PpcSensorControl label={ppcT('InstallationApp.ActiveSensor', 'Active sensor')} active compact />
              <PpcSensorControl label={ppcT('InstallationApp.DeactivatedSensor', 'Deactivated sensor')} compact />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PpcVerticalAxisSensorsPage;
