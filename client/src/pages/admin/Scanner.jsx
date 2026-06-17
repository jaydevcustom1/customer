import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, Camera, Eye, ShieldAlert, Check, RefreshCw, XCircle } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { useCart } from '../../context/CartContext';
import Card, { CardBody, CardHeader, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const Scanner = () => {
  const toast = useToast();
  const { settings } = useCart();

  const [scanResult, setScanResult] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [manualInput, setManualInput] = useState('');

  const scannerRef = useRef(null);
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    // Initialize html5-qrcode scanner
    const scanner = new Html5QrcodeScanner('qr-reader', {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
      supportedScanTypes: [0] // Camera scan only
    });

    scanner.render(onScanSuccess, onScanError);
    scannerRef.current = scanner;

    return () => {
      scanner.clear().catch(err => console.error('Failed to clear scanner:', err));
    };
  }, []);

  const onScanSuccess = (decodedText) => {
    setScanResult(decodedText);
    toast.success('QR Code Scanned Successfully!');
    // Extract receipt code
    let receiptCode = decodedText;
    if (decodedText.includes('receipt=')) {
      const url = new URL(decodedText);
      receiptCode = url.searchParams.get('receipt');
    }
    
    // Fetch details
    fetchOrderDetails(receiptCode);
  };

  const onScanError = (err) => {
    // Suppress console spamming since it triggers constantly during lookups
  };

  const fetchOrderDetails = async (receiptCode) => {
    try {
      setLoading(true);
      const res = await axios.get(`${backendUrl}/api/orders/track/${receiptCode}`);
      setOrder(res.data);
    } catch (err) {
      console.error('Fetch scanner order details error:', err);
      toast.error('Could not find order. Please verify receipt.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) {
      toast.warning('Please enter a receipt number');
      return;
    }
    fetchOrderDetails(manualInput.trim());
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('qr_admin_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const res = await axios.patch(`${backendUrl}/api/orders/${orderId}/status`, { status: newStatus }, config);
      setOrder(res.data);
      toast.success(`Order updated to: ${newStatus}`);
    } catch (err) {
      console.error('Scanner status change error:', err);
      toast.error('Failed to change ticket state.');
    }
  };

  const statusColors = {
    PENDING: 'bg-amber-50 border-amber-100 text-amber-600',
    PREPARING: 'bg-blue-50 border-blue-100 text-blue-600',
    READY: 'bg-emerald-50 border-emerald-100 text-emerald-600',
    COMPLETED: 'bg-slate-100 border-slate-200 text-slate-600',
    CANCELLED: 'bg-red-50 border-red-100 text-red-600'
  };

  return (
    <div className="p-8 space-y-8 font-sans overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Receipt QR Scanner</h1>
        <p className="text-xs text-slate-400 mt-1">Use the camera to scan customer receipt QR codes and load orders instantly.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Scanner reader camera module (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-slate-100/50 overflow-hidden">
            <CardHeader className="bg-slate-50/50">
              <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Camera size={16} className="text-primary-500" /> Camera Feed
              </h3>
            </CardHeader>
            <CardBody className="p-4 flex flex-col items-center bg-slate-900">
              <div id="qr-reader" className="w-full rounded-xl overflow-hidden border border-slate-800" />
            </CardBody>
          </Card>

          {/* Manual input */}
          <Card className="border-slate-100/50">
            <CardBody className="p-4">
              <form onSubmit={handleManualSearch} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Or enter receipt manually..."
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 text-xs px-3.5 py-2 rounded-xl focus:outline-none uppercase font-semibold"
                />
                <Button type="submit" variant="secondary" className="text-xs px-4 rounded-xl">
                  Search
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>

        {/* Order Details box (3 cols) */}
        <Card className="lg:col-span-3 border-slate-100/50 flex flex-col">
          <CardHeader>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Eye size={16} className="text-slate-400" /> Scanned Order Ticket
            </h3>
          </CardHeader>
          <CardBody className="flex-1">
            {loading ? (
              <div className="text-center py-24 text-slate-400">Loading receipt details...</div>
            ) : !order ? (
              <div className="text-center py-24 text-slate-400 flex flex-col items-center gap-2">
                <QrCode size={40} className="text-slate-200" />
                <p className="text-xs font-bold">No Order Loaded</p>
                <p className="text-[10px] text-slate-400 max-w-xs">
                  Scan a digital receipt QR code or enter a receipt number manually to load POS controls.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Invoice stats */}
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Receipt</span>
                    <h2 className="text-sm font-black text-slate-800 mt-0.5">{order.receiptNumber}</h2>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Table</span>
                    <span className="text-sm font-black text-slate-800">{order.table?.tableNumber || 'Walk-In'}</span>
                  </div>
                </div>

                {/* Details layout */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <p className="text-slate-400 font-bold uppercase">Customer Name</p>
                    <p className="font-bold text-slate-800 mt-0.5">{order.customerName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase">Status</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold mt-1 border ${statusColors[order.status]}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-200">
                    <p className="text-slate-400 font-bold uppercase">Kitchen Notes</p>
                    <p className="font-semibold text-slate-500 mt-0.5">"{order.notes || 'No special requests'}"</p>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Ordered Items</h4>
                  <div className="divide-y divide-slate-100">
                    {order.items.map((item) => (
                      <div key={item.id} className="py-2.5 flex justify-between items-center text-xs">
                        <span className="text-slate-600 font-semibold">
                          <span className="text-primary-500 font-black pr-1.5">{item.quantity}x</span>
                          {item.product?.name}
                        </span>
                        <span className="font-bold text-slate-800">
                          {settings.currency === 'USD' ? '$' : settings.currency}
                          {(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-sm font-extrabold">
                  <span className="text-slate-500">Invoice Total</span>
                  <span className="text-primary-500">
                    {settings.currency === 'USD' ? '$' : settings.currency}
                    {Number(order.total).toFixed(2)}
                  </span>
                </div>

                {/* Ticket Controls */}
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Change Status Controls</h4>
                  <div className="flex flex-wrap gap-2">
                    {order.status === 'PENDING' && (
                      <Button
                        variant="primary"
                        className="text-xs font-bold rounded-xl bg-blue-500 hover:bg-blue-600 py-2 px-4 flex items-center gap-1"
                        onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                      >
                        Start Preparing
                      </Button>
                    )}
                    {order.status === 'PREPARING' && (
                      <Button
                        variant="primary"
                        className="text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-600 py-2 px-4 flex items-center gap-1"
                        onClick={() => handleUpdateStatus(order.id, 'READY')}
                      >
                        Mark Ready
                      </Button>
                    )}
                    {order.status === 'READY' && (
                      <Button
                        variant="primary"
                        className="text-xs font-bold rounded-xl bg-slate-700 hover:bg-slate-800 py-2 px-4 flex items-center gap-1"
                        onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                      >
                        Complete Order
                      </Button>
                    )}
                    {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                      <Button
                        variant="danger"
                        className="text-xs font-bold rounded-xl py-2 px-4 flex items-center gap-1"
                        onClick={() => handleUpdateStatus(order.id, 'CANCELLED')}
                      >
                        Cancel Ticket
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default Scanner;
