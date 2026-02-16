import React, { useEffect, useMemo, useState } from 'react';
import PpcActionButton from '../../../components/ppc/PpcActionButton';
import PpcFormField from '../../../components/ppc/PpcFormField';
import PpcLabeledText from '../../../components/ppc/PpcLabeledText';
import { ppcT } from '../../../features/ppc/ppcStrings';
import ppcAutomationService from '../../../services/ppc/automationService';
import { Orientation, type WeightMeasurement } from '../../../services/ppc/automationTypes';

const PpcElevatorWeightAnalysisPage: React.FC = () => {
  const [loadingUnitId, setLoadingUnitId] = useState('');
  const [netWeight, setNetWeight] = useState('');
  const [displacement, setDisplacement] = useState('');
  const [elevatorPosition, setElevatorPosition] = useState<number | null>(null);
  const [weightMeasurement, setWeightMeasurement] = useState<WeightMeasurement | null>(null);
  const [elevatorWeight, setElevatorWeight] = useState<number | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [, position, weight, weightData] = await Promise.all([
          ppcAutomationService.getWeightAnalysisParameters(Orientation.Vertical),
          ppcAutomationService.getElevatorPosition(),
          ppcAutomationService.getElevatorWeight(),
          ppcAutomationService.getVerticalWeightMeasurement(),
        ]);
        if (!isMounted) {
          return;
        }
        setWeightMeasurement(weightData as WeightMeasurement);
        setElevatorPosition(position?.Vertical ?? null);
        setElevatorWeight(weight);
      } catch {
        // Ignore fetch errors for now.
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const averageCurrent = useMemo(() => {
    const data = weightMeasurement?.WeightData ?? [];
    if (data.length === 0) {
      return null;
    }
    const sum = data.reduce((acc, item) => acc + (item.Current ?? 0), 0);
    return sum / data.length;
  }, [weightMeasurement]);

  const handleStart = async () => {
    const displacementValue = Number(displacement);
    const netWeightValue = Number(netWeight);
    const loadingUnitValue = Number(loadingUnitId);
    if (!Number.isFinite(displacementValue) || !Number.isFinite(netWeightValue)) {
      return;
    }
    try {
      setIsBusy(true);
      await ppcAutomationService.startWeightAnalysis({
        displacement: displacementValue,
        netWeight: netWeightValue,
        loadingUnitId: Number.isFinite(loadingUnitValue) ? loadingUnitValue : undefined,
      });
    } finally {
      setIsBusy(false);
    }
  };

  const handleStop = async () => {
    try {
      setIsBusy(true);
      await ppcAutomationService.stopWeightAnalysis();
    } finally {
      setIsBusy(false);
    }
  };

  const handleMoveToPosition = async () => {
    const target = Number(displacement);
    if (!Number.isFinite(target)) {
      return;
    }
    await ppcAutomationService.moveElevatorToHeight(target, false);
  };

  return (
    <div className="ppc-page">
      <div className="ppc-elevator">
        <div className="ppc-elevator__title">
          {ppcT('InstallationApp.WeightAnalysis', 'Weight analysis')}
        </div>

        <div className="ppc-elevator__main">
          <div className="ppc-form-grid">
            <PpcFormField
              label={ppcT('InstallationApp.LoadedTray', 'Loaded tray')}
              value={loadingUnitId}
              onChange={setLoadingUnitId}
            />
            <PpcFormField
              label={ppcT('InstallationApp.NetWeight', 'Net weight (kg)')}
              value={netWeight}
              onChange={setNetWeight}
            />
            <PpcLabeledText
              label={ppcT('InstallationApp.TrayTare', 'Tray tare (kg)')}
              value={elevatorWeight != null ? elevatorWeight.toFixed(2) : '0.0'}
            />
            <PpcLabeledText
              label={ppcT('InstallationApp.ElevatorVerticalPosition', 'Elevator vertical position')}
              value={elevatorPosition != null ? elevatorPosition.toFixed(2) : '0.0'}
            />
            <PpcFormField
              label={ppcT('InstallationApp.Displacement', 'Displacement')}
              value={displacement}
              onChange={setDisplacement}
            />
            <PpcLabeledText
              label={ppcT('InstallationApp.AverageCurrent', 'Average current')}
              value={averageCurrent != null ? averageCurrent.toFixed(4) : '0.0000'}
            />
          </div>

          <div className="ppc-chart-placeholder">
            {ppcT('InstallationApp.Time', 'Time')} / {ppcT('InstallationApp.Current', 'Current')}
          </div>

          <div className="ppc-form-actions ppc-form-actions--start">
            <PpcActionButton label={ppcT('InstallationApp.Stop', 'Stop')} onClick={handleStop} disabled={isBusy} />
            <PpcActionButton label={ppcT('InstallationApp.Start', 'Start')} onClick={handleStart} disabled={isBusy} />
            <PpcActionButton
              label={ppcT('InstallationApp.MoveToElevatorPosition', 'Move to elevator position')}
              onClick={handleMoveToPosition}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PpcElevatorWeightAnalysisPage;
