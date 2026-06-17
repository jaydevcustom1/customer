import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  CookingPot, 
  MenuSquare, 
  Layers, 
  Package, 
  TableProperties, 
  QrCode, 
  FileText, 
  History, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { useCart } from '../../context/CartContext';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useCart();

  const menuItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
    { label: 'Orders', path: '/admin/orders', icon: <ShoppingBag size={18} /> },
    { label: 'Kitchen (KDS)', path: '/admin/kds', icon: <CookingPot size={18} /> },
    { label: 'Menu Items', path: '/admin/menu', icon: <MenuSquare size={18} /> },
    { label: 'Inventory', path: '/admin/inventory', icon: <Package size={18} /> },
    { label: 'Tables', path: '/admin/tables', icon: <TableProperties size={18} /> },
    { label: 'Receipt Scanner', path: '/admin/scanner', icon: <QrCode size={18} /> },
    { label: 'Reports', path: '/admin/reports', icon: <FileText size={18} /> },
    { label: 'Audit Logs', path: '/admin/audit', icon: <History size={18} /> },
    { label: 'Settings', path: '/admin/settings', icon: <Settings size={18} /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem('qr_admin_token');
    localStorage.removeItem('qr_admin_user');
    navigate('/admin/login');
  };

  const activeUser = JSON.parse(localStorage.getItem('qr_admin_user') || '{}');

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col h-screen shrink-0 font-sans">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3 bg-slate-950/20">
        <div className="h-9 w-9 bg-primary-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/20 font-black">
          POS
        </div>
        <div>
          <h1 className="text-sm font-black text-white leading-tight uppercase tracking-wide truncate">
            {settings.restaurantName}
          </h1>
          <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase block">
            Management Portal
          </span>
        </div>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-primary-500 text-white shadow-md shadow-primary-500/10'
                  : 'hover:bg-slate-800 hover:text-white text-slate-400'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/20 flex flex-col gap-2">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="h-8 w-8 bg-slate-800 rounded-full flex items-center justify-center text-slate-300 font-bold text-xs">
            {activeUser.name ? activeUser.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white truncate leading-tight">{activeUser.name || 'Admin User'}</h4>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{activeUser.role || 'ADMIN'}</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 mt-1 text-xs font-bold rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
