import React, { useEffect, useState } from 'react';
import PpcActionButton from '../../../components/ppc/PpcActionButton';
import PpcFormField from '../../../components/ppc/PpcFormField';
import { ppcT } from '../../../features/ppc/ppcStrings';
import ppcAutomationService from '../../../services/ppc/automationService';
import { formatIpAddress } from '../../../services/ppc/automationUtils';

interface BayIpSettings {
  remoteIO: string;
  alphanumericBar: string;
  laser: string;
  weightingScale: string;
}

const PpcIpManagerPage: React.FC = () => {
  const [bay1, setBay1] = useState<BayIpSettings>({
    remoteIO: '',
    alphanumericBar: '',
    laser: '',
    weightingScale: '',
  });

  const [bay2, setBay2] = useState<BayIpSettings>({
    remoteIO: '',
    alphanumericBar: '',
    laser: '',
    weightingScale: '',
  });

  const [bay3, setBay3] = useState<BayIpSettings>({
    remoteIO: '',
    alphanumericBar: '',
    laser: '',
    weightingScale: '',
  });

  const [machineInverter, setMachineInverter] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Load initial data from automation service
  useEffect(() => {
    const loadIpSettings = async () => {
      try {
        const settings = await ppcAutomationService.getIpManagerSettings();
        if (settings) {
          if (settings.bay1) {
            setBay1({
              remoteIO: formatIpAddress(settings.bay1.remoteIO) || '',
              alphanumericBar: formatIpAddress(settings.bay1.alphanumericBar) || '',
              laser: formatIpAddress(settings.bay1.laser) || '',
              weightingScale: formatIpAddress(settings.bay1.weightingScale) || '',
            });
          }
          if (settings.bay2) {
            setBay2({
              remoteIO: formatIpAddress(settings.bay2.remoteIO) || '',
              alphanumericBar: formatIpAddress(settings.bay2.alphanumericBar) || '',
              laser: formatIpAddress(settings.bay2.laser) || '',
              weightingScale: formatIpAddress(settings.bay2.weightingScale) || '',
            });
          }
          if (settings.bay3) {
            setBay3({
              remoteIO: formatIpAddress(settings.bay3.remoteIO) || '',
              alphanumericBar: formatIpAddress(settings.bay3.alphanumericBar) || '',
              laser: formatIpAddress(settings.bay3.laser) || '',
              weightingScale: formatIpAddress(settings.bay3.weightingScale) || '',
            });
          }
          if (settings.machineInverter) {
            setMachineInverter(formatIpAddress(settings.machineInverter) || '');
          }
        }
      } catch (error) {
        console.error('[PpcIpManager] Error loading IP settings:', error);
      }
    };

    loadIpSettings();
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await ppcAutomationService.updateIpManagerSettings({
        bay1,
        bay2,
        bay3,
        machineInverter,
      });
      // Show success feedback
      console.log('[PpcIpManager] Settings saved successfully');
    } catch (error) {
      console.error('[PpcIpManager] Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderBaySection = (
    bayNumber: number,
    baySettings: BayIpSettings,
    setBaySettings: React.Dispatch<React.SetStateAction<BayIpSettings>>
  ) => {
    // Check if bay has any IP configured to determine visibility
    const isVisible = Object.values(baySettings).some(ip => ip !== '');

    if (!isVisible) {
      return null;
    }

    return (
      <div key={`bay${bayNumber}`} className="ppc-ip-manager__bay">
        <div className="ppc-ip-manager__bay-title">
          {ppcT(`InstallationApp.Bay${bayNumber}`, `Bay ${bayNumber}`)}
        </div>

        <PpcFormField
          label={ppcT('InstallationApp.Bay1RemoteIO', `Bay ${bayNumber} - Remote IO`)}
          value={baySettings.remoteIO}
          onChange={(value) => setBaySettings({ ...baySettings, remoteIO: value })}
          placeholder="192.168.1.100"
        />

        <PpcFormField
          label={ppcT('InstallationApp.Bay1AlphanumericBar', `Bay ${bayNumber} - Barra Alfanumerica`)}
          value={baySettings.alphanumericBar}
          onChange={(value) => setBaySettings({ ...baySettings, alphanumericBar: value })}
          placeholder="192.168.1.101"
        />

        <PpcFormField
          label={ppcT('InstallationApp.Bay1Laser', `Bay ${bayNumber} - Laser`)}
          value={baySettings.laser}
          onChange={(value) => setBaySettings({ ...baySettings, laser: value })}
          placeholder="192.168.1.102"
        />

        <PpcFormField
          label={ppcT('InstallationApp.Bay1WeightingScale', `Bay ${bayNumber} - Bilancia contapezzi`)}
          value={baySettings.weightingScale}
          onChange={(value) => setBaySettings({ ...baySettings, weightingScale: value })}
          placeholder="192.168.1.103"
        />
      </div>
    );
  };

  return (
    <div className="ppc-page">
      <div className="ppc-ip-manager">
        <div className="ppc-ip-manager__title">
          {ppcT('InstallationApp.IpManager', 'Ip Manager')}
        </div>

        <div className="ppc-ip-manager__content">
          <div className="ppc-ip-manager__bays">
            {renderBaySection(1, bay1, setBay1)}
            {renderBaySection(2, bay2, setBay2)}
            {renderBaySection(3, bay3, setBay3)}
          </div>

          <div className="ppc-ip-manager__inverter">
            <div className="ppc-ip-manager__section-title">
              {ppcT('InstallationApp.Inverter', 'Inverter')}
            </div>

            <PpcFormField
              label={ppcT('InstallationApp.MachineInverter', 'Machine Inverter')}
              value={machineInverter}
              onChange={setMachineInverter}
              placeholder="192.168.1.200"
            />
          </div>
        </div>

        <div className="ppc-form-actions ppc-form-actions--end">
          <PpcActionButton
            label={ppcT('InstallationApp.Save', 'Save')}
            onClick={handleSave}
            disabled={isSaving}
          />
        </div>
      </div>
    </div>
  );
};

export default PpcIpManagerPage;
