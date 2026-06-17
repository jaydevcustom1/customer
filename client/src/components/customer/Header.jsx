import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Shield, HelpCircle } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, settings } = useCart();

  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Menu', path: '/menu' },
    { label: 'Track Order', path: '/track' },
  ];

  return (
    <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-50 hidden md:block">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="h-9 w-9 bg-primary-500 rounded-xl flex items-center justify-center text-white font-black shadow-md shadow-primary-500/10">
            GP
          </div>
          <span className="font-extrabold text-slate-800 tracking-tight text-base uppercase">
            {settings.restaurantName}
          </span>
        </div>

        {/* Center Links */}
        <nav className="flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`text-xs font-bold transition-colors ${
                  isActive ? 'text-primary-500' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Right side items (Cart, POS Login) */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/cart')}
            className="relative h-10 w-10 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center border border-slate-150/40 transition-colors"
          >
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-primary-500 text-white text-[9px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white">
                {totalItems}
              </span>
            )}
            <ShoppingBag size={16} />
          </button>

          <div className="h-4 w-px bg-slate-200" />

          <button
            onClick={() => navigate('/admin/login')}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
          >
            <Shield size={13} />
            Staff Sign In
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
