import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Clock, CookingPot, CheckCircle2, ShoppingBag, XCircle, Search, Sparkles } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../components/ui/Toast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const TrackOrder = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { joinRoom, leaveRoom, socket } = useSocket();
  const { lastReceipt, settings } = useCart();

  const urlReceipt = searchParams.get('receipt');
  const [receiptInput, setReceiptInput] = useState('');
  const [receiptNumber, setReceiptNumber] = useState(urlReceipt || lastReceipt || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchOrder = async (recNum) => {
    try {
      setLoading(true);
      const res = await axios.get(`${backendUrl}/api/orders/track/${recNum}`);
      setOrder(res.data);
    } catch (err) {
      console.error('Fetch track order error:', err);
      toast.error('Could not find order. Please verify your receipt number.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (receiptNumber) {
      fetchOrder(receiptNumber);
    }
  }, [receiptNumber]);

  // Handle Socket.IO connection and rooms joining
  useEffect(() => {
    if (!receiptNumber || !socket) return;

    const roomName = `order:${receiptNumber}`;
    joinRoom(roomName);

    const handleStatusUpdate = (updatedOrder) => {
      if (updatedOrder.receiptNumber === receiptNumber) {
        setOrder(updatedOrder);
        toast.info(`Order status updated to: ${updatedOrder.status}`);
        
        // Ring custom audio or trigger haptic
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
      }
    };

    socket.on('order-status-updated', handleStatusUpdate);

    return () => {
      leaveRoom(roomName);
      socket.off('order-status-updated', handleStatusUpdate);
    };
  }, [receiptNumber, socket]);

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (!receiptInput.trim()) {
      toast.warning('Please enter a valid receipt number');
      return;
    }
    setReceiptNumber(receiptInput.trim());
  };

  const getStatusStepIndex = (status) => {
    const steps = ['PENDING', 'PREPARING', 'READY', 'COMPLETED'];
    return steps.indexOf(status);
  };

  const statusMeta = {
    PENDING: {
      title: 'Order Received',
      desc: 'We have received your order. Waiting for kitchen confirmation.',
      color: 'text-amber-500 bg-amber-50 border-amber-200',
      icon: <Clock size={24} className="text-amber-500" />
    },
    PREPARING: {
      title: 'Preparing',
      desc: 'Our chefs are crafting your dishes right now.',
      color: 'text-blue-500 bg-blue-50 border-blue-200',
      icon: <CookingPot size={24} className="text-blue-500 animate-bounce" />
    },
    READY: {
      title: 'Ready to Serve',
      desc: 'Your food is ready! A waiter will bring it to your table shortly.',
      color: 'text-emerald-500 bg-emerald-50 border-emerald-200 status-pulse',
      icon: <Sparkles size={24} className="text-emerald-500" />
    },
    COMPLETED: {
      title: 'Completed',
      desc: 'Order completed. We hope you enjoyed your meal!',
      color: 'text-slate-500 bg-slate-50 border-slate-200',
      icon: <CheckCircle2 size={24} className="text-slate-600" />
    },
    CANCELLED: {
      title: 'Cancelled',
      desc: 'This order has been cancelled. Please speak to our staff.',
      color: 'text-red-500 bg-red-50 border-red-200',
      icon: <XCircle size={24} className="text-red-500" />
    }
  };

  // If no order is selected / loaded, show search input
  if (!receiptNumber || !order) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20 flex flex-col items-center justify-center p-5 max-w-7xl mx-auto">
        <div className="w-full max-w-md space-y-6 bg-white p-6 md:p-8 rounded-3xl border border-slate-150/45 shadow-sm">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Track Your Order</h2>
            <p className="text-xs text-slate-400">Enter your receipt number below to track in real-time.</p>
          </div>

          <form onSubmit={handleManualSearch} className="space-y-3">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="E.g., REC-260617-1024"
                value={receiptInput}
                onChange={(e) => setReceiptInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 text-sm pl-10 pr-4 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all uppercase"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-semibold rounded-2xl shadow-lg shadow-primary-500/10"
              loading={loading}
            >
              Track Order
            </Button>
          </form>

          <div className="text-center">
            <Button variant="ghost" size="sm" onClick={() => navigate('/menu')} className="text-xs text-slate-400">
              Return to Menu
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentStatus = order.status;
  const stepIndex = getStatusStepIndex(currentStatus);
  const isCancelled = currentStatus === 'CANCELLED';

  return (
    <div className="min-h-screen bg-slate-50 pb-24 fade-in max-w-7xl mx-auto px-4 py-4 md:py-8">
      {/* Header */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-100 z-30 px-5 py-4 flex items-center justify-between rounded-2xl shadow-sm mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              // Reset receipt number state to trigger search view
              setOrder(null);
              setReceiptNumber('');
            }} 
            className="p-1 text-slate-500 hover:bg-slate-50 rounded-lg"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-slate-800">Track Order</h1>
        </div>
        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
          {order.table?.tableNumber || 'Walk-In'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column (Status & Progress) */}
        <div className="space-y-6">
          {/* Status Card Banner */}
          <Card className={`p-5 border ${statusMeta[currentStatus]?.color}`}>
            <div className="flex items-center gap-4">
              <div className="shrink-0">{statusMeta[currentStatus]?.icon}</div>
              <div>
                <h2 className="text-sm font-extrabold">{statusMeta[currentStatus]?.title}</h2>
                <p className="text-[11px] opacity-80 mt-0.5 leading-relaxed">{statusMeta[currentStatus]?.desc}</p>
              </div>
            </div>
          </Card>

          {/* Tracking Progress Stepper (Only if not cancelled) */}
          {!isCancelled && (
            <Card className="p-5 border-slate-100 animate-fade-in bg-white">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-5">Order Progress</h3>
              <div className="relative pl-6 border-l border-slate-100 space-y-6">
                {[
                  { label: 'Order Received', desc: 'Sent to KDS screen' },
                  { label: 'Preparing', desc: 'Chefs cooking meal' },
                  { label: 'Ready to Serve', desc: 'Order plated and ready' },
                  { label: 'Completed', desc: 'Delivered to table' }
                ].map((step, idx) => {
                  const isCompleted = stepIndex >= idx;
                  const isCurrent = stepIndex === idx;

                  return (
                    <div key={idx} className="relative">
                      {/* Circle bullet */}
                      <span className={`absolute -left-[31px] top-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all ${
                        isCompleted 
                          ? 'bg-primary-500 border-primary-500 text-white' 
                          : 'bg-white border-slate-200'
                      }`}>
                        {isCompleted && <span className="h-1.5 w-1.5 bg-white rounded-full" />}
                      </span>

                      <div className="transition-all">
                        <h4 className={`text-xs font-bold ${
                          isCurrent ? 'text-primary-500' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                        }`}>
                          {step.label}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column (Order Invoice Details) */}
        <div>
          <Card className="p-5 border-slate-100 bg-slate-50/10">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">Order Details</h3>
            
            {/* Items */}
            <div className="space-y-3 pb-4 border-b border-dashed border-slate-200">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs font-medium">
                  <span className="text-slate-600">
                    <span className="font-bold text-slate-800 pr-1">{item.quantity}x</span>
                    {item.product?.name}
                  </span>
                  <span className="text-slate-800 font-bold shrink-0">
                    {settings.currency === 'USD' ? '$' : settings.currency}
                    {(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 flex justify-between text-xs font-bold text-slate-800">
              <span>Total Paid</span>
              <span className="text-primary-500 font-extrabold">
                {settings.currency === 'USD' ? '$' : settings.currency}
                {Number(order.total).toFixed(2)}
              </span>
            </div>

            {order.notes && (
              <div className="mt-3.5 bg-slate-100/50 p-2.5 rounded-xl border border-slate-200/30 text-[11px] text-slate-500 font-medium">
                <span className="font-bold text-slate-700 block mb-0.5">Notes:</span>
                "{order.notes}"
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;
