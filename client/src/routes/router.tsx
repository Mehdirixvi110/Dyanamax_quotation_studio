import { createBrowserRouter } from 'react-router-dom';
import { AdminLayout } from '../layouts/AdminLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { ClientLayout } from '../layouts/ClientLayout';
import { ProtectedRoute } from './ProtectedRoute';

// Pages — lazy loaded
import { DashboardPage } from '../pages/Dashboard';
import { LoginPage } from '../pages/Login';
import { CostLibraryPage } from '../pages/CostLibrary';
import { CustomersPage } from '../pages/Customers';
import { QuotationsPage } from '../pages/Quotations';
import { QuotationDetailPage } from '../pages/quotations/QuotationDetail';
import { MeasurementsPage } from '../pages/Measurements';
import { TemplateDetailPage } from '../pages/measurements/TemplateDetail';
import { AnalyticsPage } from '../pages/Analytics';
import { SettingsPage } from '../pages/Settings';
import { AuditLogsPage } from '../pages/AuditLogs';
import { ClientLoginPage } from '../pages/client/ClientLogin';
import { ClientQuotationPage } from '../pages/client/ClientQuotation';

export const router = createBrowserRouter([
  // Admin routes
  {
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/cost-library', element: <CostLibraryPage /> },
      { path: '/customers', element: <CustomersPage /> },
      { path: '/quotations', element: <QuotationsPage /> },
      { path: '/quotations/:id', element: <QuotationDetailPage /> },
      { path: '/measurements', element: <MeasurementsPage /> },
      { path: '/measurements/:id', element: <TemplateDetailPage /> },
      { path: '/analytics', element: <AnalyticsPage /> },
      { path: '/audit-logs', element: <AuditLogsPage /> },
      { path: '/settings', element: <SettingsPage /> },
    ],
  },
  // Auth routes
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
    ],
  },
  // Client routes
  {
    element: <ClientLayout />,
    children: [
      { path: '/client/login', element: <ClientLoginPage /> },
      { path: '/client/quotation', element: <ClientQuotationPage /> },
    ],
  },
]);
