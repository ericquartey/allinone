import React, { useMemo, useState } from 'react';
import PpcSelectField from '../../../components/ppc/PpcSelectField';
import { ppcT } from '../../../features/ppc/ppcStrings';
import datalogicPBT9100Usb from '../../../assets/ppc/barcode/datalogicPBT9100_usb_com_emulation.png';
import datalogicPBT9501Usb from '../../../assets/ppc/barcode/datalogicPBT9501_usb_com_emulation.png';
import newland1550Enter from '../../../assets/ppc/barcode/newland1550_enter_setup.png';
import newland1550Exit from '../../../assets/ppc/barcode/newland1550_exit_setup.png';
import newland1550Usb from '../../../assets/ppc/barcode/newland1550_usb_com_emulation.png';
import newland1580Energy from '../../../assets/ppc/barcode/newland1580_energy_saving.png';
import newland1580Enter from '../../../assets/ppc/barcode/newland1580_enter_setup.png';
import newland1580Exit from '../../../assets/ppc/barcode/newland1580_exit_setup.png';
import newland1580Usb from '../../../assets/ppc/barcode/newland1580_usb_com_emulation.png';
import newland3280Energy from '../../../assets/ppc/barcode/newland3280_energy_saving.png';
import newland3280Enter from '../../../assets/ppc/barcode/newland3280_enter_setup.png';
import newland3280Exit from '../../../assets/ppc/barcode/newland3280_exit_setup.png';
import newland3280Usb from '../../../assets/ppc/barcode/newland3280_usb_com_emulation.png';
import newland3290Enter from '../../../assets/ppc/barcode/newland3290_enter_setup.png';
import newland3290Exit from '../../../assets/ppc/barcode/newland3290_exit_setup.png';
import newland3290Usb from '../../../assets/ppc/barcode/newland3290_usb_com_emulation.png';
import newland3300Enter from '../../../assets/ppc/barcode/newland3300_enter_setup.png';
import newland3300Exit from '../../../assets/ppc/barcode/newland3300_exit_setup.png';
import newland3300Usb from '../../../assets/ppc/barcode/newland3300_usb_com_emulation.png';
import newland3300CEnter from '../../../assets/ppc/barcode/newland3300C_enter_setup.png';
import newland3300CExit from '../../../assets/ppc/barcode/newland3300C_exit_setup.png';
import newland3300CUsb from '../../../assets/ppc/barcode/newland3300C_usb_com_emulation.png';

