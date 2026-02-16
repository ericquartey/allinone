import React, { useEffect, useMemo, useState } from 'react';
import PpcActionButton from '../../../components/ppc/PpcActionButton';
import PpcFormField from '../../../components/ppc/PpcFormField';
import PpcWizardLayout from '../../../components/ppc/PpcWizardLayout';
import { ppcT } from '../../../features/ppc/ppcStrings';
import ppcAutomationService from '../../../services/ppc/automationService';
import type { WeightData, WeightMeasurement } from '../../../services/ppc/automationTypes';

const PpcWeightCalibrationPage: React.FC = () => {
  const [loadingUnitId, setLoadingUnitId] = useState('');
  const [netWeight, setNetWeight] = useState('0.0');
  const [grossWeight, setGrossWeight] = useState('0.0');
  const [trayWeight, setTrayWeight] = useState('0.0');
  const [tolerance, setTolerance] = useState('0');
  const [weightMeasurement, setWeightMeasurement] = useState<WeightMeasurement | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const data = await ppcAutomationService.getVerticalWeightMeasurement();
        if (isMounted) {
          setWeightMeasurement(data);
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

  const tableRows = useMemo(() => {
    const rows = weightMeasurement?.WeightData ?? [];
    if (rows.length === 0) {
      return [];
    }
    return rows;
  }, [weightMeasurement]);

  const handleCallUnit = async () => {
    const id = Number(loadingUnitId);
    if (!Number.isFinite(id)) {
      return;
    }
    await ppcAutomationService.moveLoadingUnitToBay(id);
  };

  const handleRetry = async () => {
    try {
      setIsBusy(true);
      const data = await ppcAutomationService.getVerticalWeightMeasurement();
      setWeightMeasurement(data);
    } finally {
      setIsBusy(false);
    }
  };

  const handleSave = async () => {
    const measureConst0 = weightMeasurement?.MeasureConst0 ?? 0;
    const measureConst1 = weightMeasurement?.MeasureConst1 ?? 0;
    const measureConst2 = weightMeasurement?.MeasureConst2 ?? 0;
    const weightData = (weightMeasurement?.WeightData ?? []) as WeightData[];
    try {
      setIsBusy(true);
      await ppcAutomationService.updateWeightMeasurement({
        measureConst0,
        measureConst1,
        measureConst2,
        weightData,
      });
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <PpcWizardLayout
      code="4.2.7"
      title={ppcT('InstallationApp.WeightCalibration', 'Weight calibration')}
      description={ppcT('InstallationApp.WeightCalibrationDescription', '')}
      steps={[
        { label: '1', active: true },
        { label: '2' },
        { label: '3' },
        { label: '4' },
        { label: '5' },
      ]}
      sideCards={[
        { title: ppcT('SensorCard.AxisHorizontal', 'Axis horizontal') },
        { title: ppcT('SensorCard.AxisVertical', 'Axis vertical') },
        { title: ppcT('SensorCard.Shutter', 'Shutter') },
        { title: ppcT('SensorCard.Position', 'Position') },
      ]}
    >
      <div className="ppc-wizard__panel-title">
        {ppcT('InstallationApp.BeforeStart', 'Before start')}
      </div>
      <div className="ppc-error-wizard__description">
        {ppcT('InstallationApp.WeightCalibrationDescriptionProcedure', '')}
      </div>

      <div className="ppc-form-row">
        <PpcFormField label={ppcT('InstallationApp.DrawerNumber', 'Drawer number')} value={loadingUnitId} onChange={setLoadingUnitId} />
        <PpcActionButton label={ppcT('InstallationApp.CallUnit', 'Call unit')} onClick={handleCallUnit} />
      </div>

      <div className="ppc-table">
        <div className="ppc-table__row ppc-table__header">
          <span>{ppcT('InstallationApp.Step', 'Step')}</span>
          <span>{ppcT('InstallationApp.MeasuredWeight', 'Measured weight (kg)')}</span>
          <span>{ppcT('InstallationApp.AbsorbedCurrent', 'Absorbed current')}</span>
          <span>{ppcT('InstallationApp.Tare', 'Tare')}</span>
        </div>
        {tableRows.length === 0 ? (
          <div className="ppc-table__row">
            <span>--</span>
            <span>0.0</span>
            <span>0.0</span>
            <span>0.0</span>
          </div>
        ) : (
          tableRows.map((row, index) => (
            <div key={`weight-row-${index}`} className="ppc-table__row">
              <span>{index + 1}</span>
              <span>{row.Weight?.toFixed(2) ?? '0.0'}</span>
              <span>{row.Current?.toFixed(2) ?? '0.0'}</span>
              <span>{row.Tare?.toFixed(2) ?? '0.0'}</span>
            </div>
          ))
        )}
      </div>

      <div className="ppc-form-grid">
        <PpcFormField label={ppcT('InstallationApp.NetWeight', 'Net weight (kg)')} value={netWeight} onChange={setNetWeight} />
        <PpcFormField label={ppcT('InstallationApp.GrossWeight', 'Gross weight (kg)')} value={grossWeight} onChange={setGrossWeight} />
        <PpcFormField label={ppcT('InstallationApp.TrayWeight', 'Tray weight (kg)')} value={trayWeight} onChange={setTrayWeight} />
        <PpcFormField
          label={ppcT('InstallationApp.AcceptableWeightTolerance', 'Required tolerance (%)')}
          value={tolerance}
          onChange={setTolerance}
        />
      </div>

      <div className="ppc-form-actions">
        <PpcActionButton label={ppcT('InstallationApp.RetryProcedure', 'Retry procedure')} onClick={handleRetry} disabled={isBusy} />
        <PpcActionButton label={ppcT('InstallationApp.Save', 'Save')} onClick={handleSave} disabled={isBusy} />
      </div>
    </PpcWizardLayout>
  );
};

export default PpcWeightCalibrationPage;
