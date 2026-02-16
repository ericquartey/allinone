import React, { useEffect, useState } from 'react';
import PpcActionButton from '../../../components/ppc/PpcActionButton';
import PpcCheckboxField from '../../../components/ppc/PpcCheckboxField';
import PpcFormField from '../../../components/ppc/PpcFormField';
import { ppcT } from '../../../features/ppc/ppcStrings';
import usePpcAccessories from '../../../hooks/usePpcAccessories';
import ppcAutomationService from '../../../services/ppc/automationService';

const PpcLabelPrinterSettingsPage: React.FC = () => {
  const { accessories, refresh } = usePpcAccessories();
  const [isEnabled, setIsEnabled] = useState(false);
  const [printerName, setPrinterName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    const printer = accessories?.LabelPrinter;
    if (!printer) {
      return;
    }
    setIsEnabled(Boolean(printer.IsEnabledNew));
    setPrinterName(printer.Name || '');
  }, [accessories]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await ppcAutomationService.updateLabelPrinterSettings({
        isEnabled,
        printerName,
      });
      await refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setIsTesting(true);
      await ppcAutomationService.printLabelTestPage();
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="ppc-page">
      <div className="ppc-accessories">
        <div className="ppc-accessories__title">
          {ppcT('Menu.AccessoriesLabelPrinterMenuTitle', 'Label printer')}
        </div>

        <PpcCheckboxField
          label={ppcT('InstallationApp.AccessoryEnabled', 'Accessory enabled')}
          checked={isEnabled}
          onChange={setIsEnabled}
        />

        <PpcFormField
          label={ppcT('InstallationApp.PrinterName', 'Printer name')}
          value={printerName}
          onChange={setPrinterName}
        />

        <div className="ppc-form-actions ppc-form-actions--end">
          <PpcActionButton
            label={ppcT('General.PrinterTest', 'Printer test')}
            onClick={handleTest}
            disabled={isTesting || !printerName}
          />
          <PpcActionButton
            label={ppcT('General.Save', 'Save')}
            onClick={handleSave}
            disabled={isSaving}
          />
        </div>
      </div>
    </div>
  );
};

export default PpcLabelPrinterSettingsPage;