const PpcBarcodeReaderConfigurationPage: React.FC = () => {
  const models = [
    { label: 'Newland 1550', value: 'newland1550' },
    { label: 'Newland 1580', value: 'newland1580' },
    { label: 'Newland 3280', value: 'newland3280' },
    { label: 'Newland 3290', value: 'newland3290' },
    { label: 'Newland 3300BH', value: 'newland3300' },
    { label: 'Newland 3300C', value: 'newland3300C' },
    { label: 'Datalogic PBT9501', value: 'datalogicPBT9501' },
    { label: 'Datalogic PBT9100', value: 'datalogicPBT9100' },
  ];

  const [selectedModel, setSelectedModel] = useState(models[0].value);
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(0);
  const ports = ['COM1', 'COM2', 'COM3', 'COM4'];

  const steps = useMemo(() => {
    const tEnter = ppcT('InstallationApp.AccessoriesBarcodeEnterSetup', 'Enter setup');
    const tEnergy = ppcT('InstallationApp.AccessoriesBarcodeEnergySaving', 'Energy saving');
    const tUsb = ppcT('InstallationApp.AccessoriesBarcodeEnableComEmulation', 'Enable COM emulation');
    const tExit = ppcT('InstallationApp.AccessoriesBarcodeExitSetup', 'Exit setup');

    switch (selectedModel) {
      case 'datalogicPBT9501':
        return [{ number: 2, title: tUsb, height: 300, image: datalogicPBT9501Usb }];
      case 'datalogicPBT9100':
        return [{ number: 2, title: tUsb, height: 300, image: datalogicPBT9100Usb }];
      case 'newland1580':
        return [
          { number: 2, title: tEnter, height: 80, image: newland1580Enter },
          { number: 3, title: tEnergy, height: 80, image: newland1580Energy },
          { number: 4, title: tUsb, height: 80, image: newland1580Usb },
          { number: 5, title: tExit, height: 80, image: newland1580Exit },
        ];
      case 'newland3280':
        return [
          { number: 2, title: tEnter, height: 80, image: newland3280Enter },
          { number: 3, title: tEnergy, height: 80, image: newland3280Energy },
          { number: 4, title: tUsb, height: 80, image: newland3280Usb },
          { number: 5, title: tExit, height: 80, image: newland3280Exit },
        ];
      case 'newland3290':
        return [
          { number: 2, title: tEnter, height: 120, image: newland3290Enter },
          { number: 3, title: tUsb, height: 120, image: newland3290Usb },
          { number: 4, title: tExit, height: 120, image: newland3290Exit },
        ];
      case 'newland3300':
        return [
          { number: 2, title: tEnter, height: 120, image: newland3300Enter },
          { number: 3, title: tUsb, height: 120, image: newland3300Usb },
          { number: 4, title: tExit, height: 120, image: newland3300Exit },
        ];
      case 'newland3300C':
        return [
          { number: 2, title: tEnter, height: 120, image: newland3300CEnter },
          { number: 3, title: tUsb, height: 120, image: newland3300CUsb },
          { number: 4, title: tExit, height: 120, image: newland3300CExit },
        ];
      default:
        return [
          { number: 2, title: tEnter, height: 120, image: newland1550Enter },
          { number: 3, title: tUsb, height: 120, image: newland1550Usb },
          { number: 4, title: tExit, height: 120, image: newland1550Exit },
        ];
    }
  }, [selectedModel]);

  const handleModelChange = (value: string) => {
    setSelectedModel(value);
    setActiveStepIndex(0);
  };

  const handleStepToggle = (index: number) => {
    setActiveStepIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="ppc-page">
      <div className="ppc-accessories">
        <div className="ppc-accessories__title">
          {ppcT('Menu.AccessoriesBarcodeReaderMenuTitle', 'Barcode reader')}
        </div>
        <div className="ppc-accessories__description">
          {ppcT('InstallationApp.AccessoriesBarcodeReaderConfigurationInstructions', '')}
        </div>

        <div className="ppc-barcode-config">
          <div className="ppc-panel">
            <div className="ppc-panel__step">1</div>
            <div className="ppc-panel__title">{ppcT('InstallationApp.SelectModel', 'Select model')}</div>
            <div className="ppc-barcode-config__models">
              {models.map((model) => (
                <label key={model.value} className="ppc-radio">
                  <input
                    type="radio"
                    name="barcodeModel"
                    checked={selectedModel === model.value}
                    onChange={() => handleModelChange(model.value)}
                  />
                  <span>{model.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="ppc-barcode-config__steps">
            {steps.map((step, index) => (
              <div key={step.number} className="ppc-barcode-step">
                <button
                  type="button"
                  className="ppc-barcode-step__badge"
                  onClick={() => handleStepToggle(index)}
                >
                  {step.number}
                </button>
                {activeStepIndex === index && (
                  <div className="ppc-barcode-step__preview">
                    <div className="ppc-barcode-step__image">
                      <img src={step.image} alt={step.title} style={{ height: step.height }} />
                    </div>
                    <div className="ppc-barcode-step__title">{step.title}</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="ppc-panel">
            <div className="ppc-panel__step">{steps.length + 2}</div>
            <div className="ppc-panel__title">{ppcT('InstallationApp.CheckSerialPorts', 'Check serial ports')}</div>
            <div className="ppc-port-list">
              {ports.map((port) => (
                <div key={port} className="ppc-port-item">{port}</div>
              ))}
            </div>
            <PpcSelectField label={ppcT('InstallationApp.SystemPorts', 'System ports')} options={ports} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PpcBarcodeReaderConfigurationPage;
