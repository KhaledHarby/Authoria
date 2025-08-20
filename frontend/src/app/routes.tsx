import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import LoginPage from '../features/auth/LoginPage';
import ForgotPasswordPage from '../features/auth/ForgotPasswordPage';
import ResetPasswordPage from '../features/auth/ResetPasswordPage';
import DashboardPage from '../features/dashboard/DashboardPage';
import UsersPage from '../features/users/UsersPage';
import RolesPage from '../features/roles/RolesPage';
import PermissionsPage from '../features/permissions/PermissionsPage';
import LocalizationPage from '../features/localization/LocalizationPage';
import AuditPage from '../features/audit/AuditPage';
import WebhooksPage from '../features/webhooks/WebhooksPage';
import SettingsPage from '../features/settings/SettingsPage';
import ApplicationsPage from '../features/applications/ApplicationsPage';

const router = createBrowserRouter([
  { path: '/', element: <LoginPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  { path: '/dashboard', element: <DashboardPage /> },
  { path: '/applications', element: <ApplicationsPage /> },
  { path: '/users', element: <UsersPage /> },
  { path: '/roles', element: <RolesPage /> },
  { path: '/permissions', element: <PermissionsPage /> },
  { path: '/localization', element: <LocalizationPage /> },
  { path: '/audit', element: <AuditPage /> },
  { path: '/webhooks', element: <WebhooksPage /> },
  { path: '/settings', element: <SettingsPage /> },
]);

export default function AppRoutes() {
  return <RouterProvider router={router} />;
}

