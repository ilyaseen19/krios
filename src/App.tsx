import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import InstallPWA from './components/InstallPWA';
import { AuthProvider } from './contexts/AuthContext';
import { OfflineProvider } from './contexts/OfflineContext';
import { SettingsProvider } from './contexts/SettingsContext';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import LoginProtection from './components/LoginProtection';
import AdminLayout from './components/AdminLayout';
import OfflineIndicator from './components/OfflineIndicator';
import ToastContainer from './components/ToastContainer';
import PersistentOfflineToast from './components/PersistentOfflineToast';
import Unauthorized from './components/Unauthorized';
import SubscriptionValidator from './components/SubscriptionValidator';
import './App.css';

// Import page components
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Sales from './components/Sales';
import Reports from './components/Reports';
import POS from './components/POS';
import Users from './components/Users';
import Settings from './components/Settings';

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <OfflineProvider>
          <SettingsProvider>
            <SubscriptionValidator>
              <ToastContainer />
              <PersistentOfflineToast />
              <div style={{ padding: '0.5rem 1rem' }}>
                {/* <OfflineIndicator /> */}
                <InstallPWA />
              </div>
              <Routes>
          <Route path="/login" element={<LoginProtection><Login /></LoginProtection>} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route
            path="pos"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'cashier', 'supervispor']}>
                <POS />
              </ProtectedRoute>
            }
          />
          <Route
            path="/*"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'inventory']}>
                <AdminLayout>
                  <Routes>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="products" element={<ProtectedRoute allowedRoles={['admin']}><Products /></ProtectedRoute>} />
                    <Route path="sales" element={<Sales />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="users" element={<Users />} />
                    <Route path="settings" element={<Settings />} />
                    <Route index element={<Dashboard />} />
                  </Routes>
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<LoginProtection><Login /></LoginProtection>} />
            </Routes>
            </SubscriptionValidator>
          </SettingsProvider>
        </OfflineProvider>
      </AuthProvider>
    </Router>
  );
}

export default App
