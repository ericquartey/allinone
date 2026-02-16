import React, { useEffect, useState } from 'react';
import PpcActionButton from '../../../components/ppc/PpcActionButton';
import PpcSensorControl from '../../../components/ppc/PpcSensorControl';
import PpcWizardLayout from '../../../components/ppc/PpcWizardLayout';
import { ppcT } from '../../../features/ppc/ppcStrings';
import ppcAutomationService from '../../../services/ppc/automationService';

const PpcSensitiveAlarmPage: React.FC = () => {
  const [sensitiveEdgeEnabled, setSensitiveEdgeEnabled] = useState(false);
  const [sensitiveCarpetEnabled, setSensitiveCarpetEnabled] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [edge, carpet] = await Promise.all([
          ppcAutomationService.getSensitiveEdgeAlarmEnable(),
          ppcAutomationService.getSensitiveCarpetsAlarmEnable(),
        ]);
        setSensitiveEdgeEnabled(Boolean(edge));
        setSensitiveCarpetEnabled(Boolean(carpet));
      } catch (error) {
        console.error('Unable to load sensitive alarm status', error);
      }
    };
    load();
  }, []);

  const toggleSensitiveEdge = async () => {
    try {
      setIsBusy(true);
      const nextValue = !sensitiveEdgeEnabled;
      await ppcAutomationService.setSensitiveEdgeBypass(nextValue);
      setSensitiveEdgeEnabled(nextValue);
    } finally {
      setIsBusy(false);
    }
  };

  const toggleSensitiveCarpet = async () => {
    try {
      setIsBusy(true);
      const nextValue = !sensitiveCarpetEnabled;
      await ppcAutomationService.setSensitiveCarpetsBypass(nextValue);
      setSensitiveCarpetEnabled(nextValue);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <PpcWizardLayout
      code="4.3.6"
      title={ppcT('InstallationApp.SensitiveAlarm', 'Sensitive alarm')}
      description={ppcT('InstallationApp.SensitiveAlarmDescription', '')}
      steps={[
        { label: '1', active: true },
        { label: '2' },
      ]}
      sideCards={[
        { title: ppcT('SensorCard.Bay', 'Bay') },
        { title: ppcT('SensorCard.Shutter', 'Shutter') },
      ]}
    >
      <div className="ppc-wizard__panel-title">
        {ppcT('InstallationApp.SensitiveAlarm', 'Sensitive alarm')}
      </div>
      <div className="ppc-error-wizard__description">
        {ppcT('InstallationApp.SensitiveAlarmDescription', '')}
      </div>
      <div className="ppc-panel">
        <div className="ppc-panel__title">{ppcT('InstallationApp.ExclusionSensitiveEdge', 'Sensitive edge exclusion')}</div>
        <div className="ppc-form-row">
          <PpcSensorControl
            label={ppcT('InstallationApp.SensitiveEdgeAlarm', 'Sensitive edge alarm')}
            active={sensitiveEdgeEnabled}
          />
          <PpcActionButton
            label={
              sensitiveEdgeEnabled
                ? ppcT('InstallationApp.AccessoryEnabled', 'Accessory enabled')
                : ppcT('General.WmsDisabled', 'Disabled')
            }
            onClick={toggleSensitiveEdge}
            disabled={isBusy}
          />
        </div>
      </div>
      <div className="ppc-panel">
        <div className="ppc-panel__title">{ppcT('InstallationApp.ExclusionSensitiveCarpet', 'Sensitive carpet exclusion')}</div>
        <div className="ppc-form-row">
          <PpcSensorControl
            label={ppcT('InstallationApp.SensitiveCarpetsAlarm', 'Sensitive carpets alarm')}
            active={sensitiveCarpetEnabled}
          />
          <PpcActionButton
            label={
              sensitiveCarpetEnabled
                ? ppcT('InstallationApp.AccessoryEnabled', 'Accessory enabled')
                : ppcT('General.WmsDisabled', 'Disabled')
            }
            onClick={toggleSensitiveCarpet}
            disabled={isBusy}
          />
        </div>
      </div>
    </PpcWizardLayout>
  );
};

export default PpcSensitiveAlarmPage;
