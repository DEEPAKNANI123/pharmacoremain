import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DatabaseProvider, useDatabase } from './context/DatabaseContext';

// Layouts
import AdminLayout from './components/layout/AdminLayout';
import PatientLayout from './components/patient/PatientLayout';

// Admin Pages (Lazy Loaded)
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const PosSales = lazy(() => import('./pages/admin/PosSales'));
const Inventory = lazy(() => import('./pages/admin/Inventory'));
const Alerts = lazy(() => import('./pages/admin/Alerts'));
const RxValidation = lazy(() => import('./pages/admin/RxValidation'));
const Procurement = lazy(() => import('./pages/admin/Procurement'));
const GRNReceiving = lazy(() => import('./pages/admin/GRNReceiving'));
const ColdStore = lazy(() => import('./pages/admin/ColdStore'));
const Treasury = lazy(() => import('./pages/admin/Treasury'));
const VatReturns = lazy(() => import('./pages/admin/VatReturns'));
const Compliance = lazy(() => import('./pages/admin/Compliance'));
const HrPayroll = lazy(() => import('./pages/admin/HrPayroll'));
const Customers = lazy(() => import('./pages/admin/Customers'));
const ReportsPage = lazy(() => import('./pages/admin/ReportsPage'));
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage'));

// Patient Pages (Lazy Loaded)
const PatientDashboard = lazy(() => import('./pages/patient/PatientDashboard'));
const PatientSearch = lazy(() => import('./pages/patient/PatientSearch'));
const PatientCart = lazy(() => import('./pages/patient/PatientCart'));
const PatientProfile = lazy(() => import('./pages/patient/PatientProfile'));

// Essential Pages (Static)
import Login from './pages/Login';

// Premium Loader Component
function PageLoader() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'var(--color-bg-base)',
      gap: '1.5rem'
    }}>
      <div className="loader-spinner" style={{
        width: '40px',
        height: '40px',
        border: '3px solid #f3f3f3',
        borderTop: '3px solid var(--color-primary)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <p style={{
        fontSize: '0.85rem',
        fontWeight: 600,
        color: 'var(--color-text-muted)',
        letterSpacing: '0.05em'
      }}>PHARMACORE IS LOADING...</p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function ProtectedRoute({ children, role }: { children: React.ReactNode, role: 'admin' | 'patient' }) {
  const { currentUser } = useDatabase();
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (currentUser.role !== role) {
    return <Navigate to={currentUser.role === 'admin' ? '/admin/dashboard' : '/patient/dashboard'} />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <DatabaseProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute role="admin">
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="pos" element={<PosSales />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="alerts" element={<Alerts />} />
              <Route path="rx-validation" element={<RxValidation />} />
              <Route path="procurement" element={<Procurement />} />
              <Route path="grn" element={<GRNReceiving />} />
              <Route path="cold-store" element={<ColdStore />} />
              <Route path="treasury" element={<Treasury />} />
              <Route path="vat-returns" element={<VatReturns />} />
              <Route path="compliance" element={<Compliance />} />
              <Route path="hr-payroll" element={<HrPayroll />} />
              <Route path="customers" element={<Customers />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Patient Routes */}
            <Route path="/patient" element={
              <ProtectedRoute role="patient">
                <PatientLayout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<PatientDashboard />} />
              <Route path="search" element={<PatientSearch />} />
              <Route path="cart" element={<PatientCart />} />
              <Route path="profile" element={<PatientProfile />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </DatabaseProvider>
  );
}

export default App;

