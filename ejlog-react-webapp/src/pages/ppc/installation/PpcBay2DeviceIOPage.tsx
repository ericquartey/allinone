import React, { useEffect, useState } from 'react';
import PpcSensorControl from '../../../components/ppc/PpcSensorControl';
import PpcSensorsNavMenu from '../../../components/ppc/PpcSensorsNavMenu';
import { ppcT } from '../../../features/ppc/ppcStrings';
import ppcAutomationService from '../../../services/ppc/automationService';

const faultEntries = [
  { id: 'fault-1', label: ppcT('InstallationApp.ExitError1', 'Exit error 1') },
  { id: 'fault-2', label: ppcT('InstallationApp.ExitError2', 'Exit error 2') },
  { id: 'fault-3', label: ppcT('InstallationApp.ExitError3', 'Exit error 3') },
  { id: 'fault-4', label: ppcT('InstallationApp.ExitError4', 'Exit error 4') },
  { id: 'fault-5', label: ppcT('InstallationApp.ExitError5', 'Exit error 5') },
  { id: 'fault-6', label: ppcT('InstallationApp.ExitError6', 'Exit error 6') },
  { id: 'fault-7', label: ppcT('InstallationApp.ExitError7', 'Exit error 7') },
  { id: 'fault-8', label: ppcT('InstallationApp.ExitError8', 'Exit error 8') },
];

const currentEntries = [
  { id: 'current-1', label: ppcT('InstallationApp.CurrentExit1', 'Current exit 1') },
  { id: 'current-2', label: ppcT('InstallationApp.CurrentExit2', 'Current exit 2') },
  { id: 'current-3', label: ppcT('InstallationApp.CurrentExit3', 'Current exit 3') },
  { id: 'current-4', label: ppcT('InstallationApp.CurrentExit4', 'Current exit 4') },
  { id: 'current-5', label: ppcT('InstallationApp.CurrentExit5', 'Current exit 5') },
  { id: 'current-6', label: ppcT('InstallationApp.CurrentExit6', 'Current exit 6') },
  { id: 'current-7', label: ppcT('InstallationApp.CurrentExit7', 'Current exit 7') },
  { id: 'current-8', label: ppcT('InstallationApp.CurrentExit8', 'Current exit 8') },
];

const PpcBay2DeviceIOPage: React.FC = () => {
  const [faults, setFaults] = useState<boolean[]>([]);
  const [currents, setCurrents] = useState<number[]>([]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [faultData, currentData] = await Promise.all([
          ppcAutomationService.getSensorsOutFault(),
          ppcAutomationService.getSensorsOutCurrent(),
        ]);
        if (isMounted) {
          setFaults(faultData);
          setCurrents(currentData);
        }
      } catch {
        // Ignore fetch errors for now.
      }
    };
    load();
    const timer = window.setInterval(load, 1000);
    return () => {
      isMounted = false;
      window.clearInterval(timer);
    };
  }, []);

  const faultOffset = 8;
  const currentOffset = 16;

  return (
    <div className="ppc-page">
      <div className="ppc-grid">
        <PpcSensorsNavMenu activeKey="io2" />

        <div className="ppc-center-grid">
          <h1 className="ppc-title">{ppcT('InstallationApp.Bay2', 'Bay 2')}</h1>

          <div className="ppc-sensor-list ppc-faults">
            {faultEntries.map((entry, index) => (
              <PpcSensorControl key={entry.id} label={entry.label} active={Boolean(faults[index + faultOffset])} />
            ))}
          </div>

          <div className="ppc-sensor-list ppc-currents">
            {currentEntries.map((entry, index) => (
              <div key={entry.id} className="ppc-value-row">
                <PpcSensorControl label={entry.label} transparent compact />
                <span className="ppc-value">{currents[index + currentOffset] ?? 0}</span>
              </div>
            ))}
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

export default PpcBay2DeviceIOPage;
