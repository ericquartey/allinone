import type { LoadingUnit, MissionOperation } from './models';

export interface Mission {
  id: number;
  bayNumber?: number;
  loadingUnitId?: number;
  machineId?: number;
  isCompleted?: boolean;
  operations?: MissionOperation[];
}

export interface MissionDetails extends Mission {
  loadingUnit?: LoadingUnit;
}

export interface HubEntityUpdatedEvent {
  id?: string;
  entityType?: string;
  operation?: string;
}
