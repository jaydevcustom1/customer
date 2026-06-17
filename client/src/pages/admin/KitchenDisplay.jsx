import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CookingPot, Check, Flame, Clock, RefreshCw } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../components/ui/Toast';
import Card, { CardBody, CardHeader, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const KitchenDisplay = () => {
  const { socket } = useSocket();
  const toast = useToast();

  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchActiveOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('qr_admin_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const res = await axios.get(`${backendUrl}/api/orders`, config);
      // We only show active kitchen tickets: PENDING, PREPARING, READY
      const kitchenTickets = res.data.filter(
        (order) => order.status === 'PENDING' || order.status === 'PREPARING' || order.status === 'READY'
      );
      setActiveOrders(kitchenTickets);
    } catch (err) {
      console.error('Fetch active orders error:', err);
      toast.error('Failed to load active kitchen tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveOrders();
  }, []);

  // Listen to live socket events for incoming orders and status updates
  useEffect(() => {
    if (!socket) return;

    socket.emit('join-room', 'kitchen');

    const handleNewOrder = (order) => {
      // Add if active status
      if (order.status === 'PENDING' || order.status === 'PREPARING' || order.status === 'READY') {
        setActiveOrders((prev) => [order, ...prev]);
        toast.info(`New KDS Order: ${order.table?.tableNumber || 'Walk-In'}`);
        
        // Bell sound
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav');
        audio.play().catch(e => console.log('Audio autoplay blocked'));
      }
    };

    const handleStatusUpdate = (updatedOrder) => {
      // If it is now COMPLETED or CANCELLED, remove it from active KDS tickets
      if (updatedOrder.status === 'COMPLETED' || updatedOrder.status === 'CANCELLED') {
        setActiveOrders((prev) => prev.filter((ord) => ord.id !== updatedOrder.id));
      } else {
        // Otherwise, update its status in the list
        setActiveOrders((prev) => {
          const exists = prev.some(ord => ord.id === updatedOrder.id);
          if (exists) {
            return prev.map(ord => ord.id === updatedOrder.id ? updatedOrder : ord);
          } else {
            return [updatedOrder, ...prev];
          }
        });
      }
    };

    socket.on('new-order', handleNewOrder);
    socket.on('order-status-updated', handleStatusUpdate);

    return () => {
      socket.emit('leave-room', 'kitchen');
      socket.off('new-order', handleNewOrder);
      socket.off('order-status-updated', handleStatusUpdate);
    };
  }, [socket]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('qr_admin_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const res = await axios.patch(`${backendUrl}/api/orders/${orderId}/status`, { status: newStatus }, config);
      
      // Updates local state
      if (newStatus === 'COMPLETED' || newStatus === 'CANCELLED') {
        setActiveOrders(prev => prev.filter(o => o.id !== orderId));
      } else {
        setActiveOrders(prev => prev.map(o => o.id === orderId ? res.data : o));
      }

      toast.success(`Ticket marked as ${newStatus}`);
    } catch (err) {
      console.error('KDS status change error:', err);
      toast.error('Failed to change ticket state.');
    }
  };

  const getTimeElapsed = (dateString) => {
    const diffMs = new Date() - new Date(dateString);
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    return `${diffMins}m ago`;
  };

  // Live timer tick to update minutes elapsed
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="p-8 space-y-8 font-sans overflow-y-auto max-h-[calc(100vh-4rem)] bg-slate-900 min-h-[calc(100vh-4rem)] text-slate-100">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary-500 rounded-xl flex items-center justify-center text-white">
            <CookingPot size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">Kitchen Display (KDS)</h1>
            <p className="text-xs text-slate-500 mt-0.5">Real-time orders queue for kitchen preparation.</p>
          </div>
        </div>
        <button 
          onClick={fetchActiveOrders}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold"
        >
          <RefreshCw size={14} /> Reload
        </button>
      </div>

      {/* Grid of cards */}
      {loading ? (
        <div className="text-center py-20 text-slate-500">Loading active tickets...</div>
      ) : activeOrders.length === 0 ? (
        <div className="text-center py-32 text-slate-500 bg-slate-950/20 border border-dashed border-slate-800 rounded-2xl">
          <p className="text-sm font-semibold">No Active Cooking Tickets</p>
          <p className="text-xs mt-1">Pending orders placed by customers will appear here automatically.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {activeOrders.map((order) => {
            const isPending = order.status === 'PENDING';
            const isPreparing = order.status === 'PREPARING';
            const isReady = order.status === 'READY';

            let borderStyle = 'border-slate-800 bg-slate-950/60';
            let statusLabel = 'Pending';
            let statusBg = 'bg-amber-500/10 text-amber-400 border-amber-500/20';

            if (isPreparing) {
              borderStyle = 'border-blue-500/30 bg-slate-950/60 shadow-lg shadow-blue-500/5';
              statusLabel = 'Preparing';
              statusBg = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            } else if (isReady) {
              borderStyle = 'border-emerald-500/30 bg-slate-950/60 shadow-lg shadow-emerald-500/5';
              statusLabel = 'Ready';
              statusBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            }

            return (
              <Card key={order.id} className={`flex flex-col border rounded-2xl overflow-hidden hover:shadow-2xl transition-all ${borderStyle}`}>
                {/* Card Header */}
                <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-black text-white">{order.table?.tableNumber || 'Walk-In'}</h2>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase">{order.receiptNumber}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold border ${statusBg}`}>
                      {statusLabel}
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                      <Clock size={10} /> {getTimeElapsed(order.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Card Content - Items */}
                <CardBody className="flex-1 p-4 space-y-3.5 max-h-56 overflow-y-auto">
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-300">
                          <span className="text-primary-500 font-black pr-2 text-sm">{item.quantity}x</span>
                          {item.product?.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <div className="bg-red-500/5 p-2.5 rounded-xl border border-red-500/10 text-[10px] text-red-300 font-bold leading-normal">
                      <span className="text-red-400 block mb-0.5 uppercase tracking-wide">SPECIAL NOTE:</span>
                      "{order.notes}"
                    </div>
                  )}
                </CardBody>

                {/* Card Footer Actions */}
                <CardFooter className="p-3 border-t border-slate-800 bg-slate-950/30 justify-stretch">
                  {isPending && (
                    <Button
                      variant="primary"
                      className="w-full text-xs font-extrabold rounded-xl py-2 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                    >
                      <Flame size={14} /> Start Cooking
                    </Button>
                  )}
                  {isPreparing && (
                    <Button
                      variant="primary"
                      className="w-full text-xs font-extrabold rounded-xl py-2 flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => handleUpdateStatus(order.id, 'READY')}
                    >
                      <Check size={14} /> Mark Ready
                    </Button>
                  )}
                  {isReady && (
                    <Button
                      variant="primary"
                      className="w-full text-xs font-extrabold rounded-xl py-2 flex items-center justify-center gap-1 bg-slate-700 hover:bg-slate-600"
                      onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                    >
                      Complete & Serve
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default KitchenDisplay;
