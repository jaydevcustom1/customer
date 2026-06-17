import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Trash2, Plus, Minus } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const Cart = () => {
  const { 
    cartItems, 
    updateQuantity, 
    removeFromCart, 
    subtotal, 
    taxAmount, 
    serviceFeeAmount, 
    total,
    settings 
  } = useCart();

  const navigate = useNavigate();
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20 flex flex-col items-center justify-center p-5 text-center max-w-7xl mx-auto px-4">
        <div className="h-16 w-16 bg-primary-50 rounded-full flex items-center justify-center text-primary-500 mb-4 animate-bounce">
          <ShoppingBag size={28} />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Your Cart is Empty</h2>
        <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
          Looks like you haven't added anything to your cart yet. Scan the table QR or explore our menu to order.
        </p>
        <Button 
          variant="primary" 
          size="md" 
          className="mt-6 font-semibold rounded-xl shadow-md shadow-primary-500/10"
          onClick={() => navigate('/menu')}
        >
          Go To Menu
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28 fade-in max-w-7xl mx-auto px-4 py-4 md:py-8">
      {/* Header */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-100 z-30 px-5 py-4 flex items-center gap-4 rounded-2xl shadow-sm mb-6">
        <button onClick={() => navigate('/menu')} className="p-1 text-slate-500 hover:bg-slate-50 rounded-lg">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-slate-800">Review Cart</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Cart items list (Spans 2 columns on desktop) */}
        <div className="md:col-span-2 space-y-3">
          {cartItems.map((item) => (
            <Card key={item.product.id} className="p-3 border border-slate-100 flex items-center gap-3">
              {/* Image */}
              <div className="h-16 w-16 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                {item.product.image ? (
                  <img 
                    src={item.product.image.startsWith('/uploads/') ? `${backendUrl}${item.product.image}` : item.product.image} 
                    alt={item.product.name} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-primary-50 text-primary-400 font-bold text-[10px]">
                    No Image
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-800 truncate leading-tight">{item.product.name}</h3>
                <p className="text-xs font-semibold text-primary-500 mt-1">
                  {settings.currency === 'USD' ? '$' : settings.currency}
                  {item.product.price.toFixed(2)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col items-end gap-2.5">
                <button 
                  onClick={() => removeFromCart(item.product.id)}
                  className="text-slate-400 hover:text-red-500 p-1"
                >
                  <Trash2 size={14} />
                </button>

                <div className="flex items-center gap-2.5 bg-slate-50 p-1 rounded-lg border border-slate-100/50">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="h-6 w-6 rounded bg-white shadow-sm flex items-center justify-center text-slate-600 active:scale-95"
                  >
                    <Minus size={10} />
                  </button>
                  <span className="text-xs font-bold w-4 text-center text-slate-700">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    className="h-6 w-6 rounded bg-white shadow-sm flex items-center justify-center text-slate-600 active:scale-95"
                  >
                    <Plus size={10} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Bill summary (Spans 1 column on desktop) */}
        <div className="space-y-4">
          <Card className="p-4 border-slate-100/50 bg-slate-50/20">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">Order Summary</h3>
            <div className="space-y-2.5 text-xs text-slate-600 font-medium">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-slate-800">
                  {settings.currency === 'USD' ? '$' : settings.currency}
                  {subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Service Charge ({settings.serviceFee}%)</span>
                <span className="text-slate-800">
                  {settings.currency === 'USD' ? '$' : settings.currency}
                  {serviceFeeAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tax ({settings.tax}%)</span>
                <span className="text-slate-800">
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
          </Card>

          {/* Desktop Only Checkout Action */}
          <div className="hidden md:block">
            <Button
              variant="primary"
              size="lg"
              className="w-full text-sm font-semibold rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/10 py-3"
              onClick={() => navigate('/checkout')}
            >
              Checkout Order
            </Button>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Checkout Action (Mobile Only) */}
      <div className="fixed bottom-16 left-0 right-0 p-5 bg-white border-t border-slate-100 z-40 md:hidden shadow-lg">
        <Button
          variant="primary"
          size="lg"
          className="w-full text-sm font-semibold rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/10"
          onClick={() => navigate('/checkout')}
        >
          Checkout Order
        </Button>
      </div>
    </div>
  );
};

export default Cart;
