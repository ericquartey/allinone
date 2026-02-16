import React, { useEffect, useState } from 'react';
import PpcActionButton from '../../../components/ppc/PpcActionButton';
import PpcFormField from '../../../components/ppc/PpcFormField';
import PpcWizardLayout from '../../../components/ppc/PpcWizardLayout';
import { ppcT } from '../../../features/ppc/ppcStrings';
import ppcAutomationService from '../../../services/ppc/automationService';
import type { RepeatedTestProcedure } from '../../../services/ppc/automationTypes';

const PpcCarouselCalibrationPage: React.FC = () => {
  const [params, setParams] = useState<RepeatedTestProcedure | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const data = await ppcAutomationService.getCarouselParameters();
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

  const handleCalibration = async () => {
    await ppcAutomationService.tuneCarousel();
  };

  const handleStart = async () => {
    await ppcAutomationService.startCarouselCalibration();
  };

  const handleStop = async () => {
    await ppcAutomationService.stopCarouselCalibration();
  };

  return (
    <PpcWizardLayout
      code="4.3.3"
      title={ppcT('InstallationApp.CarouselCalibration', 'Carousel calibration')}
      description={ppcT('HelpDescriptions.CarouselCalibrationFunctionDescription', '')}
      steps={[
        { label: '1', active: true },
        { label: '2' },
        { label: '3' },
      ]}
      sideCards={[
        { title: ppcT('SensorCard.Bay', 'Bay') },
        {
          title: ppcT('InstallationApp.CurrentResolution', 'Current resolution'),
          lines: [params?.PerformedCycles != null ? String(params.PerformedCycles) : '--'],
        },
        {
          title: ppcT('InstallationApp.Interaxle', 'Interaxle'),
          lines: [params?.TotalCycles != null ? String(params.TotalCycles) : '--'],
        },
      ]}
    >
      <div className="ppc-wizard__panel-title">
        {ppcT('InstallationApp.BeforeStart', 'Before start')}
      </div>
      <div className="ppc-error-wizard__description">
        {ppcT('InstallationApp.CalibrationProcedureRequired', 'Calibration procedure required')}
      </div>
      <div className="ppc-form-row">
        <PpcActionButton label={ppcT('InstallationApp.BayCalibration', 'Bay calibration')} onClick={handleCalibration} />
        <PpcActionButton label={ppcT('InstallationApp.Start', 'Start')} onClick={handleStart} />
      </div>
      <div className="ppc-form-grid">
        <PpcFormField label={ppcT('InstallationApp.RemainingTime', 'Remaining time')} value="00:00" />
      </div>
      <div className="ppc-form-actions">
        <PpcActionButton label={ppcT('InstallationApp.StopProcedure', 'Stop procedure')} onClick={handleStop} />
      </div>
    </PpcWizardLayout>
  );
};

export default PpcCarouselCalibrationPage;
