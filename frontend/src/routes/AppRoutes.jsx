import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import LandingPage from '../pages/LandingPage';
import ServicesCatalogPage from '../pages/services/ServicesCatalogPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import UnauthorizedPage from '../pages/UnauthorizedPage';
import CustomerDashboard from '../pages/customer/CustomerDashboard';
import CreateRequestPage from '../pages/customer/CreateRequestPage';
import CustomerRequestsPage from '../pages/customer/CustomerRequestsPage';
import ProviderDashboard from '../pages/provider/ProviderDashboard';
import ProviderProfilePage from '../pages/provider/ProviderProfilePage';
import JobOpportunitiesPage from '../pages/provider/JobOpportunitiesPage';
import ProviderQuotesPage from '../pages/provider/ProviderQuotesPage';
import OpsDashboard from '../pages/ops/OpsDashboard';
import CategoryManagementPage from '../pages/ops/CategoryManagementPage';
import ProviderVerificationQueuePage from '../pages/ops/ProviderVerificationQueuePage';
import AdminDashboard from '../pages/admin/AdminDashboard';
import SupportDashboard from '../pages/support/SupportDashboard';

const RoleRoute = ({ roles, children }) => (
  <ProtectedRoute allowedRoles={roles}>{children}</ProtectedRoute>
);

export const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/services" element={<ServicesCatalogPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/unauthorized" element={<UnauthorizedPage />} />

    <Route path="/dashboard/customer" element={<RoleRoute roles={['Customer']}><CustomerDashboard /></RoleRoute>} />
    <Route path="/dashboard/customer/create-request" element={<RoleRoute roles={['Customer']}><CreateRequestPage /></RoleRoute>} />
    <Route path="/dashboard/customer/requests" element={<RoleRoute roles={['Customer']}><CustomerRequestsPage /></RoleRoute>} />
    <Route path="/dashboard/customer/bookings" element={<RoleRoute roles={['Customer']}><CustomerRequestsPage /></RoleRoute>} />

    <Route path="/dashboard/provider" element={<RoleRoute roles={['Service Provider']}><ProviderDashboard /></RoleRoute>} />
    <Route path="/dashboard/provider/profile" element={<RoleRoute roles={['Service Provider']}><ProviderProfilePage /></RoleRoute>} />
    <Route path="/dashboard/provider/opportunities" element={<RoleRoute roles={['Service Provider']}><JobOpportunitiesPage /></RoleRoute>} />
    <Route path="/dashboard/provider/quotes" element={<RoleRoute roles={['Service Provider']}><ProviderQuotesPage /></RoleRoute>} />

    <Route path="/dashboard/ops" element={<RoleRoute roles={['Operations Manager']}><OpsDashboard /></RoleRoute>} />
    <Route path="/dashboard/ops/categories" element={<RoleRoute roles={['Operations Manager']}><CategoryManagementPage /></RoleRoute>} />
    <Route path="/dashboard/ops/verifications" element={<RoleRoute roles={['Operations Manager']}><ProviderVerificationQueuePage /></RoleRoute>} />

    <Route path="/dashboard/admin/*" element={<RoleRoute roles={['Platform Admin']}><AdminDashboard /></RoleRoute>} />
    <Route path="/dashboard/support/*" element={<RoleRoute roles={['Support Agent']}><SupportDashboard /></RoleRoute>} />

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default AppRoutes;
