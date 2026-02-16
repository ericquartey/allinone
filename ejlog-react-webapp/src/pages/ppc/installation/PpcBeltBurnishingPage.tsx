import React, { useEffect, useState } from 'react';
import PpcActionButton from '../../../components/ppc/PpcActionButton';
import PpcFormField from '../../../components/ppc/PpcFormField';
import PpcSensorCard from '../../../components/ppc/PpcSensorCard';
import { ppcT } from '../../../features/ppc/ppcStrings';
import ppcAutomationService from '../../../services/ppc/automationService';
import type { RepeatedTestProcedure } from '../../../services/ppc/automationTypes';

const PpcBeltBurnishingPage: React.FC = () => {
  const [params, setParams] = useState<RepeatedTestProcedure | null>(null);
  const [lowerBound, setLowerBound] = useState('0');
  const [upperBound, setUpperBound] = useState('0');
  const [delayBetween, setDelayBetween] = useState('0');
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const data = await ppcAutomationService.getBeltBurnishingParameters();
        if (!isMounted) {
          return;
        }
        setParams(data);
        if (data.LowerPosition != null) setLowerBound(String(data.LowerPosition));
        if (data.UpperPosition != null) setUpperBound(String(data.UpperPosition));
        if (data.DelayBetweenCycles != null) setDelayBetween(String(data.DelayBetweenCycles));
      } catch {
        // Ignore fetch errors for now.
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const completedCycles = params?.PerformedCycles ?? 0;
  const totalCycles = params?.TotalCycles ?? params?.TotalCycles ?? 0;
  const progress = totalCycles > 0 ? Math.min(100, (completedCycles / totalCycles) * 100) : 0;

  const handleReset = async () => {
    try {
      setIsBusy(true);
      await ppcAutomationService.resetBeltBurnishing();
      const data = await ppcAutomationService.getBeltBurnishingParameters();
      setParams(data);
    } finally {
      setIsBusy(false);
    }
  };

  const handleStart = async () => {
    const upperPosition = Number(upperBound);
    const lowerPosition = Number(lowerBound);
    const delayStart = Number(delayBetween);
    if (!Number.isFinite(upperPosition) || !Number.isFinite(lowerPosition) || !Number.isFinite(delayStart)) {
      return;
    }
    try {
      setIsBusy(true);
      await ppcAutomationService.startBeltBurnishing({
        upperPosition,
        lowerPosition,
        delayStart,
      });
    } finally {
      setIsBusy(false);
    }
  };

  const handleStop = async () => {
    try {
      setIsBusy(true);
      await ppcAutomationService.stopBeltBurnishing();
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="ppc-page">
      <div className="ppc-elevator">
        <div className="ppc-elevator__title">
          <span className="ppc-elevator__code">4.2.3</span>
          <span>{ppcT('InstallationApp.BeltBurnishing', 'Belt burnishing')}</span>
        </div>
        <div className="ppc-elevator__description">
          {ppcT('HelpDescriptions.BeltBurnishingFunctionDescription', '')}
        </div>

        <div className="ppc-elevator__sensor-row">
          <PpcSensorCard title={ppcT('SensorCard.AxisVertical', 'Axis vertical')} />
          <PpcSensorCard title={ppcT('SensorCard.AxisHorizontal', 'Axis horizontal')} />
          <PpcSensorCard title={ppcT('SensorCard.Drawer', 'Drawer')} />
          <div className="ppc-panel ppc-elevator__panel">
            <div className="ppc-panel__title">
              {ppcT('InstallationApp.TotalCyclesCompleted', 'Total cycles completed')}
            </div>
            <div className="ppc-progress">
              <div className="ppc-progress__bar">
                <div className="ppc-progress__fill" style={{ width: `${progress}%`, background: 'var(--ppc-green)' }} />
                <div className="ppc-progress__value">{completedCycles} / {totalCycles}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="ppc-elevator__grid">
          <div className="ppc-elevator__main">
            <div className="ppc-form-grid">
              <PpcFormField
                label={ppcT('InstallationApp.LowerBound', 'Lower bound')}
                value={lowerBound}
                onChange={setLowerBound}
              />
              <PpcFormField
                label={ppcT('InstallationApp.UpperBound', 'Upper bound')}
                value={upperBound}
                onChange={setUpperBound}
              />
              <PpcFormField
                label={ppcT('InstallationApp.DelayBetweenCycles', 'Delay between cycles')}
                value={delayBetween}
                onChange={setDelayBetween}
              />
            </div>
          </div>
          <div className="ppc-elevator__side">
            <div className="ppc-panel ppc-elevator__panel">
              <div className="ppc-panel__title">
                {ppcT('InstallationApp.FullTestSessionCycles', 'Full test session cycles')}
              </div>
              <div className="ppc-panel__value">{totalCycles}</div>
            </div>
          </div>
        </div>

        <div className="ppc-elevator__actions">
          <PpcActionButton
            label={ppcT('InstallationApp.Reset', 'Reset')}
            onClick={handleReset}
            disabled={isBusy}
          />
          <div className="ppc-elevator__actions-right">
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
    </div>
  );
};

export default PpcBeltBurnishingPage;
