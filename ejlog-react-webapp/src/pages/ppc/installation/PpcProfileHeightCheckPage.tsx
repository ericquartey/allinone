import React, { useEffect, useMemo, useState } from 'react';
import PpcActionButton from '../../../components/ppc/PpcActionButton';
import PpcFormField from '../../../components/ppc/PpcFormField';
import PpcWizardLayout from '../../../components/ppc/PpcWizardLayout';
import { ppcT } from '../../../features/ppc/ppcStrings';
import { useGetBayQuery } from '../../../services/api/ppcAutomationApi';
import ppcAutomationService from '../../../services/ppc/automationService';
import { PPC_BAY_NUMBER } from '../../../config/api';
import type { BayProfileCheckProcedure } from '../../../services/ppc/automationTypes';

const PpcProfileHeightCheckPage: React.FC = () => {
  const [profile, setProfile] = useState<BayProfileCheckProcedure | null>(null);
  const [calibrationResult, setCalibrationResult] = useState('');
  const [cellCorrection, setCellCorrection] = useState('');

  const bayQuery = useGetBayQuery(PPC_BAY_NUMBER, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const bayPositionId = useMemo(() => {
    const positions = bayQuery.data?.Positions ?? [];
    return positions.find((pos) => !pos.IsUpper)?.Id ?? positions[0]?.Id ?? null;
  }, [bayQuery.data]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const data = await ppcAutomationService.getProfileParameters();
        if (isMounted) {
          setProfile(data);
          if (data.Sample != null) {
            setCalibrationResult(String(data.Sample));
          }
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

  const handleStartCalibration = async () => {
    if (!bayPositionId) {
      return;
    }
    await ppcAutomationService.startProfileCalibration(bayPositionId);
  };

  const handleRepeatCalibration = async () => {
    if (!bayPositionId) {
      return;
    }
    await ppcAutomationService.startProfileCalibration(bayPositionId);
  };

  return (
    <PpcWizardLayout
      code="4.5.1"
      title={ppcT('InstallationApp.ProfileHeighCheckDescription', 'Profile height check')}
      description={ppcT('InstallationApp.ProfileCalibrationDescription', '')}
      steps={[
        { label: '1', active: true },
        { label: '2' },
        { label: '3' },
      ]}
      sideCards={[
        {
          title: ppcT('InstallationApp.ProfileConst', 'Profile constants'),
          lines: [
            `K0: ${profile?.ProfileConst0 != null ? profile.ProfileConst0.toFixed(2) : '--'}`,
            `K1: ${profile?.ProfileConst1 != null ? profile.ProfileConst1.toFixed(2) : '--'}`,
          ],
        },
        { title: ppcT('InstallationApp.ProfileSample', 'Sample'), lines: [
          profile?.Sample != null ? profile.Sample.toFixed(2) : '--',
        ] },
      ]}
    >
      <div className="ppc-wizard__panel-title">
        {ppcT('InstallationApp.ProfileHeighCheckDescription', 'Profile height check')}
      </div>
      <div className="ppc-error-wizard__description">
        {ppcT('InstallationApp.ProfileHeighCheckProcedureDescription', '')}
      </div>
      <div className="ppc-error-wizard__description">
        {ppcT('InstallationApp.ProfileHeightCheckProcedureLeftUnitDescription', '')}
      </div>
      <div className="ppc-form-grid">
        <PpcFormField
          label={ppcT('InstallationApp.CalibrationResult', 'Calibration result')}
          value={calibrationResult}
          onChange={setCalibrationResult}
        />
        <PpcFormField
          label={ppcT('InstallationApp.CellCorrection', 'Cell correction (mm)')}
          value={cellCorrection}
          onChange={setCellCorrection}
        />
      </div>
      <div className="ppc-form-actions">
        <PpcActionButton label={ppcT('InstallationApp.StartCalibrationButton', 'Start calibration')} onClick={handleStartCalibration} />
        <PpcActionButton label={ppcT('InstallationApp.RepeteCalibration', 'Repeat calibration')} onClick={handleRepeatCalibration} />
      </div>
    </PpcWizardLayout>
  );
};

export default PpcProfileHeightCheckPage;
