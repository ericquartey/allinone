import React from 'react';
import PpcSensorControl from '../../../components/ppc/PpcSensorControl';
import PpcSensorsNavMenu from '../../../components/ppc/PpcSensorsNavMenu';
import { ppcT } from '../../../features/ppc/ppcStrings';
import { useGetSensorsQuery } from '../../../services/api/ppcAutomationApi';

const securitySensors = [
  ppcT('InstallationApp.SecurityFunctionActive', 'Security function active'),
  ppcT('InstallationApp.InverterInFault', 'Inverter in fault'),
  ppcT('InstallationApp.PreFireAlarm', 'Pre fire alarm'),
  ppcT('InstallationApp.FireAlarm', 'Fire alarm'),
  ppcT('InstallationApp.SensitiveEdgeAlarm', 'Sensitive edge alarm'),
  ppcT('InstallationApp.SensitiveCarpetsAlarm', 'Sensitive carpets alarm'),
];

const baySensors = [
  ppcT('InstallationApp.MushroomHeadButton', 'Mushroom head button'),
  ppcT('InstallationApp.AntiIntrusionGate', 'Anti intrusion gate'),
  ppcT('InstallationApp.AntiIntrusionGateInternal', 'Anti intrusion gate internal'),
  ppcT('InstallationApp.MicroCarterLeftSide', 'Micro carter left side'),
  ppcT('InstallationApp.MicroCarterRightSide', 'Micro carter right side'),
];

const PpcOtherSensorsPage: React.FC = () => {
  const sensorsQuery = useGetSensorsQuery(undefined, {
    pollingInterval: 1000,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const sensors = sensorsQuery.data ?? [];
  let offset = 0;
  const nextSlice = (count: number) => {
    const slice = sensors.slice(offset, offset + count);
    offset += count;
    return slice;
  };

  const securityData = nextSlice(securitySensors.length);
  const bay1Data = nextSlice(baySensors.length);
  const bay2Data = nextSlice(baySensors.length);
  const bay3Data = nextSlice(baySensors.length);

  return (
    <div className="ppc-page">
      <div className="ppc-sensors-layout">
        <PpcSensorsNavMenu activeKey="security" />

        <div className="ppc-sensors-content">
          <div className="ppc-sensors-columns">
            <div className="ppc-sensors-column">
              <div className="ppc-sensors-section">
                <div className="ppc-sensors-section__title">
                  {ppcT('InstallationApp.SecuritySensors', 'Security sensors')}
                </div>
                <div className="ppc-sensors-section__list">
                  {securitySensors.map((label, index) => (
                    <PpcSensorControl key={label} label={label} active={Boolean(securityData[index])} />
                  ))}
                </div>
              </div>

              <div className="ppc-sensors-section">
                <div className="ppc-sensors-section__title">
                  {ppcT('InstallationApp.Bay1', 'Bay 1')}
                </div>
                <div className="ppc-sensors-section__list">
                  {baySensors.map((label, index) => (
                    <PpcSensorControl key={`bay1-${label}`} label={label} active={Boolean(bay1Data[index])} />
                  ))}
                </div>
              </div>
            </div>
            <div className="ppc-sensors-column">
              <div className="ppc-sensors-section">
                <div className="ppc-sensors-section__title">
                  {ppcT('InstallationApp.Bay2', 'Bay 2')}
                </div>
                <div className="ppc-sensors-section__list">
                  {baySensors.map((label, index) => (
                    <PpcSensorControl key={`bay2-${label}`} label={label} active={Boolean(bay2Data[index])} />
                  ))}
                </div>
              </div>

              <div className="ppc-sensors-section">
                <div className="ppc-sensors-section__title">
                  {ppcT('InstallationApp.Bay3', 'Bay 3')}
                </div>
                <div className="ppc-sensors-section__list">
                  {baySensors.map((label, index) => (
                    <PpcSensorControl key={`bay3-${label}`} label={label} active={Boolean(bay3Data[index])} />
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

export default PpcOtherSensorsPage;
