// ============================================================================
// Dashboard Components - Central Export
// Export all dashboard components for easy importing
// ============================================================================

export { default as HeroBanner } from './HeroBanner';
export { default as QuickStatsGrid } from './QuickStatsGrid';
export { default as ChartsSection } from './ChartsSection';
export { default as QuickActionsGrid } from './QuickActionsGrid';
export { default as RecentActivityTimeline } from './RecentActivityTimeline';
export { default as AlertsPanel } from './AlertsPanel';

// Export types
export type { StatCardData } from './QuickStatsGrid';
export type { ListTypeData, MonthlyCompletionData } from './ChartsSection';
export type { QuickAction } from './QuickActionsGrid';
export type { Activity } from './RecentActivityTimeline';
export type { Alert, AlertSeverity } from './AlertsPanel';
