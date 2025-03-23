import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import LoginProtection from './components/LoginProtection';
import AdminLayout from './components/AdminLayout';
import './App.css';

// Import page components
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Sales from './components/Sales';
import Reports from './components/Reports';
import POS from './components/POS';
import Users from './components/Users';
import Settings from './components/Settings';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginProtection><Login /></LoginProtection>} />
          <Route
            path="pos"
            element={
              <ProtectedRoute allowedRoles={['admin', 'user', 'cashier']}>
                <POS />
              </ProtectedRoute>
            }
          />
          <Route
            path="/*"
            element={
              <ProtectedRoute allowedRoles={['admin', 'user', 'cashier']}>
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
      </Router>
    </AuthProvider>
  )
}

export default App
