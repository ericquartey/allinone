// ============================================================================
// PPC Mappers - normalize MAS/EJLOG data into shared shapes.
// ============================================================================

import type { Mission as MasMission } from '../../types/masAdapter';
import type { LoadingUnit as EjlogLoadingUnit } from '../../types/models';
import type { LoadingUnit as AutomationLoadingUnit } from '../../services/ppc/automationTypes';

export type UnifiedMissionType = 'IN' | 'OUT' | 'WMS' | 'UNKNOWN';

export type UnifiedMission = {
  id?: number;
  type: UnifiedMissionType;
  bayNumber?: number;
  loadingUnitId?: number;
};

export type UnifiedLoadingUnit = {
  id: number;
  code: string;
  height?: number | null;
  weight?: number | null;
  status?: string | null;
  cellId?: number | null;
};

export const normalizeMissionType = (raw?: string | number | null): UnifiedMissionType => {
  if (typeof raw === 'string') {
    const normalized = raw.toLowerCase();
    if (normalized.includes('out')) return 'OUT';
    if (normalized.includes('in')) return 'IN';
    if (normalized.includes('wms')) return 'WMS';
    return 'UNKNOWN';
  }
  if (typeof raw === 'number') {
    if (raw === 1) return 'IN';
    if (raw === 2) return 'OUT';
    if (raw === 3) return 'WMS';
  }
  return 'UNKNOWN';
};

export const mapMissionLike = (mission: Partial<MasMission> & Record<string, any>): UnifiedMission => {
  return {
    id: mission.id ?? mission.Id,
    type: normalizeMissionType(
      mission.missionType ?? mission.type ?? mission.MissionType ?? mission.Type
    ),
    bayNumber:
      mission.bayNumber ??
      mission.BayNumber ??
      mission.targetBay ??
      mission.TargetBay,
    loadingUnitId:
      mission.loadingUnitId ??
      mission.LoadingUnitId ??
      mission.loadUnitId ??
      mission.LoadUnitId,
  };
};

export const mapEjlogLoadingUnit = (unit: EjlogLoadingUnit): UnifiedLoadingUnit => ({
  id: unit.id,
  code: unit.barcode ?? String(unit.id),
  height: unit.height ?? null,
  weight: unit.areaFillRate ?? null,
  status: unit.currentLocation ?? null,
  cellId: unit.bayNumber ?? null,
});

export const mapAutomationLoadingUnit = (unit: AutomationLoadingUnit): UnifiedLoadingUnit => ({
  id: unit.Id ?? 0,
  code: unit.Id ? String(unit.Id) : '--',
  height: unit.Height ?? null,
  weight: unit.NetWeight ?? null,
  status: unit.CellId ? `Cell ${unit.CellId}` : null,
  cellId: unit.CellId ?? null,
});
