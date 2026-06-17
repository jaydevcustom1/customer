import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Check, Copy, Printer, QrCode, Radio } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { useCart } from '../../context/CartContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const Receipt = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { settings, setLastReceipt } = useCart();

  const receiptNumber = searchParams.get('receipt');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const clientOrigin = window.location.origin;
  const trackUrl = `${clientOrigin}/track?receipt=${receiptNumber}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=0f172a&data=${encodeURIComponent(trackUrl)}`;

  useEffect(() => {
    if (!receiptNumber) {
      navigate('/');
      return;
    }

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${backendUrl}/api/orders/track/${receiptNumber}`);
        setOrder(res.data);
        // Save to last receipt context so user can track it later
        setLastReceipt(receiptNumber);
      } catch (err) {
        console.error('Fetch receipt error:', err);
        toast.error('Failed to load receipt information.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [receiptNumber]);

  const handleCopyReceipt = () => {
    navigator.clipboard.writeText(receiptNumber);
    toast.success('Receipt number copied to clipboard!');
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-5 md:max-w-md md:mx-auto bg-white animate-pulse">
        <div className="text-slate-400 font-semibold">Generating Receipt...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-5 text-center md:max-w-md md:mx-auto bg-white">
        <p className="text-slate-500 font-bold">Receipt not found</p>
        <Button variant="primary" className="mt-4" onClick={() => navigate('/')}>
          Return Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 fade-in max-w-7xl mx-auto px-4 py-4 md:py-8">
      {/* Header */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-100 z-30 px-5 py-4 flex items-center justify-between rounded-2xl shadow-sm mb-6 no-print">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/menu')} className="p-1 text-slate-500 hover:bg-slate-50 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-slate-800">Your Receipt</h1>
        </div>
        <button onClick={handlePrint} className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
          <Printer size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print-container">
        {/* Left Column (Success message & QR Code) */}
        <div className="space-y-6">
          {/* Receipt Header */}
          <div className="text-center space-y-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <Check size={26} />
            </div>
            <h2 className="text-base font-extrabold text-slate-800">Order Sent Successfully</h2>
            <p className="text-xs text-slate-400">Order is being sent to the kitchen.</p>
          </div>

          {/* QR Code Card */}
          <Card className="p-5 border-slate-100/50 flex flex-col items-center text-center no-print">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <img 
                src={qrCodeUrl} 
                alt="Receipt QR Code" 
                className="w-40 h-40 object-contain rounded-lg"
              />
            </div>
            <div className="mt-4">
              <h3 className="text-xs font-bold text-slate-700">Digital Receipt QR</h3>
              <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] leading-relaxed">
                Show this QR code to the cashier to look up your order or scan to track progress.
              </p>
            </div>
          </Card>

          {/* Live status check */}
          <div className="no-print">
            <Button
              variant="primary"
              size="lg"
              className="w-full text-sm font-semibold rounded-2xl shadow-lg shadow-primary-500/10 flex items-center justify-center gap-2 py-3"
              onClick={() => navigate(`/track?receipt=${order.receiptNumber}`)}
            >
              <Radio size={16} className="animate-pulse" /> Track Live Order Status
            </Button>
          </div>
        </div>

        {/* Right Column (Invoice Details) */}
        <div>
          {/* Invoice details */}
          <Card className="p-5 border-slate-100 border bg-slate-50/10 relative">
            {/* Receipt Number Badge */}
            <div className="flex justify-between items-center pb-4 border-b border-dashed border-slate-200">
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Receipt No.</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs font-extrabold text-slate-800">{order.receiptNumber}</span>
                  <button 
                    onClick={handleCopyReceipt}
                    className="text-slate-400 hover:text-slate-600 p-0.5 hover:bg-slate-100 rounded"
                  >
                    <Copy size={11} />
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Table</p>
                <span className="text-xs font-extrabold text-slate-800">{order.table?.tableNumber || 'Walk-In'}</span>
              </div>
            </div>

            {/* Items billing */}
            <div className="py-4 space-y-3 border-b border-dashed border-slate-200">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs font-medium">
                  <span className="text-slate-600 truncate pr-4">
                    <span className="font-bold text-slate-800 pr-1.5">{item.quantity}x</span>
                    {item.product?.name}
                  </span>
                  <span className="text-slate-800 font-bold shrink-0">
                    {settings.currency === 'USD' ? '$' : settings.currency}
                    {(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Pricing totals */}
            <div className="pt-4 space-y-2.5 text-xs text-slate-600 font-medium">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-slate-800">
                  {settings.currency === 'USD' ? '$' : settings.currency}
                  {(Number(order.total) / (1 + (Number(settings.tax) + Number(settings.serviceFee)) / 100)).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Service Fee ({settings.serviceFee}%)</span>
                <span className="text-slate-800">
                  {settings.currency === 'USD' ? '$' : settings.currency}
                  {((Number(order.total) / (1 + (Number(settings.tax) + Number(settings.serviceFee)) / 100)) * (Number(settings.serviceFee) / 100)).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tax ({settings.tax}%)</span>
                <span className="text-slate-800">
                  {settings.currency === 'USD' ? '$' : settings.currency}
                  {((Number(order.total) / (1 + (Number(settings.tax) + Number(settings.serviceFee)) / 100)) * (Number(settings.tax) / 100)).toFixed(2)}
                </span>
              </div>
              <div className="border-t border-slate-200 my-1" />
              <div className="flex justify-between text-sm font-extrabold text-slate-800">
                <span>Total Paid/Due</span>
                <span className="text-primary-500">
                  {settings.currency === 'USD' ? '$' : settings.currency}
                  {Number(order.total).toFixed(2)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Receipt;
