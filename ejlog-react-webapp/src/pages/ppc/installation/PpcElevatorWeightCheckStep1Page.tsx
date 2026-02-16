import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PpcActionButton from '../../../components/ppc/PpcActionButton';
import PpcFormField from '../../../components/ppc/PpcFormField';
import PpcWizardLayout from '../../../components/ppc/PpcWizardLayout';
import { ppcT } from '../../../features/ppc/ppcStrings';

const PpcElevatorWeightCheckStep1Page: React.FC = () => {
  const navigate = useNavigate();
  const [loadingUnitId, setLoadingUnitId] = useState('');

  const handleVerify = () => {
    if (!loadingUnitId) {
      return;
    }
    sessionStorage.setItem('ppc.weightCheck.loadingUnitId', loadingUnitId);
    navigate('/ppc/installation/elevator-weight-check-step2');
  };

  return (
    <PpcWizardLayout
      title={ppcT('InstallationApp.WeightControl', 'Weight control')}
      steps={[
        { label: '1', active: true },
        { label: '2' },
      ]}
    >
      <div className="ppc-wizard__panel-title">
        {ppcT('InstallationApp.InsertDesiredLoadingUnitId', 'Insert loading unit id')}
      </div>
      <div className="ppc-form-row">
        <PpcFormField
          label={ppcT('InstallationApp.InsertDesiredLoadingUnitId', 'Insert loading unit id')}
          value={loadingUnitId}
          onChange={setLoadingUnitId}
        />
        <PpcActionButton label={ppcT('InstallationApp.Verify', 'Verify')} onClick={handleVerify} />
      </div>
    </PpcWizardLayout>
  );
};

export default PpcElevatorWeightCheckStep1Page;
