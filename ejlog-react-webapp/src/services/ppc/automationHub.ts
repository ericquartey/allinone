import { HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { PPC_AUTOMATION_HUB_BASE_URL } from '../../config/api';

type HubSource = 'operator' | 'installation';
type HubEventHandler = (eventName: string, payload: unknown[], source: HubSource) => void;

const HUB_BASE = PPC_AUTOMATION_HUB_BASE_URL.replace(/\/$/, '');
const OPERATOR_HUB_URL = `${HUB_BASE}/operator-endpoint`;
const INSTALLATION_HUB_URL = `${HUB_BASE}/installation-endpoint`;

const OPERATOR_EVENTS = [
  'AssignedMissionChanged',
  'AssignedMissionOperationChanged',
  'BayStatusChanged',
  'ErrorStatusChanged',
  'ProductsChanged',
  'SetBayDrawerOperationToInventory',
  'SetBayDrawerOperationToPick',
  'SetBayDrawerOperationToRefill',
  'SetBayDrawerOperationToWaiting',
];

const INSTALLATION_EVENTS = [
  'BayChainPositionChanged',
  'BayLightChanged',
  'CalibrateAxisNotify',
  'CombinedMovementsNotify',
  'CurrentPositionChanged',
  'DiagOutChanged',
  'ElevatorPositionChanged',
  'ElevatorWeightCheck',
  'FsmException',
  'HomingProcedureStatusChanged',
  'InverterParameterNotify',
  'InverterProgrammingChanged',
  'InverterReadingChanged',
  'InverterStatusWordChanged',
  'LogoutChanged',
  'MachineModeChanged',
  'MachinePowerChanged',
  'MachineStateActiveNotify',
  'MachineStatusActiveNotify',
  'MoveLoadingUnit',
  'MoveTest',
  'PositioningNotify',
  'PowerEnableNotify',
  'ProfileCalibration',
  'RepetitiveHorizontalMovementsNotify',
  'ResolutionCalibrationNotify',
  'SensorsChanged',
  'ShutterPositioningNotify',
  'SocketLinkAlphaNumericBarChange',
  'SocketLinkLaserPointerChange',
  'SocketLinkOperationChange',
  'SwitchAxisNotify',
  'SystemTimeChanged',
];

class PpcAutomationHubService {
  private operatorConnection = new HubConnectionBuilder()
    .withUrl(OPERATOR_HUB_URL)
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();

  private installationConnection = new HubConnectionBuilder()
    .withUrl(INSTALLATION_HUB_URL)
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();

  private handlers = new Set<HubEventHandler>();
  private operatorWired = false;
  private installationWired = false;

  async connect(): Promise<void> {
    if (!this.operatorWired) {
      this.wireEvents(this.operatorConnection, 'operator', OPERATOR_EVENTS);
      this.operatorWired = true;
    }
    if (!this.installationWired) {
      this.wireEvents(this.installationConnection, 'installation', INSTALLATION_EVENTS);
      this.installationWired = true;
    }

    await Promise.all([this.startConnection(this.operatorConnection), this.startConnection(this.installationConnection)]);
  }

  async disconnect(): Promise<void> {
    await Promise.all([this.stopConnection(this.operatorConnection), this.stopConnection(this.installationConnection)]);
  }

  onEvent(handler: HubEventHandler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  private async startConnection(connection: typeof this.operatorConnection): Promise<void> {
    if (connection.state === HubConnectionState.Connected) return;
    await connection.start();
  }

  private async stopConnection(connection: typeof this.operatorConnection): Promise<void> {
    if (connection.state === HubConnectionState.Disconnected) return;
    await connection.stop();
  }

  private wireEvents(connection: typeof this.operatorConnection, source: HubSource, events: string[]): void {
    events.forEach((eventName) => {
      connection.on(eventName, (...args: unknown[]) => {
        this.handlers.forEach((handler) => handler(eventName, args, source));
      });
    });
  }
}

export const ppcAutomationHubService = new PpcAutomationHubService();
export default ppcAutomationHubService;
