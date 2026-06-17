import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Menu, ShoppingBag, Radio } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems } = useCart();

  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const navItems = [
    { label: 'Home', path: '/', icon: <Home size={20} /> },
    { label: 'Menu', path: '/menu', icon: <Menu size={20} /> },
    { label: 'Cart', path: '/cart', icon: <ShoppingBag size={20} />, badge: totalItems },
    { label: 'Track', path: '/track', icon: <Radio size={20} /> },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/85 backdrop-blur-md border-t border-slate-100 z-40 md:hidden shadow-lg">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center w-full h-full relative transition-colors ${
                isActive ? 'text-primary-500 font-semibold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {item.badge > 0 && (
                <span className="absolute top-2 right-1/2 translate-x-4 bg-primary-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-white">
                  {item.badge}
                </span>
              )}
              {item.icon}
              <span className="text-[10px] mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
