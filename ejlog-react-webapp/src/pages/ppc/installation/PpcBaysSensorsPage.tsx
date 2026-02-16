import React from 'react';
import PpcSensorControl from '../../../components/ppc/PpcSensorControl';
import PpcSensorsNavMenu from '../../../components/ppc/PpcSensorsNavMenu';
import { ppcT } from '../../../features/ppc/ppcStrings';
import { useGetSensorsQuery } from '../../../services/api/ppcAutomationApi';

const bay1Internal = [
  ppcT('InstallationApp.UnitHightPosition', 'Unit high position'),
  ppcT('InstallationApp.UnitLowPosition', 'Unit low position'),
  ppcT('InstallationApp.BarrierCalibration', 'Barrier calibration'),
  ppcT('InstallationApp.ShutterSensorA', 'Shutter sensor A'),
  ppcT('InstallationApp.ShutterSensorB', 'Shutter sensor B'),
  ppcT('InstallationApp.ZeroChainCarousel', 'Zero chain carousel'),
  ppcT('InstallationApp.BayTelescopic', 'Bay telescopic'),
];

const bayExternal = [
  ppcT('InstallationApp.UnitExternalPosition', 'Unit external position'),
  ppcT('InstallationApp.UnitInternalPosition', 'Unit internal position'),
  ppcT('InstallationApp.BarrierCalibration', 'Barrier calibration'),
  ppcT('InstallationApp.ShutterSensorA', 'Shutter sensor A'),
  ppcT('InstallationApp.ShutterSensorB', 'Shutter sensor B'),
  ppcT('InstallationApp.ZeroChain', 'Zero chain'),
];

const bayExternalDouble = [
  ppcT('InstallationApp.UnitHightInternalPosition', 'Unit high internal position'),
  ppcT('InstallationApp.UnitLowInternalPosition', 'Unit low internal position'),
  ppcT('InstallationApp.UnitHightPosition', 'Unit high position'),
  ppcT('InstallationApp.UnitLowPosition', 'Unit low position'),
  ppcT('InstallationApp.BarrierCalibration', 'Barrier calibration'),
  ppcT('InstallationApp.ShutterSensorA', 'Shutter sensor A'),
  ppcT('InstallationApp.ShutterSensorB', 'Shutter sensor B'),
  ppcT('InstallationApp.ZeroChainUp', 'Zero chain up'),
  ppcT('InstallationApp.ZeroChainDown', 'Zero chain down'),
];

const renderSection = (title: string, items: string[], data: boolean[] = []) => (
  <div className="ppc-sensors-section">
    <div className="ppc-sensors-section__title">{title}</div>
    <div className="ppc-sensors-section__list">
      {items.map((label, index) => (
        <PpcSensorControl key={label} label={label} active={Boolean(data[index])} />
      ))}
    </div>
  </div>
);

const PpcBaysSensorsPage: React.FC = () => {
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

  return (
    <div className="ppc-page">
      <div className="ppc-sensors-layout">
        <PpcSensorsNavMenu activeKey="bays" />

        <div className="ppc-sensors-content">
          <div className="ppc-sensors-columns">
            <div className="ppc-sensors-column">
              {renderSection(ppcT('InstallationApp.Bay1', 'Bay 1'), bay1Internal, nextSlice(bay1Internal.length))}
              {renderSection(ppcT('InstallationApp.ExternalBay', 'External bay'), bayExternal, nextSlice(bayExternal.length))}
              {renderSection(ppcT('InstallationApp.Bay1ExternalDouble', 'Bay 1 external double'), bayExternalDouble, nextSlice(bayExternalDouble.length))}
            </div>
            <div className="ppc-sensors-column">
              {renderSection(ppcT('InstallationApp.Bay2', 'Bay 2'), bay1Internal, nextSlice(bay1Internal.length))}
              {renderSection(ppcT('InstallationApp.ExternalBay', 'External bay'), bayExternal, nextSlice(bayExternal.length))}
              {renderSection(ppcT('InstallationApp.Bay2ExternalDouble', 'Bay 2 external double'), bayExternalDouble, nextSlice(bayExternalDouble.length))}
              {renderSection(ppcT('InstallationApp.Bay3', 'Bay 3'), bay1Internal, nextSlice(bay1Internal.length))}
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

export default PpcBaysSensorsPage;
