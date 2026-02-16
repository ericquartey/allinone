import React, { useEffect, useState } from 'react';
import PpcSensorsNavMenu from '../../../components/ppc/PpcSensorsNavMenu';
import PpcSensorTile from '../../../components/ppc/PpcSensorTile';
import ppcAutomationService from '../../../services/ppc/automationService';

const makeRange = (start: number, count: number) =>
  Array.from({ length: count }, (_, index) => String(start + index).padStart(2, '0'));

const renderTiles = (labels: string[], shape: 'circle' | 'square', data: boolean[] = []) => (
  <div className="ppc-sensors-admin__row">
    {labels.map((label, index) => (
      <PpcSensorTile key={`${shape}-${label}`} label={label} shape={shape} active={Boolean(data[index])} />
    ))}
  </div>
);

const PpcSensorsAdminPage: React.FC = () => {
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

  const toBool = (value: number) => value > 0;

  let faultOffset = 0;
  const nextFaults = (count: number) => {
    const slice = faults.slice(faultOffset, faultOffset + count);
    faultOffset += count;
    return slice;
  };

  let currentOffset = 0;
  const nextCurrents = (count: number) => {
    const slice = currents.slice(currentOffset, currentOffset + count);
    currentOffset += count;
    return slice.map(toBool);
  };

  return (
    <div className="ppc-page">
      <div className="ppc-sensors-layout">
        <PpcSensorsNavMenu activeKey="io-admin" />

        <div className="ppc-sensors-content">
          <div className="ppc-sensors-admin">
            <div className="ppc-sensors-admin__title">ADMIN</div>

            <div className="ppc-sensors-admin__block">
              <div className="ppc-sensors-admin__label">IO Baia 1 (+0/+0)</div>
              {renderTiles(makeRange(0, 8), 'square', nextFaults(8))}
              {renderTiles(makeRange(0, 16), 'circle', nextCurrents(16))}
            </div>

            <div className="ppc-sensors-admin__block">
              <div className="ppc-sensors-admin__label">IO Baia 2 (+8/+16)</div>
              {renderTiles(makeRange(0, 8), 'square', nextFaults(8))}
              {renderTiles(makeRange(0, 16), 'circle', nextCurrents(16))}
            </div>

            <div className="ppc-sensors-admin__block">
              <div className="ppc-sensors-admin__label">IO Baia 3 (+16/+32)</div>
              {renderTiles(makeRange(0, 8), 'square', nextFaults(8))}
              {renderTiles(makeRange(0, 16), 'circle', nextCurrents(16))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PpcSensorsAdminPage;
