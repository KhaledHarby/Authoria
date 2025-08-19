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

const router = createBrowserRouter([
  { path: '/', element: <LoginPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  { path: '/dashboard', element: <DashboardPage /> },
  { path: '/users', element: <UsersPage /> },
  { path: '/roles', element: <RolesPage /> },
  { path: '/permissions', element: <PermissionsPage /> },
  { path: '/localization', element: <LocalizationPage /> },
  { path: '/audit', element: <AuditPage /> },
  { path: '/webhooks', element: <WebhooksPage /> },
]);

export default function AppRoutes() {
  return <RouterProvider router={router} />;
}

