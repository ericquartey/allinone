import React, { useEffect, useState } from 'react';
import PpcBayBadge from '../../../components/ppc/PpcBayBadge';
import { ppcT } from '../../../features/ppc/ppcStrings';
import usePpcMachineStatus from '../../../hooks/usePpcMachineStatus';

const PpcLoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { identity, bayNumber } = usePpcMachineStatus();
  const [now, setNow] = useState(() => new Date());
  const modelName = identity?.ModelName || 'ModelName';
  const serialNumber = identity?.SerialNumber || 'SerialNumber';

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="ppc-login">
      <div className="ppc-login__time">
        {now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
      </div>

      <div className="ppc-login__card">
        <div
          className="ppc-login__panel ppc-login__panel--left"
          style={{ backgroundImage: "url('/ppc-assets/bkg_login.jpg')" }}
        >
          <div className="ppc-login__banner">
            <div className="ppc-login__model">{modelName}</div>
            <div className="ppc-login__serial">
              {ppcT('General.SerialNumber', 'Serial Number')} {serialNumber}
            </div>
          </div>

          <div className="ppc-login__badge">
            <PpcBayBadge bayNumber={bayNumber || 1} />
          </div>
        </div>

        <div className="ppc-login__panel ppc-login__panel--right">
          <div className="ppc-login__logo">
            <img src="/ppc-assets/newferrettologo_small_light.png" alt="Ferretto" />
          </div>

          <div className="ppc-login__form">
            <div className="ppc-login__title">LOGIN</div>

            <label className="ppc-login__label" htmlFor="ppc-user">
              {ppcT('LoadLogin.EnterServiceUsername', 'Username')}
            </label>
            <input
              id="ppc-user"
              className="ppc-login__input"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />

            <label className="ppc-login__label" htmlFor="ppc-password">
              {ppcT('LoadLogin.PasswordEnter', 'Password')}
            </label>
            <input
              id="ppc-password"
              className="ppc-login__input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />

            <button type="button" className="ppc-login__submit">
              {ppcT('General.Login', 'Login')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PpcLoginPage;
