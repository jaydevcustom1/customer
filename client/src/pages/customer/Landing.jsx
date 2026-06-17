import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowRight, QrCode, Sparkles, Utensils, Zap } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import Button from '../../components/ui/Button';

const Landing = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { tableNumber, setTable, settings } = useCart();

  useEffect(() => {
    const tableParam = searchParams.get('table');
    if (tableParam) {
      // Typically, table ID is fetched from matching tableNumber.
      // For instant setup, we will associate it.
      // We will look up or assume a table ID. To make it robust, we'll fetch tables first.
      // But for simplicity, we mock tableId == tableNumber, and later resolve it in the DB.
      // Let's call the API to find the table matching tableParam name:
      const fetchTable = async () => {
        try {
          const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
          const res = await fetch(`${backendUrl}/api/tables`);
          const tables = await res.json();
          const match = tables.find(t => t.tableNumber.toLowerCase() === tableParam.toLowerCase());
          if (match) {
            setTable(match.tableNumber, match.id);
          } else {
            // Default fallback if table is not in database yet (e.g. Table 1)
            setTable(tableParam, tableParam);
          }
        } catch (e) {
          console.warn('Could not match table from database:', e);
          setTable(tableParam, tableParam);
        }
      };
      fetchTable();
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-slate-50 pb-20 fade-in relative max-w-7xl mx-auto px-4 py-4 md:py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left Column: Visual Banner & Table welcome card */}
        <div className="space-y-6">
          {/* Hero Header */}
          <div className="relative h-64 md:h-96 overflow-hidden rounded-[2rem] shadow-lg">
            <img 
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80" 
              alt="Bistro Interior" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />
            
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <div className="inline-flex items-center gap-1 bg-primary-500 text-white text-xs px-2.5 py-1 rounded-full font-semibold mb-3">
                <Sparkles size={12} />
                Instant Digital Dining
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{settings.restaurantName}</h1>
              <p className="text-slate-300 text-xs mt-1 font-medium">Premium QR Ordering System</p>
            </div>
          </div>

          {/* Table Welcome Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-500">
                <Utensils size={22} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">YOUR TABLE</p>
                <h2 className="text-base font-bold text-slate-800">
                  {tableNumber ? tableNumber : 'Walk-In Customer'}
                </h2>
              </div>
            </div>
            {tableNumber ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg">
                <Zap size={10} /> Active Session
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 max-w-[120px] text-right font-medium leading-tight">
                Scan table QR code to pre-select table
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Instructions and CTA */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-150/45 shadow-sm space-y-8">
          {/* Steps Instructions */}
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-5">How it works</h3>
            <div className="space-y-5">
              {[
                {
                  step: '1',
                  title: 'Browse & Choose',
                  desc: 'Browse our visual digital menu and add your favorite dishes to the cart.',
                  icon: <Utensils size={16} />
                },
                {
                  step: '2',
                  title: 'Place Order',
                  desc: 'Confirm your order, enter your name and table number (filled automatically).',
                  icon: <QrCode size={16} />
                },
                {
                  step: '3',
                  title: 'Track Real-time',
                  desc: 'Watch the kitchen update your order status from preparation to ready to serve.',
                  icon: <Zap size={16} />
                }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="h-9 w-9 rounded-lg bg-slate-100 font-bold text-slate-700 flex items-center justify-center text-xs shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{item.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Call to Action */}
          <div>
            <Button 
              variant="primary" 
              size="lg" 
              className="w-full text-sm font-semibold rounded-2xl shadow-lg shadow-primary-500/10 flex items-center justify-center gap-2"
              onClick={() => navigate('/menu')}
            >
              Explore the Menu <ArrowRight size={16} />
            </Button>
          </div>

          {/* Contact info */}
          <div className="text-center text-slate-400 text-[11px] leading-relaxed pt-4 border-t border-slate-100">
            <p className="font-semibold text-slate-500">{settings.restaurantName}</p>
            <p className="mt-0.5">{settings.address || '742 Evergreen Terrace'}</p>
            <p className="mt-0.5">Phone: {settings.phone || '+1 (555) 762-3849'}</p>
            <p className="mt-6 text-[10px] text-slate-350">© 2026 QR Menu ordering system. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
