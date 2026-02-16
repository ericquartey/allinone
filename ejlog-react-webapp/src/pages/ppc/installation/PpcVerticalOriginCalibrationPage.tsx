import React, { useEffect, useState } from 'react';
import PpcActionButton from '../../../components/ppc/PpcActionButton';
import PpcLabeledText from '../../../components/ppc/PpcLabeledText';
import PpcSensorCard from '../../../components/ppc/PpcSensorCard';
import { ppcT } from '../../../features/ppc/ppcStrings';
import ppcAutomationService from '../../../services/ppc/automationService';
import type { HomingProcedureParameters } from '../../../services/ppc/automationTypes';

const PpcVerticalOriginCalibrationPage: React.FC = () => {
  const [params, setParams] = useState<HomingProcedureParameters | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const data = await ppcAutomationService.getVerticalOriginParameters();
        if (isMounted) {
          setParams(data);
        }
      } catch {
        // Ignore fetch errors for now.
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const formatValue = (value?: number) => (value == null ? '--' : value.toFixed(3));

  const handleStart = async () => {
    try {
      setIsBusy(true);
      await ppcAutomationService.startVerticalOriginProcedure();
    } finally {
      setIsBusy(false);
    }
  };

  const handleStop = async () => {
    try {
      setIsBusy(true);
      await ppcAutomationService.stopVerticalOriginProcedure();
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="ppc-page">
      <div className="ppc-elevator">
        <div className="ppc-elevator__title">
          <span className="ppc-elevator__code">4.2.1</span>
          <span>{ppcT('InstallationApp.OriginVerticalAxis', 'Vertical axis origin')}</span>
        </div>
        <div className="ppc-elevator__description">
          {ppcT('HelpDescriptions.HelpVACDescription', '')}
        </div>

        <div className="ppc-elevator__sensor-row">
          <PpcSensorCard title={ppcT('SensorCard.AxisVertical', 'Axis vertical')} />
          <PpcSensorCard title={ppcT('SensorCard.AxisHorizontal', 'Axis horizontal')} />
          <PpcSensorCard title={ppcT('SensorCard.Position', 'Position')} />
          <PpcSensorCard title={ppcT('SensorCard.Drawer', 'Drawer')} />
        </div>

        <div className="ppc-elevator__stats">
          <PpcLabeledText
            label={ppcT('InstallationApp.LowerBound', 'Lower bound')}
            value={formatValue(params?.LowerBound)}
            align="center"
          />
          <PpcLabeledText
            label={ppcT('InstallationApp.UpperBound', 'Upper bound')}
            value={formatValue(params?.UpperBound)}
            align="center"
          />
          <PpcLabeledText
            label={ppcT('InstallationApp.Offset', 'Offset')}
            value={formatValue(params?.Offset)}
            align="center"
          />
          <PpcLabeledText
            label={ppcT('InstallationApp.Resolution', 'Resolution')}
            value={formatValue(params?.Resolution)}
            align="center"
          />
        </div>

        <div className="ppc-elevator__actions ppc-elevator__actions--end">
          <PpcActionButton
            label={ppcT('InstallationApp.Start', 'Start')}
            onClick={handleStart}
            disabled={isBusy}
          />
          <PpcActionButton
            label={ppcT('InstallationApp.Stop', 'Stop')}
            onClick={handleStop}
            disabled={isBusy}
          />
        </div>
      </div>
    </div>
  );
};

export default PpcVerticalOriginCalibrationPage;
