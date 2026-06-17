import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckSquare, Clipboard, ClipboardList, Info, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const Checkout = () => {
  const { 
    cartItems, 
    tableNumber, 
    tableId, 
    checkout, 
    subtotal, 
    taxAmount, 
    serviceFeeAmount, 
    total,
    settings 
  } = useCart();

  const navigate = useNavigate();
  const toast = useToast();

  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!tableId) {
      toast.error('No table session found. Please scan the QR code at your table.');
      return;
    }

    try {
      setLoading(true);
      const order = await checkout(customerName, notes);
      toast.success('Order placed successfully!');
      // Navigate to receipt tracking page
      navigate(`/receipt?receipt=${order.receiptNumber}`);
    } catch (err) {
      toast.error(err.message || 'Failed to place order.');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-5 text-center md:max-w-md md:mx-auto md:shadow-2xl bg-white">
        <h2 className="text-lg font-bold text-slate-800 font-sans">No items to checkout</h2>
        <Button variant="primary" className="mt-4" onClick={() => navigate('/menu')}>
          Return to Menu
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 fade-in max-w-7xl mx-auto px-4 py-4 md:py-8">
      {/* Header */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-100 z-30 px-5 py-4 flex items-center gap-4 rounded-2xl shadow-sm mb-6">
        <button onClick={() => navigate('/cart')} className="p-1 text-slate-500 hover:bg-slate-50 rounded-lg">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-slate-800">Checkout Order</h1>
      </div>

      <form onSubmit={handlePlaceOrder} className="mt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column (Inputs and Table Info) */}
          <div className="md:col-span-2 space-y-6">
            {/* Table information */}
            <Card className="p-4 bg-primary-50/30 border-primary-100/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary-500 rounded-xl text-white flex items-center justify-center font-bold">
                  {tableNumber ? tableNumber.replace('Table ', '') : '?'}
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">Dining Table</p>
                  <h3 className="text-sm font-bold text-slate-800">{tableNumber || 'Walk-In Session'}</h3>
                </div>
              </div>
            </Card>

            {/* Inputs */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Your Name <span className="text-slate-400">(Optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="E.g., John Doe"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 text-sm pl-10 pr-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Order Notes <span className="text-slate-400">(Optional)</span>
                </label>
                <div className="relative">
                  <span className="absolute top-3.5 left-3.5 text-slate-400">
                    <ClipboardList size={16} />
                  </span>
                  <textarea
                    placeholder="E.g., No onions, extra cheese, sauce on side..."
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 text-sm pl-10 pr-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (Summary & Action) */}
          <div className="space-y-6">
            {/* Items Summary */}
            <Card className="p-4 border border-slate-100 space-y-4">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Items</h3>
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.product.id} className="flex justify-between items-center text-xs text-slate-700 font-medium">
                    <div className="truncate pr-4 flex items-center gap-1.5">
                      <span className="text-primary-500 font-bold bg-primary-50 px-1.5 py-0.5 rounded">
                        {item.quantity}x
                      </span>
                      <span className="truncate">{item.product.name}</span>
                    </div>
                    <span className="font-bold text-slate-800 shrink-0">
                      {settings.currency === 'USD' ? '$' : settings.currency}
                      {(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Total details */}
            <div className="space-y-2.5 text-xs text-slate-600 font-medium bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>
                  {settings.currency === 'USD' ? '$' : settings.currency}
                  {subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Service Charge ({settings.serviceFee}%)</span>
                <span>
                  {settings.currency === 'USD' ? '$' : settings.currency}
                  {serviceFeeAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tax ({settings.tax}%)</span>
                <span>
                  {settings.currency === 'USD' ? '$' : settings.currency}
                  {taxAmount.toFixed(2)}
                </span>
              </div>
              <div className="border-t border-dashed border-slate-200 my-2" />
              <div className="flex justify-between text-sm font-extrabold text-slate-800">
                <span>Total Amount</span>
                <span className="text-primary-500">
                  {settings.currency === 'USD' ? '$' : settings.currency}
                  {total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full text-sm font-semibold rounded-2xl shadow-lg shadow-primary-500/10 py-3"
              loading={loading}
            >
              Send to Kitchen
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
