import React from 'react';
import PpcInstallationNavMenu from '../../../components/ppc/PpcInstallationNavMenu';
import PpcInstallationNavFooter from '../../../components/ppc/PpcInstallationNavFooter';
import PpcMenuCard from '../../../components/ppc/PpcMenuCard';
import { ppcT } from '../../../features/ppc/ppcStrings';

const PpcAccessoriesMenuPage: React.FC = () => {
  return (
    <div className="ppc-installation-layout">
      <div className="ppc-installation-layout__nav">
        <PpcInstallationNavMenu activeKey="accessories" />
      </div>

      <div className="ppc-installation-layout__content">
        <div className="ppc-installation-layout__title">
          {ppcT('Menu.AccessoriesMenuName', 'Accessories')}
        </div>

        <div className="ppc-menu-card-grid">
          <PpcMenuCard
            title={ppcT('Menu.AccessoriesAlphaNumBarMenuTitle', 'Alphanumeric bar')}
            abbreviation="4.6.1"
            description={ppcT('Menu.AccessoriesAlphaNumBarMenuDescription', '')}
          />
          <PpcMenuCard
            title={ppcT('Menu.AccessoriesBarcodeReaderMenuTitle', 'Barcode reader')}
            abbreviation="4.6.2"
            description={ppcT('Menu.AccessoriesBarcodeReaderMenuDescription', '')}
          />
          <PpcMenuCard
            title={ppcT('Menu.AccessoriesCardReaderMenuTitle', 'Card reader')}
            abbreviation="4.6.3"
            description={ppcT('Menu.AccessoriesCardReaderMenuDescription', '')}
          />
          <PpcMenuCard
            title={ppcT('Menu.AccessoriesLabelPrinterMenuTitle', 'Label printer')}
            abbreviation="4.6.4"
            description={ppcT('Menu.AccessoriesLabelPrinterMenuDescription', '')}
          />
          <PpcMenuCard
            title={ppcT('Menu.AccessoriesLaserPointerMenuTitle', 'Laser pointer')}
            abbreviation="4.6.5"
            description={ppcT('Menu.AccessoriesLaserPointerMenuDescription', '')}
          />
          <PpcMenuCard
            title={ppcT('Menu.AccessoriesTokenReaderMenuTitle', 'Token reader')}
            abbreviation="4.6.6"
            description={ppcT('Menu.AccessoriesTokenReaderMenuDescription', '')}
          />
          <PpcMenuCard
            title={ppcT('Menu.AccessoriesWeightingScaleMenuTitle', 'Weighting scale')}
            abbreviation="4.6.7"
            description={ppcT('Menu.AccessoriesWeightingScaleMenuDescription', '')}
          />
        </div>

        <div className="ppc-installation-layout__footer">
          <PpcInstallationNavFooter />
        </div>
      </div>
    </div>
  );
};

export default PpcAccessoriesMenuPage;
