import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar
} from 'recharts';
import { 
  DollarSign, ShoppingBag, Clock, AlertTriangle, ChevronRight, AlertCircle, ArrowUpRight
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { useCart } from '../../context/CartContext';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Table, { TableRow, TableCell } from '../../components/ui/Table';

const Dashboard = () => {
  const toast = useToast();
  const { settings } = useCart();

  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('qr_admin_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [sumRes, chartRes, ordRes] = await Promise.all([
        axios.get(`${backendUrl}/api/reports/summary`, config),
        axios.get(`${backendUrl}/api/reports/charts`, config),
        axios.get(`${backendUrl}/api/orders?take=5`, config) // Take recent orders
      ]);

      setSummary(sumRes.data);
      setCharts(chartRes.data);
      setRecentOrders(ordRes.data.slice(0, 5)); // Cap at 5
    } catch (err) {
      console.error('Fetch dashboard error:', err);
      toast.error('Failed to load dashboard data. Check authorization.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const COLORS = ['#f97316', '#3b82f6', '#10b981', '#a855f7', '#ec4899'];

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-10 bg-slate-100 rounded w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-80 bg-slate-100 rounded-2xl col-span-2" />
          <div className="h-80 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 font-sans overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Welcome Heading */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">System Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">Real-time restaurant metrics, sales logs, and inventory warnings.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Today's Revenue */}
        <Card className="p-6 border-slate-100/50 bg-gradient-to-tr from-white to-orange-50/10">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Revenue</p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-2">
                {settings.currency === 'USD' ? '$' : settings.currency}
                {summary?.revenue?.today?.toFixed(2) || '0.00'}
              </h3>
            </div>
            <div className="p-3 bg-orange-50 text-orange-500 rounded-xl">
              <DollarSign size={20} />
            </div>
          </div>
        </Card>

        {/* Weekly Revenue */}
        <Card className="p-6 border-slate-100/50">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weekly Revenue</p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-2">
                {settings.currency === 'USD' ? '$' : settings.currency}
                {summary?.revenue?.weekly?.toFixed(2) || '0.00'}
              </h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl">
              <ArrowUpRight size={20} />
            </div>
          </div>
        </Card>

        {/* Pending Orders */}
        <Card className="p-6 border-slate-100/50">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Orders</p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-2">
                {summary?.orders?.pending || 0}
              </h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-500 rounded-xl">
              <Clock size={20} />
            </div>
          </div>
        </Card>

        {/* Low Stock Products */}
        <Card className="p-6 border-slate-100/50 bg-gradient-to-tr from-white to-red-50/10">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Low Stock alerts</p>
              <h3 className="text-2xl font-extrabold text-red-500 mt-2">
                {summary?.lowStock || 0}
              </h3>
            </div>
            <div className="p-3 bg-red-50 text-red-500 rounded-xl">
              <AlertTriangle size={20} />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Revenue Area Chart */}
        <Card className="col-span-2 border-slate-100">
          <CardHeader>
            <h3 className="text-sm font-bold text-slate-800">Weekly Revenue Trends</h3>
          </CardHeader>
          <CardBody className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.dailySales || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Category Performance Pie Chart */}
        <Card className="border-slate-100">
          <CardHeader>
            <h3 className="text-sm font-bold text-slate-800">Sales by Category</h3>
          </CardHeader>
          <CardBody className="h-80 flex flex-col justify-between items-center">
            {charts?.categoryPerformance?.length > 0 ? (
              <>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts.categoryPerformance}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {charts.categoryPerformance.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${settings.currency === 'USD' ? '$' : settings.currency}${value.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Custom Legend */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center text-[10px] text-slate-500 font-bold">
                  {charts.categoryPerformance.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span>{entry.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                No categorical sales logged.
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Lower Section: Recent Orders & Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders List */}
        <Card className="lg:col-span-2 border-slate-100">
          <CardHeader>
            <h3 className="text-sm font-bold text-slate-800">Recent Transactions</h3>
          </CardHeader>
          <CardBody className="p-0">
            {recentOrders.length > 0 ? (
              <Table headers={['Receipt', 'Table', 'Total', 'Status', 'Time']}>
                {recentOrders.map((order) => {
                  const statusColors = {
                    PENDING: 'bg-amber-50 text-amber-600',
                    PREPARING: 'bg-blue-50 text-blue-600',
                    READY: 'bg-emerald-50 text-emerald-600',
                    COMPLETED: 'bg-slate-100 text-slate-600',
                    CANCELLED: 'bg-red-50 text-red-600'
                  };

                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-extrabold text-slate-800">{order.receiptNumber}</TableCell>
                      <TableCell className="font-bold text-slate-500">{order.table?.tableNumber || 'Walk-In'}</TableCell>
                      <TableCell className="font-extrabold text-slate-900">
                        {settings.currency === 'USD' ? '$' : settings.currency}
                        {order.total.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusColors[order.status]}`}>
                          {order.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-400 text-xs">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </Table>
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs">No orders recorded today.</div>
            )}
          </CardBody>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="border-slate-100">
          <CardHeader className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <AlertCircle size={16} className="text-red-500" /> Stock Warnings
            </h3>
          </CardHeader>
          <CardBody className="space-y-4">
            {charts?.lowStockProducts?.length > 0 ? (
              charts.lowStockProducts.map((prod) => (
                <div key={prod.id} className="flex justify-between items-center bg-slate-50 hover:bg-slate-100/55 p-3 rounded-xl border border-slate-100/50">
                  <span className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{prod.name}</span>
                  <span className="text-xs font-extrabold bg-red-50 text-red-600 px-2.5 py-1 rounded-lg">
                    {prod.stock} left
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                All active products satisfy normal stock requirements.
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
