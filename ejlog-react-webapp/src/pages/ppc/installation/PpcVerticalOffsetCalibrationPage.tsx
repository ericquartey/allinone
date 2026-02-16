import React, { useEffect, useMemo, useState } from 'react';
import PpcActionButton from '../../../components/ppc/PpcActionButton';
import PpcFormField from '../../../components/ppc/PpcFormField';
import PpcSelectField from '../../../components/ppc/PpcSelectField';
import PpcWizardLayout from '../../../components/ppc/PpcWizardLayout';
import { ppcT } from '../../../features/ppc/ppcStrings';
import ppcAutomationService from '../../../services/ppc/automationService';
import { WarehouseSide, type OffsetCalibrationProcedure } from '../../../services/ppc/automationTypes';

const PpcVerticalOffsetCalibrationPage: React.FC = () => {
  const sideOptions = useMemo(
    () => [
      { label: ppcT('General.WarehouseSide_Front', 'Front'), value: String(WarehouseSide.Front) },
      { label: ppcT('General.WarehouseSide_Back', 'Back'), value: String(WarehouseSide.Back) },
    ],
    []
  );

  const [params, setParams] = useState<OffsetCalibrationProcedure | null>(null);
  const [currentOffset, setCurrentOffset] = useState<number | null>(null);
  const [selectedCell, setSelectedCell] = useState('');
  const [initialPosition, setInitialPosition] = useState('');
  const [displacement, setDisplacement] = useState('');
  const [stepValue, setStepValue] = useState('');
  const [selectedSide, setSelectedSide] = useState(String(WarehouseSide.Front));
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [procedure, offset] = await Promise.all([
          ppcAutomationService.getVerticalOffsetParameters(),
          ppcAutomationService.getVerticalOffset(),
        ]);
        if (!isMounted) {
          return;
        }
        setParams(procedure);
        setCurrentOffset(offset);
        if (procedure.ReferenceCellId != null) {
          setSelectedCell(String(procedure.ReferenceCellId));
        }
        if (procedure.Step != null) {
          setStepValue(String(procedure.Step));
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

  const handleMoveToPosition = async () => {
    const position = Number(initialPosition);
    if (!Number.isFinite(position)) {
      return;
    }
    await ppcAutomationService.moveElevatorToHeight(position, false);
  };

  const handleMoveElevator = async () => {
    const displacementValue = Number(displacement);
    if (!Number.isFinite(displacementValue)) {
      return;
    }
    if (displacementValue >= 0) {
      await ppcAutomationService.moveVerticalOffsetUp();
    } else {
      await ppcAutomationService.moveVerticalOffsetDown();
    }
  };

  const handleNext = async () => {
    await ppcAutomationService.moveVerticalOffsetDown();
  };

  const handleSave = async () => {
    const newOffset = Number(displacement);
    if (!Number.isFinite(newOffset)) {
      return;
    }
    try {
      setIsBusy(true);
      await ppcAutomationService.updateVerticalOffset(newOffset);
      const offset = await ppcAutomationService.getVerticalOffset();
      setCurrentOffset(offset);
    } finally {
      setIsBusy(false);
    }
  };

  const handleStart = async () => {
    const newOffset = Number(displacement);
    if (!Number.isFinite(newOffset)) {
      return;
    }
    try {
      setIsBusy(true);
      await ppcAutomationService.updateVerticalOffsetAndComplete(newOffset);
      const offset = await ppcAutomationService.getVerticalOffset();
      setCurrentOffset(offset);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <PpcWizardLayout
      code="4.2.4"
      title={ppcT('InstallationApp.VerticalOffsetCalibration', 'Vertical offset calibration')}
      description={ppcT('HelpDescriptions.HelpVOCDescription', '')}
      steps={[
        { label: '1', active: true },
        { label: '2' },
        { label: '3' },
      ]}
      sideCards={[
        { title: ppcT('SensorCard.AxisVertical', 'Axis vertical') },
        { title: ppcT('SensorCard.AxisHorizontal', 'Axis horizontal') },
        { title: ppcT('SensorCard.Drawer', 'Drawer') },
        {
          title: ppcT('InstallationApp.CurrentOffset', 'Current offset'),
          lines: [currentOffset != null ? currentOffset.toFixed(2) : '--'],
        },
      ]}
    >
      <div className="ppc-wizard__panel-title">
        {ppcT('InstallationApp.ExecuteCellMeasurement', 'Execute cell measurement')}
      </div>
      <div className="ppc-error-wizard__description">
        {ppcT('InstallationApp.ExecuteElevatorCellPositioning', '')}
      </div>
      <div className="ppc-form-grid">
        <PpcFormField
          label={ppcT('InstallationApp.SelectedCell', 'Selected cell')}
          value={selectedCell}
          onChange={setSelectedCell}
        />
        <PpcFormField
          label={ppcT('InstallationApp.InitialPosition', 'Initial position')}
          value={initialPosition}
          onChange={setInitialPosition}
        />
        <PpcSelectField
          label={ppcT('InstallationApp.CellSide', 'Cell side')}
          options={sideOptions}
          value={selectedSide}
          onChange={setSelectedSide}
        />
        <PpcFormField
          label={ppcT('InstallationApp.Displacement', 'Displacement')}
          value={displacement}
          onChange={setDisplacement}
        />
      </div>
      <div className="ppc-form-row">
        <PpcActionButton
          label={ppcT('InstallationApp.MoveToQuote', 'Move to quote')}
          onClick={handleMoveToPosition}
        />
        <PpcActionButton
          label={ppcT('InstallationApp.MoveElevator', 'Move elevator')}
          onClick={handleMoveElevator}
        />
      </div>
      <div className="ppc-form-row">
        <PpcFormField
          label={ppcT('InstallationApp.StepValue', 'Step value')}
          value={stepValue}
          onChange={setStepValue}
        />
        <PpcActionButton label={ppcT('InstallationApp.NextLarge', 'Next')} onClick={handleNext} />
      </div>
      <div className="ppc-form-actions">
        <PpcActionButton label={ppcT('General.Save', 'Save')} onClick={handleSave} disabled={isBusy} />
        <PpcActionButton label={ppcT('InstallationApp.Start', 'Start')} onClick={handleStart} disabled={isBusy} />
      </div>
    </PpcWizardLayout>
  );
};

export default PpcVerticalOffsetCalibrationPage;
