import React from 'react';
import { ChevronLeft, ChevronRight, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type PpcFooterProps = {
  notification?: string;
  severity?: 'info' | 'warning' | 'error';
};

const PpcFooter: React.FC<PpcFooterProps> = ({ notification, severity = 'info' }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  const handleForward = () => {
    navigate(1);
  };

  const handleHome = () => {
    navigate('/ppc/menu/main-menu');
  };

  return (
    <div className="ppc-footer">
      {notification && (
        <div className={`ppc-footer__notification ppc-footer__notification--${severity}`}>
          {notification}
        </div>
      )}

      <div className="ppc-footer__actions">
        <button type="button" className="ppc-footer__action" onClick={handleBack}>
          <ChevronLeft size={28} />
        </button>
        <button type="button" className="ppc-footer__action" onClick={handleForward}>
          <ChevronRight size={28} />
        </button>
        <button type="button" className="ppc-footer__action" onClick={handleHome}>
          <XCircle size={28} />
        </button>
      </div>
    </div>
  );
};

export default PpcFooter;
