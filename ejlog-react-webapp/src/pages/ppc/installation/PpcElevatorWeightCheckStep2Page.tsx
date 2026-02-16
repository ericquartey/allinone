import React, { useEffect, useState } from 'react';
import PpcActionButton from '../../../components/ppc/PpcActionButton';
import PpcFormField from '../../../components/ppc/PpcFormField';
import PpcLabeledText from '../../../components/ppc/PpcLabeledText';
import PpcWizardLayout from '../../../components/ppc/PpcWizardLayout';
import { ppcT } from '../../../features/ppc/ppcStrings';
import ppcAutomationService from '../../../services/ppc/automationService';

const PpcElevatorWeightCheckStep2Page: React.FC = () => {
  const [loadingUnitId, setLoadingUnitId] = useState<number | null>(null);
  const [insertedWeight, setInsertedWeight] = useState('');
  const [runToTest, setRunToTest] = useState('');
  const [measuredWeight, setMeasuredWeight] = useState<number | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('ppc.weightCheck.loadingUnitId');
    if (stored) {
      const value = Number(stored);
      if (Number.isFinite(value)) {
        setLoadingUnitId(value);
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadWeight = async () => {
      try {
        const weight = await ppcAutomationService.getElevatorWeight();
        if (isMounted) {
          setMeasuredWeight(weight);
        }
      } catch {
        // Ignore fetch errors for now.
      }
    };
    loadWeight();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleStart = async () => {
    if (!loadingUnitId) {
      return;
    }
    const weightValue = Number(insertedWeight);
    const runValue = Number(runToTest);
    if (!Number.isFinite(weightValue) || !Number.isFinite(runValue)) {
      return;
    }
    try {
      setIsBusy(true);
      await ppcAutomationService.startWeightCheck({
        loadingUnitId,
        runToTest: runValue,
        weight: weightValue,
      });
    } finally {
      setIsBusy(false);
    }
  };

  const handleStop = async () => {
    try {
      setIsBusy(true);
      await ppcAutomationService.stopWeightCheck();
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <PpcWizardLayout
      title={ppcT('InstallationApp.WeightControl', 'Weight control')}
      steps={[
        { label: '1' },
        { label: '2', active: true },
      ]}
    >
      <div className="ppc-wizard__panel-title">
        {ppcT('InstallationApp.WeightControl', 'Weight control')}
      </div>
      <div className="ppc-form-grid">
        <PpcLabeledText
          label={ppcT('InstallationApp.AcceptableWeightTolerance', 'Required tolerance (%)')}
          value="0"
        />
        <PpcFormField
          label={ppcT('InstallationApp.InsertedWeight', 'Inserted weight (kg)')}
          value={insertedWeight}
          onChange={setInsertedWeight}
        />
        <PpcFormField
          label={ppcT('InstallationApp.TestRun', 'Test run (mm)')}
          value={runToTest}
          onChange={setRunToTest}
        />
        <PpcLabeledText
          label={ppcT('InstallationApp.MeasuredWeight', 'Measured weight (kg)')}
          value={measuredWeight != null ? measuredWeight.toFixed(2) : '0.0'}
        />
      </div>
      <div className="ppc-form-actions">
        <PpcActionButton label={ppcT('InstallationApp.Stop', 'Stop')} onClick={handleStop} disabled={isBusy} />
        <PpcActionButton label={ppcT('InstallationApp.Start', 'Start')} onClick={handleStart} disabled={isBusy} />
      </div>
      <PpcLabeledText label={ppcT('InstallationApp.Output', 'Output')} value="-" />
    </PpcWizardLayout>
  );
};

export default PpcElevatorWeightCheckStep2Page;
