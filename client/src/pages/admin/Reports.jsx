import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { FileDown, RefreshCw, BarChart3, PieChart as PieIcon, DollarSign, Calendar } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { useCart } from '../../context/CartContext';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const Reports = () => {
  const toast = useToast();
  const { settings } = useCart();

  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);

  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('qr_admin_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [sumRes, chartRes] = await Promise.all([
        axios.get(`${backendUrl}/api/reports/summary`, config),
        axios.get(`${backendUrl}/api/reports/charts`, config)
      ]);

      setSummary(sumRes.data);
      setCharts(chartRes.data);
    } catch (err) {
      console.error('Fetch reports error:', err);
      toast.error('Failed to load reports. Make sure you are signed in.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExportCSV = async (type) => {
    try {
      const token = localStorage.getItem('qr_admin_token');
      const res = await axios.get(`${backendUrl}/api/reports/export?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`${type.toUpperCase()} report exported successfully!`);
    } catch (err) {
      console.error('Export report error:', err);
      toast.error('Failed to export CSV report.');
    }
  };

  const COLORS = ['#f97316', '#3b82f6', '#10b981', '#a855f7', '#ec4899'];

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-10 bg-slate-100 rounded w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-96 bg-slate-100 rounded-2xl" />
          <div className="h-96 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 font-sans overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Reports & Exports</h1>
          <p className="text-xs text-slate-400 mt-1">Review custom sales summaries, download audit reports, and inspect bestseller statistics.</p>
        </div>
        <button 
          onClick={fetchReports}
          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold"
        >
          <RefreshCw size={14} /> Reload
        </button>
      </div>

      {/* KPI summaries */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-slate-100/50 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Revenue</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-2">
              {settings.currency === 'USD' ? '$' : settings.currency}
              {summary?.revenue?.today?.toFixed(2) || '0.00'}
            </h3>
          </div>
          <div className="p-3.5 bg-orange-50 text-orange-500 rounded-xl">
            <DollarSign size={20} />
          </div>
        </Card>

        <Card className="p-6 border-slate-100/50 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weekly Revenue</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-2">
              {settings.currency === 'USD' ? '$' : settings.currency}
              {summary?.revenue?.weekly?.toFixed(2) || '0.00'}
            </h3>
          </div>
          <div className="p-3.5 bg-blue-50 text-blue-500 rounded-xl">
            <Calendar size={20} />
          </div>
        </Card>

        <Card className="p-6 border-slate-100/50 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly Revenue</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-2">
              {settings.currency === 'USD' ? '$' : settings.currency}
              {summary?.revenue?.monthly?.toFixed(2) || '0.00'}
            </h3>
          </div>
          <div className="p-3.5 bg-emerald-50 text-emerald-500 rounded-xl">
            <BarChart3 size={20} />
          </div>
        </Card>
      </div>

      {/* Reports charts list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bestselling products chart */}
        <Card className="border-slate-100">
          <CardHeader>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 size={16} className="text-slate-400" /> Bestselling Products
            </h3>
          </CardHeader>
          <CardBody className="h-80">
            {charts?.bestSellers?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.bestSellers} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} width={100} />
                  <Tooltip contentStyle={{ borderRadius: '12px' }} />
                  <Bar dataKey="sales" fill="#f97316" radius={[0, 4, 4, 0]} name="Units Sold" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">No bestselling metrics found.</div>
            )}
          </CardBody>
        </Card>

        {/* Category Performance */}
        <Card className="border-slate-100">
          <CardHeader>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <PieIcon size={16} className="text-slate-400" /> Category Breakdown
            </h3>
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
                        innerRadius={50}
                        outerRadius={75}
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
                {/* Legend */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center text-[10px] text-slate-500 font-bold">
                  {charts.categoryPerformance.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span>{entry.name} ({settings.currency === 'USD' ? '$' : settings.currency}{entry.value.toFixed(2)})</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">No categorical sales logged.</div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* CSV Exporting Section */}
      <Card className="border-slate-100">
        <CardHeader>
          <h3 className="text-sm font-bold text-slate-800">Export Raw Reports Data</h3>
        </CardHeader>
        <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sales Report export */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100/50 flex flex-col justify-between gap-4">
            <div>
              <h4 className="text-xs font-black text-slate-800">Export Sales & Transactions</h4>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                Download a complete spreadsheet log containing order totals, customer names, receipt reference numbers, timestamps, and status tags.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full flex items-center justify-center gap-2 border-slate-200 font-bold"
              onClick={() => handleExportCSV('sales')}
            >
              <FileDown size={14} /> Export Sales CSV
            </Button>
          </div>

          {/* Inventory report export */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100/50 flex flex-col justify-between gap-4">
            <div>
              <h4 className="text-xs font-black text-slate-800">Export Inventory & Log Audit</h4>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                Download a complete spreadsheet logging manual adjustments, stock additions, product log references, dates, and operator notes.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full flex items-center justify-center gap-2 border-slate-200 font-bold"
              onClick={() => handleExportCSV('inventory')}
            >
              <FileDown size={14} /> Export Inventory CSV
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default Reports;
