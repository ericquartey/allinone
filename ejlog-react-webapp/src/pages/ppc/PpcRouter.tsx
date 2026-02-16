import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PpcModulePage from './PpcModulePage';
import PpcViewPage from './PpcViewPage';
import PpcAdminPage from './PpcAdminPage';
import PpcAdminConfigPage from './admin/PpcAdminConfigPage';
import PpcAdminAnalyticsPage from './admin/PpcAdminAnalyticsPage';
import PpcAdminReportsPage from './admin/PpcAdminReportsPage';
import PpcAdminSystemPage from './admin/PpcAdminSystemPage';
import PpcAdminUsersPage from './admin/PpcAdminUsersPage';
import PpcAdminReportsBuilderPage from './admin/PpcAdminReportsBuilderPage';
import PpcAdminNotificationsPage from './admin/PpcAdminNotificationsPage';
import PpcAdminAuditLogPage from './admin/PpcAdminAuditLogPage';
import PpcAdminBarcodePage from './admin/PpcAdminBarcodePage';
import PpcAdminSettingsPage from './admin/PpcAdminSettingsPage';
import PpcAdminDashboardPage from './admin/PpcAdminDashboardPage';
import PpcWarehouse3DPage from './operator/PpcWarehouse3DPage';
import PpcShell from '../../components/ppc/PpcShell';

const PpcRouter: React.FC = () => {
  return (
    <Routes>
      <Route element={<PpcShell />}>
        <Route index element={<Navigate to="/ppc/menu/main-menu" replace />} />
        <Route path="operator/warehouse3d/:missionId" element={<PpcWarehouse3DPage />} />
        <Route path="admin" element={<PpcAdminPage />} />
        <Route path="admin/dashboard" element={<PpcAdminDashboardPage />} />
        <Route path="admin/users" element={<PpcAdminUsersPage />} />
        <Route path="admin/audit-log" element={<PpcAdminAuditLogPage />} />
        <Route path="admin/reports-builder" element={<PpcAdminReportsBuilderPage />} />
        <Route path="admin/notifications" element={<PpcAdminNotificationsPage />} />
        <Route path="admin/barcodes" element={<PpcAdminBarcodePage />} />
        <Route path="admin/settings" element={<PpcAdminSettingsPage />} />
        <Route path="admin/config" element={<PpcAdminConfigPage />} />
        <Route path="admin/analytics" element={<PpcAdminAnalyticsPage />} />
        <Route path="admin/reports" element={<PpcAdminReportsPage />} />
        <Route path="admin/system" element={<PpcAdminSystemPage />} />
        <Route path=":module" element={<PpcModulePage />} />
        <Route path=":module/:view" element={<PpcViewPage />} />
        <Route path="*" element={<Navigate to="/ppc" replace />} />
      </Route>
    </Routes>
  );
};

export default PpcRouter;
