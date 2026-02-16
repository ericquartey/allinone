import React, { useEffect, useMemo, useState } from 'react';
import PpcActionButton from '../../../components/ppc/PpcActionButton';
import PpcFormField from '../../../components/ppc/PpcFormField';
import PpcWizardLayout from '../../../components/ppc/PpcWizardLayout';
import { ppcT } from '../../../features/ppc/ppcStrings';
import { useGetBayQuery } from '../../../services/api/ppcAutomationApi';
import ppcAutomationService from '../../../services/ppc/automationService';
import { PPC_BAY_NUMBER } from '../../../config/api';
import type { BayProfileCheckProcedure } from '../../../services/ppc/automationTypes';

const PpcProfileResolutionCalibrationPage: React.FC = () => {
  const [profile, setProfile] = useState<BayProfileCheckProcedure | null>(null);
  const [k0, setK0] = useState('');
  const [k1, setK1] = useState('');
  const [sample, setSample] = useState('');
  const [newResolution, setNewResolution] = useState('');

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
        if (!isMounted) {
          return;
        }
        setProfile(data);
        if (data.ProfileConst0 != null) setK0(String(data.ProfileConst0));
        if (data.ProfileConst1 != null) setK1(String(data.ProfileConst1));
        if (data.Sample != null) setSample(String(data.Sample));
      } catch {
        // Ignore fetch errors for now.
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleStart = async () => {
    if (!bayPositionId) {
      return;
    }
    const k0Value = Number(k0);
    const k1Value = Number(k1);
    if (Number.isFinite(k0Value) && Number.isFinite(k1Value)) {
      await ppcAutomationService.updateBayProfileConstants(k0Value, k1Value);
    }
    await ppcAutomationService.startProfileResolution(bayPositionId);
    await ppcAutomationService.saveProfile();
  };

  const handleRepeat = async () => {
    if (!bayPositionId) {
      return;
    }
    await ppcAutomationService.startProfileResolution(bayPositionId);
  };

  return (
    <PpcWizardLayout
      code="4.5.2"
      title={ppcT('InstallationApp.ProfileResolutionCalibration', 'Profile resolution calibration')}
      description={ppcT('InstallationApp.ProfileResolutionCalibrationHelp', '')}
      steps={[
        { label: '1', active: true },
        { label: '2' },
        { label: '3' },
      ]}
      sideCards={[
        { title: ppcT('InstallationApp.ProfileSamples', 'Samples') },
        { title: ppcT('InstallationApp.ProfileConst', 'Profile constants') },
      ]}
    >
      <div className="ppc-wizard__panel-title">
        {ppcT('InstallationApp.ProfileResolutionCalibration', 'Profile resolution calibration')}
      </div>
      <div className="ppc-error-wizard__description">
        {ppcT('InstallationApp.ProfileResolutionCalibrationHelp', '')}
      </div>
      <div className="ppc-form-grid">
        <PpcFormField
          label={ppcT('InstallationApp.ProfileConst0', 'K0 constant')}
          value={k0}
          onChange={setK0}
        />
        <PpcFormField
          label={ppcT('InstallationApp.ProfileConst1', 'K1 constant')}
          value={k1}
          onChange={setK1}
        />
        <PpcFormField
          label={ppcT('InstallationApp.ProfileSample', 'Sample')}
          value={sample}
          onChange={setSample}
        />
        <PpcFormField
          label={ppcT('InstallationApp.VerticalResolutionCalibrationNewResolution', 'New resolution')}
          value={newResolution}
          onChange={setNewResolution}
        />
      </div>
      <div className="ppc-form-actions">
        <PpcActionButton label={ppcT('InstallationApp.Start', 'Start')} onClick={handleStart} />
        <PpcActionButton label={ppcT('InstallationApp.RepeteCalibration', 'Repeat calibration')} onClick={handleRepeat} />
      </div>
    </PpcWizardLayout>
  );
};

export default PpcProfileResolutionCalibrationPage;
