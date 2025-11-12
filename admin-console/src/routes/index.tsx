import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from '@/config/constants';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/layouts/DashboardLayout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import KYCPage from '@/pages/KYCPage';
import FarmersPage from '@/pages/FarmersPage';
import BuyersPage from '@/pages/BuyersPage';
import OrdersPage from '@/pages/OrdersPage';
import InventoryPage from '@/pages/InventoryPage';
import PricingPage from '@/pages/PricingPage';
import PaymentsPage from '@/pages/PaymentsPage';
import PayoutsPage from '@/pages/PayoutsPage';
import MessagingPage from '@/pages/MessagingPage';
import AuditLogsPage from '@/pages/AuditLogsPage';
import SettingsPage from '@/pages/SettingsPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
        <Route path={ROUTES.KYC} element={<KYCPage />} />
        <Route path={ROUTES.FARMERS} element={<FarmersPage />} />
        <Route path={ROUTES.BUYERS} element={<BuyersPage />} />
        <Route path={ROUTES.ORDERS} element={<OrdersPage />} />
        <Route path={ROUTES.INVENTORY} element={<InventoryPage />} />
        <Route path={ROUTES.PRICING} element={<PricingPage />} />
        <Route path={ROUTES.PAYMENTS} element={<PaymentsPage />} />
        <Route path={ROUTES.PAYOUTS} element={<PayoutsPage />} />
        <Route path={ROUTES.MESSAGING} element={<MessagingPage />} />
        <Route path={ROUTES.AUDIT_LOGS} element={<AuditLogsPage />} />
        <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
    </Routes>
  );
}

