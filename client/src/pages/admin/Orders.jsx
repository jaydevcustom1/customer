import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Eye, RefreshCw, Check, AlertTriangle, XCircle, Search, Calendar, ChevronRight 
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../components/ui/Toast';
import { useCart } from '../../context/CartContext';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Table, { TableRow, TableCell } from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';

const Orders = () => {
  const { socket } = useSocket();
  const toast = useToast();
  const { settings } = useCart();

  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);

  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('qr_admin_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const res = await axios.get(`${backendUrl}/api/orders`, config);
      setOrders(res.data);
    } catch (err) {
      console.error('Fetch orders error:', err);
      toast.error('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Listen to live socket events for incoming orders and status updates
  useEffect(() => {
    if (!socket) return;

    socket.emit('join-room', 'admin');

    const handleNewOrder = (order) => {
      setOrders((prev) => [order, ...prev]);
      toast.info(`New Order received: ${order.receiptNumber}`);
      
      // Play a small notification sound
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav');
      audio.play().catch(e => console.log('Audio autoplay blocked'));
    };

    const handleStatusUpdate = (updatedOrder) => {
      setOrders((prev) => 
        prev.map(ord => ord.id === updatedOrder.id ? updatedOrder : ord)
      );
      if (selectedOrder && selectedOrder.id === updatedOrder.id) {
        setSelectedOrder(updatedOrder);
      }
    };

    socket.on('new-order', handleNewOrder);
    socket.on('order-status-updated', handleStatusUpdate);

    return () => {
      socket.emit('leave-room', 'admin');
      socket.off('new-order', handleNewOrder);
      socket.off('order-status-updated', handleStatusUpdate);
    };
  }, [socket, selectedOrder]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('qr_admin_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const res = await axios.patch(`${backendUrl}/api/orders/${orderId}/status`, { status: newStatus }, config);
      
      // Local state will be updated automatically via socket broadcast if socket is connected.
      // But let's also update it manually to be safe.
      setOrders(prev => 
        prev.map(ord => ord.id === orderId ? res.data : ord)
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(res.data);
      }

      toast.success(`Order status updated to ${newStatus}`);
    } catch (err) {
      console.error('Update status error:', err);
      toast.error(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesSearch = order.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (order.customerName && order.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (order.table?.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Orders Management</h1>
          <p className="text-xs text-slate-400 mt-1">Review active customer tickets, dispatch meals, and monitor cooking status.</p>
        </div>
        <button 
          onClick={fetchOrders}
          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold"
        >
          <RefreshCw size={14} /> Reload
        </button>
      </div>

      {/* Filters bar */}
      <Card className="p-4 border-slate-100/50 flex flex-wrap gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative max-w-sm w-full">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search by receipt, table, name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 text-xs pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all font-semibold"
          />
        </div>

        {/* Categories filters */}
        <div className="flex gap-2">
          {['all', 'PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                filterStatus === status
                  ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                  : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {status === 'all' ? 'All Tickets' : status}
            </button>
          ))}
        </div>
      </Card>

      {/* Orders Table */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">Loading order log...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl text-slate-400">
          No orders match your filter criteria.
        </div>
      ) : (
        <Table headers={['Receipt', 'Table', 'Customer', 'Total', 'Notes', 'Status', 'Created', 'Actions']}>
          {filteredOrders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-extrabold text-slate-800">{order.receiptNumber}</TableCell>
              <TableCell className="font-bold text-slate-500">{order.table?.tableNumber || 'Walk-In'}</TableCell>
              <TableCell className="font-bold text-slate-700">{order.customerName || 'N/A'}</TableCell>
              <TableCell className="font-extrabold text-slate-900">
                {settings.currency === 'USD' ? '$' : settings.currency}
                {order.total.toFixed(2)}
              </TableCell>
              <TableCell className="truncate max-w-[150px] text-slate-400 font-medium">
                {order.notes || '-'}
              </TableCell>
              <TableCell>
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${statusColors[order.status]}`}>
                  {order.status}
                </span>
              </TableCell>
              <TableCell className="text-slate-400 text-xs font-medium">
                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="p-1.5 rounded-lg border-slate-200"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <Eye size={14} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}

      {/* Order Expand Details Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Order Ticket: ${selectedOrder.receiptNumber}`}
          size="md"
        >
          <div className="space-y-6">
            {/* Quick stats info */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
              <div>
                <p className="text-slate-400 font-bold uppercase">Table</p>
                <p className="font-extrabold text-slate-700 mt-0.5">{selectedOrder.table?.tableNumber || 'Walk-In'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase">Customer</p>
                <p className="font-extrabold text-slate-700 mt-0.5">{selectedOrder.customerName || 'Anonymous'}</p>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-200">
                <p className="text-slate-400 font-bold uppercase">Notes / Instructions</p>
                <p className="font-medium text-slate-600 mt-0.5">"{selectedOrder.notes || 'No special requests'}"</p>
              </div>
            </div>

            {/* List items */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Items Ordered</h4>
              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="py-2.5 flex justify-between items-center text-xs">
                    <span className="text-slate-600 font-medium">
                      <span className="font-extrabold text-slate-800 pr-1.5">{item.quantity}x</span>
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
              <span className="text-slate-500">Total Amount Due</span>
              <span className="text-primary-500">
                {settings.currency === 'USD' ? '$' : settings.currency}
                {selectedOrder.total.toFixed(2)}
              </span>
            </div>

            {/* Change status action section */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Transition Ticket State</h4>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { state: 'PENDING', bg: 'hover:bg-amber-50 hover:text-amber-600 border-amber-200 text-amber-500' },
                  { state: 'PREPARING', bg: 'hover:bg-blue-50 hover:text-blue-600 border-blue-200 text-blue-500' },
                  { state: 'READY', bg: 'hover:bg-emerald-50 hover:text-emerald-600 border-emerald-200 text-emerald-500' },
                  { state: 'COMPLETED', bg: 'hover:bg-slate-100 hover:text-slate-800 border-slate-300 text-slate-600' },
                  { state: 'CANCELLED', bg: 'hover:bg-red-50 hover:text-red-600 border-red-200 text-red-500' }
                ].map((item) => {
                  const isCurrent = selectedOrder.status === item.state;
                  return (
                    <button
                      key={item.state}
                      onClick={() => handleUpdateStatus(selectedOrder.id, item.state)}
                      className={`py-2 px-1 text-[9px] font-extrabold rounded-lg border text-center transition-all ${
                        isCurrent 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
                          : `bg-white ${item.bg}`
                      }`}
                    >
                      {item.state}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Orders;
