import React from 'react';
import { Bug } from 'lucide-react';
import { ppcT } from '../../../features/ppc/ppcStrings';

const PpcLayoutDiagnosticDetailsPage: React.FC = () => {
  return (
    <div className="ppc-diagnostic">
      <div className="ppc-diagnostic__panel">
        <div className="ppc-diagnostic__title">
          <div>{ppcT('General.DiagnosticDetailTitle', 'Diagnostic details')}</div>
          <Bug size={24} />
        </div>

        <div className="ppc-diagnostic__grid">
          <div className="ppc-diagnostic__card">
            <div className="ppc-diagnostic__card-title">
              {ppcT('General.FiniteMachineState', 'Finite machine state')}
            </div>
            <div className="ppc-diagnostic__row">
              <span>{ppcT('General.StatusDebug', 'Status')}</span>
              <span>FSM: RUN</span>
            </div>
            <div className="ppc-diagnostic__row">
              <span>{ppcT('General.StatusDebug', 'Status')}</span>
              <span>State: READY</span>
            </div>
          </div>

          <div className="ppc-diagnostic__card">
            <div className="ppc-diagnostic__card-title">
              {ppcT('General.IODrive', 'IO drive')}
            </div>
            <div className="ppc-diagnostic__row">
              <span>{ppcT('General.StatusDebug', 'Status')}</span>
              <span>IO: OK</span>
            </div>
            <div className="ppc-diagnostic__row">
              <span>{ppcT('General.StatusDebug', 'Status')}</span>
              <span>State: READY</span>
            </div>
          </div>

          <div className="ppc-diagnostic__card">
            <div className="ppc-diagnostic__card-title">
              {ppcT('General.Inverter', 'Inverter')}
            </div>
            <div className="ppc-diagnostic__row">
              <span>{ppcT('General.StatusDebug', 'Status')}</span>
              <span>INV: OK</span>
            </div>
            <div className="ppc-diagnostic__row">
              <span>{ppcT('General.StatusDebug', 'Status')}</span>
              <span>State: READY</span>
            </div>
          </div>

          <div className="ppc-diagnostic__card">
            <div className="ppc-diagnostic__card-title">
              {ppcT('General.Devices', 'Devices')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PpcLayoutDiagnosticDetailsPage;
