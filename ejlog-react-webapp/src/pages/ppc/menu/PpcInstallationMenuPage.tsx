import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PpcInstallationNavMenu from '../../../components/ppc/PpcInstallationNavMenu';
import PpcInstallationNavFooter from '../../../components/ppc/PpcInstallationNavFooter';
import PpcProgressBar from '../../../components/ppc/PpcProgressBar';
import { ppcT } from '../../../features/ppc/ppcStrings';
import { useGetIdentityQuery, useGetSetupStatusQuery } from '../../../services/api/ppcAutomationApi';
import ppcAutomationService from '../../../services/ppc/automationService';
import type { BaySetupStatus, SetupStepStatus } from '../../../services/ppc/automationTypes';
import { PPC_BAY_NUMBER } from '../../../config/api';

type InstallationStatusItem = {
  text: string;
  status: 'complete' | 'incomplete' | 'inprogress' | 'skippable';
  bypass?: string;
  isConfirmSetup?: boolean;
};

const PpcInstallationMenuPage: React.FC = () => {
  const navigate = useNavigate();
  const setupStatusQuery = useGetSetupStatusQuery();
  const identityQuery = useGetIdentityQuery();
  const [bays, setBays] = useState<Array<{ Number?: number; IsExternal?: boolean; Shutter?: { Type?: number } | null }>>([]);
  const [isConfirmingSetup, setIsConfirmingSetup] = useState(false);

  useEffect(() => {
    const loadBays = async () => {
      try {
        const data = await ppcAutomationService.getBays();
        setBays(data || []);
      } catch (error) {
        console.error('Unable to load bays', error);
      }
    };
    loadBays();
  }, []);

  const setupStatus = setupStatusQuery.data;
  const currentBayStatus: BaySetupStatus | null | undefined =
    PPC_BAY_NUMBER === 1 ? setupStatus?.Bay1 : PPC_BAY_NUMBER === 2 ? setupStatus?.Bay2 : setupStatus?.Bay3;

  const activeBays = useMemo(
    () => bays.filter((bay) => bay.Number && bay.Number !== 4),
    [bays]
  );
  const otherBays = useMemo(
    () => activeBays.filter((bay) => bay.Number !== PPC_BAY_NUMBER),
    [activeBays]
  );
  const otherBaysSetupCompleted = useMemo(() => {
    if (!setupStatus) {
      return false;
    }
    return otherBays.every((bay) => {
      switch (bay.Number) {
        case 1:
          return setupStatus.Bay1?.IsAllTestCompleted;
        case 2:
          return setupStatus.Bay2?.IsAllTestCompleted;
        case 3:
          return setupStatus.Bay3?.IsAllTestCompleted;
        default:
          return true;
      }
    });
  }, [otherBays, setupStatus]);

  const hasShutter = Boolean(currentBayStatus?.Shutter);
  const hasExternalBay = Boolean(currentBayStatus?.ExternalBayCalibration);
  const isTuningCompleted = Boolean(identityQuery.data?.InstallationDate);

  const getStatus = (step?: SetupStepStatus | null) => {
    if (!step) return 'incomplete';
    if (step.InProgress) return 'inprogress';
    if (step.IsCompleted) return 'complete';
    if (step.IsBypassed) return 'skippable';
    return 'incomplete';
  };

  const statusItems = useMemo<InstallationStatusItem[]>(() => {
    if (!setupStatus) {
      return [];
    }

    const items: InstallationStatusItem[] = [
      {
        text: ppcT('InstallationApp.VerticalAxisHomedDone', 'Vertical axis homed'),
        status: getStatus(setupStatus.VerticalOriginCalibration),
        bypass: 'vertical-origin-bypass',
      },
      {
        text: ppcT('InstallationApp.VerticalOffsetVerify', 'Vertical offset verify'),
        status: getStatus(setupStatus.VerticalOffsetCalibration),
        bypass: 'vertical-offset-bypass',
      },
      {
        text: ppcT('InstallationApp.BeltBurnishingDone', 'Belt burnishing'),
        status: getStatus(setupStatus.BeltBurnishing),
        bypass: 'belt-burnishing-test-bypass',
      },
      {
        text: ppcT('InstallationApp.HorizontalZeroOffset', 'Horizontal zero offset'),
        status: getStatus(setupStatus.HorizontalChainCalibration),
        bypass: 'horizontal-chain-calibration-bypass',
      },
    ];

    if (hasShutter) {
      items.push({
        text: ppcT('InstallationApp.GateControl', 'Gate control'),
        status: getStatus(currentBayStatus?.Shutter),
        bypass: 'bay-shutter-test-bypass',
      });
    }

    if (hasExternalBay) {
      items.push({
        text: ppcT('InstallationApp.ExternalBayCalibrationMenuTitle', 'External bay calibration'),
        status: getStatus(currentBayStatus?.ExternalBayCalibration),
        bypass: 'bay-external-calibration-bypass',
      });
    }

    items.push(
      {
        text: ppcT('InstallationApp.CellsControl', 'Cells control'),
        status: getStatus(setupStatus.CellPanelsCheck),
        bypass: 'cell-panels-check-bypass',
      },
      {
        text: ppcT('InstallationApp.VerticalResolutionDone', 'Vertical resolution done'),
        status: getStatus(setupStatus.VerticalResolutionCalibration),
        bypass: 'vertical-resolution-bypass',
      },
      {
        text: ppcT('InstallationApp.BayHeightCheck', 'Bay height check'),
        status: getStatus(currentBayStatus?.Check),
        bypass: 'bay-height-check-bypass',
      },
      {
        text: ppcT('InstallationApp.LoadFirstDrawerPageHeader', 'Load first drawer'),
        status: getStatus(setupStatus.LoadFirstDrawerTest),
        bypass: 'load-first-drawer-test-bypass',
      }
    );

    const fullTestStatus =
      PPC_BAY_NUMBER === 1 ? setupStatus.Bay1?.FullTest : PPC_BAY_NUMBER === 2 ? setupStatus.Bay2?.FullTest : setupStatus.Bay3?.FullTest;
    items.push({
      text: ppcT('InstallationApp.CompleteTestMenuTitle', 'Complete test'),
      status: getStatus(fullTestStatus),
      bypass: 'full-test-bypass',
    });

    if (otherBays.length > 0) {
      items.push({
        text: ppcT('InstallationApp.CompleteOtherBayTest', 'Complete other bay test'),
        status: otherBaysSetupCompleted ? 'complete' : 'incomplete',
      });
    }

    items.push(
      {
        text: ppcT('InstallationApp.ProfileResolutionCalibration', 'Profile resolution calibration'),
        status: getStatus(currentBayStatus?.Profile),
        bypass: 'bay-profile-check-bypass',
      },
      {
        text: ppcT('InstallationApp.ConfirmSetup', 'Confirm setup'),
        status: isTuningCompleted ? 'complete' : 'incomplete',
        isConfirmSetup: true,
      }
    );

    return items;
  }, [
    setupStatus,
    currentBayStatus,
    hasShutter,
    hasExternalBay,
    otherBays,
    otherBaysSetupCompleted,
    isTuningCompleted,
  ]);

  const setupListCompleted = useMemo(
    () => {
      if (statusItems.length === 0) {
        return false;
      }
      return statusItems
        .filter((item) => !item.isConfirmSetup)
        .every((item) => item.status === 'complete');
    },
    [statusItems]
  );

  const completedCount = statusItems.filter((item) => item.status === 'complete').length;
  const totalCount = statusItems.length || 1;
  const progress = Math.round((completedCount / totalCount) * 100);

  const handleBypass = async (step?: string, label?: string) => {
    if (!step) {
      return;
    }
    const confirmMessage = label
      ? `${ppcT('InstallationApp.BypassTest', 'Confirm bypass?')}\n${label}`
      : ppcT('InstallationApp.BypassTest', 'Confirm bypass?');
    if (!window.confirm(confirmMessage)) {
      return;
    }
    await ppcAutomationService.bypassSetupStep(step);
    await setupStatusQuery.refetch();
  };

  const handleConfirmSetup = async () => {
    if (!setupListCompleted || isTuningCompleted || isConfirmingSetup) {
      return;
    }
    const confirmMessage = ppcT('InstallationApp.ConfirmCompleteTest', 'Confirm complete test?');
    if (!window.confirm(confirmMessage)) {
      return;
    }
    try {
      setIsConfirmingSetup(true);
      await ppcAutomationService.confirmSetup();
      await Promise.all([setupStatusQuery.refetch(), identityQuery.refetch()]);
    } finally {
      setIsConfirmingSetup(false);
    }
  };

  const handleMovements = () => {
    navigate('/ppc/installation/movements');
  };

  const handleSensors = () => {
    navigate('/ppc/installation/other-sensors');
  };

  return (
    <div className="ppc-installation-layout">
      <div className="ppc-installation-layout__nav">
        <PpcInstallationNavMenu activeKey="installation" />
      </div>

      <div className="ppc-installation-layout__content">
        <div className="ppc-installation-layout__title">
          {ppcT('Menu.InstallationStatus', 'Installation status')}
        </div>

        <div className="ppc-installation-status">
          <div className="ppc-installation-status__subtitle">Status</div>
          <PpcProgressBar value={progress} />
        </div>

        <div className="ppc-installation-status__list">
          {statusItems.map((item) => (
            <div key={item.text} className={`ppc-installation-status__row ${item.status}`}>
              <span className="ppc-installation-status__dot" />
              <span className="ppc-installation-status__text">{item.text}</span>
              {item.bypass && item.status !== 'complete' && (
                <button
                  type="button"
                  className="ppc-installation-status__bypass"
                  onClick={() => handleBypass(item.bypass, item.text)}
                >
                  Bypass
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="ppc-installation-layout__footer">
          <PpcInstallationNavFooter
            onConfirm={handleConfirmSetup}
            confirmVisible={setupListCompleted && !isTuningCompleted}
            confirmDisabled={isConfirmingSetup}
            onMovements={handleMovements}
            onSensors={handleSensors}
          />
        </div>
      </div>
    </div>
  );
};

export default PpcInstallationMenuPage;
