import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb } from 'lucide-react';
import { ppcT } from '../../features/ppc/ppcStrings';

type PpcInstallationNavFooterProps = {
  onConfirm?: () => void;
  onMovements?: () => void;
  onSensors?: () => void;
  confirmVisible?: boolean;
  confirmDisabled?: boolean;
};

const PpcInstallationNavFooter: React.FC<PpcInstallationNavFooterProps> = ({
  onConfirm,
  onMovements,
  onSensors,
  confirmVisible = false,
  confirmDisabled = false,
}) => {
  const navigate = useNavigate();
  const handleMovements = onMovements ?? (() => navigate('/ppc/installation/movements'));
  const handleSensors = onSensors ?? (() => navigate('/ppc/installation/other-sensors'));

  return (
    <div className="ppc-installation-footer">
      {confirmVisible && (
        <button
          type="button"
          className="ppc-installation-footer__button"
          onClick={onConfirm}
          disabled={confirmDisabled}
        >
          {ppcT('Menu.ConfirmTest', 'Confirm')}
        </button>
      )}
      <button type="button" className="ppc-installation-footer__button" onClick={handleMovements}>
        {ppcT('Menu.Movements', 'Movements')}
      </button>
      <button type="button" className="ppc-installation-footer__icon" onClick={handleSensors}>
        <Lightbulb size={20} />
      </button>
    </div>
  );
};

export default PpcInstallationNavFooter;
