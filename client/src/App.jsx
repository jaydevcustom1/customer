import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Context Providers
import { CartProvider } from './context/CartContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider } from './components/ui/Toast';

// Customer Pages
import Landing from './pages/customer/Landing';
import Menu from './pages/customer/Menu';
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import Receipt from './pages/customer/Receipt';
import TrackOrder from './pages/customer/TrackOrder';
import BottomNav from './components/customer/BottomNav';
import Header from './components/customer/Header';

// Admin Pages
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Orders from './pages/admin/Orders';
import KitchenDisplay from './pages/admin/KitchenDisplay';
import MenuManagement from './pages/admin/MenuManagement';
import Inventory from './pages/admin/Inventory';
import Tables from './pages/admin/Tables';
import Scanner from './pages/admin/Scanner';
import Reports from './pages/admin/Reports';
import AuditLogs from './pages/admin/AuditLogs';
import Settings from './pages/admin/Settings';

// Admin layout components
import Sidebar from './components/admin/Sidebar';
import TopNavbar from './components/admin/TopNavbar';

// Route Guard for Admin
const AdminProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('qr_admin_token');
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

// Customer Layout Wrapper (Adds top header on desktop and bottom navigation on mobile viewports)
const CustomerLayout = ({ children }) => {
  const location = useLocation();
  const hideNav = location.pathname === '/receipt' && window.matchMedia('print').matches;

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
};

// Admin Layout Grid
const AdminLayout = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar />
        <div className="flex-1 bg-slate-50 overflow-hidden">
          <Routes>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="orders" element={<Orders />} />
            <Route path="kds" element={<KitchenDisplay />} />
            <Route path="menu" element={<MenuManagement />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="tables" element={<Tables />} />
            <Route path="scanner" element={<Scanner />} />
            <Route path="reports" element={<Reports />} />
            <Route path="audit" element={<AuditLogs />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <ToastProvider>
      <CartProvider>
        <SocketProvider>
          <Router>
            <Routes>
              {/* Customer Routes */}
              <Route path="/" element={<CustomerLayout><Landing /></CustomerLayout>} />
              <Route path="/menu" element={<CustomerLayout><Menu /></CustomerLayout>} />
              <Route path="/cart" element={<CustomerLayout><Cart /></CustomerLayout>} />
              <Route path="/checkout" element={<CustomerLayout><Checkout /></CustomerLayout>} />
              <Route path="/receipt" element={<CustomerLayout><Receipt /></CustomerLayout>} />
              <Route path="/track" element={<CustomerLayout><TrackOrder /></CustomerLayout>} />

              {/* Admin Login Route */}
              <Route path="/admin/login" element={<Login />} />

              {/* Protected Admin Routes */}
              <Route 
                path="/admin/*" 
                element={
                  <AdminProtectedRoute>
                    <AdminLayout />
                  </AdminProtectedRoute>
                } 
              />

              {/* Catch-all fallback redirects to Customer Landing */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </SocketProvider>
      </CartProvider>
    </ToastProvider>
  );
}

export default App;
