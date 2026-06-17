import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, TableProperties, QrCode, Trash2, Printer, RefreshCw } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Table, { TableRow, TableCell } from '../../components/ui/Table';
import Button from '../../components/ui/Button';

const Tables = () => {
  const toast = useToast();

  const [tables, setTables] = useState([]);
  const [newTableNum, setNewTableNum] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState({ restaurantName: 'The Golden Plate Bistro' });

  // Print view state
  const [printTable, setPrintTable] = useState(null);

  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchTables = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('qr_admin_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const res = await axios.get(`${backendUrl}/api/tables`, config);
      setTables(res.data);
    } catch (err) {
      console.error('Fetch tables error:', err);
      toast.error('Failed to load tables data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/settings`);
        if (res.data) {
          setSettings(res.data);
        }
      } catch (err) {
        console.error('Fetch settings error:', err);
      }
    };
    fetchSettings();
  }, []);

  const handleCreateTable = async (e) => {
    e.preventDefault();
    if (!newTableNum.trim()) {
      toast.warning('Table number/name is required');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('qr_admin_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.post(`${backendUrl}/api/tables`, { tableNumber: newTableNum }, config);
      toast.success('Table created with QR Code successfully!');
      setNewTableNum('');
      fetchTables();
    } catch (err) {
      console.error('Create table error:', err);
      toast.error(err.response?.data?.message || 'Failed to create table');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (tableId, newStatus) => {
    try {
      const token = localStorage.getItem('qr_admin_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.patch(`${backendUrl}/api/tables/${tableId}/status`, { status: newStatus }, config);
      toast.success('Table status updated');
      fetchTables();
    } catch (err) {
      console.error('Update table status error:', err);
      toast.error('Failed to update table status');
    }
  };

  const handleDeleteTable = async (tableId) => {
    if (!window.confirm('Are you sure you want to delete this table? Customers scanning this QR code will no longer be able to place orders.')) return;
    try {
      const token = localStorage.getItem('qr_admin_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.delete(`${backendUrl}/api/tables/${tableId}`, config);
      toast.success('Table deleted successfully');
      fetchTables();
    } catch (err) {
      console.error('Delete table error:', err);
      toast.error('Failed to delete table');
    }
  };

  const handlePrintQR = (table) => {
    setPrintTable(table);
    const originalTitle = document.title;
    document.title = `${settings.restaurantName} | ${table.tableNumber}`;
    setTimeout(() => {
      window.print();
      document.title = originalTitle;
    }, 150);
  };

  return (
    <div className="p-8 space-y-8 font-sans overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Print Overlay CSS (Only active when printed) */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            margin: 0;
            size: portrait;
          }
          body {
            margin: 0;
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body * {
            visibility: hidden;
          }
          #print-section, #print-section * {
            visibility: visible;
          }
          #print-section {
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 105mm;
            height: 148mm;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: space-between !important;
            background: #fafaf9 !important;
            box-sizing: border-box;
            border: 12px solid #0f172a !important;
            border-radius: 24px !important;
            padding: 24px !important;
            text-align: center !important;
            box-shadow: none !important;
          }
        }
      `}} />

      {/* Printable Area (Premium Acrylic Table Card Design) */}
      {printTable && (
        <div id="print-section" className="hidden relative">
          {/* Inner Golden border */}
          <div className="absolute inset-1.5 border border-amber-500/40 rounded-lg pointer-events-none" />

          {/* Header */}
          <div className="space-y-1 mt-2">
            <div className="flex justify-center mb-1 text-amber-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-[13px] font-extrabold text-slate-800 tracking-tight uppercase leading-none">{settings.restaurantName}</h2>
            <p className="text-[7px] font-black text-amber-500 uppercase tracking-[0.2em] leading-none mt-0.5">KOREAN BBQ & GRILL</p>
            <div className="h-0.5 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent w-20 mx-auto my-1.5" />
          </div>

          {/* QR Code Canvas */}
          <div className="flex flex-col items-center my-auto">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2.5">SCAN TO BROWSE & ORDER</p>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm ring-4 ring-amber-500/10">
              <img src={printTable.qrCode} alt="Print QR" className="w-36 h-36 object-contain" />
            </div>
            <p className="text-[7px] text-slate-400 mt-2 font-medium">No application download required</p>
          </div>

          {/* Table Number & Step instructions */}
          <div className="space-y-2.5 mb-2 w-full">
            <div className="inline-block bg-slate-900 text-white font-extrabold px-6 py-2 rounded-xl text-lg tracking-wider border border-amber-500/35 leading-tight">
              <span className="text-amber-500 text-[8px] tracking-widest font-black block uppercase -mb-0.5">TABLE</span>
              {printTable.tableNumber.replace('Table ', '')}
            </div>

            {/* Micro Checklist */}
            <div className="flex items-center justify-center gap-3 text-[7.5px] font-bold text-slate-500 pt-1">
              <span className="flex items-center gap-1"><span className="text-amber-500">1</span> Scan</span>
              <span className="w-1 h-1 bg-amber-500/30 rounded-full" />
              <span className="flex items-center gap-1"><span className="text-amber-500">2</span> Order</span>
              <span className="w-1 h-1 bg-amber-500/30 rounded-full" />
              <span className="flex items-center gap-1"><span className="text-amber-500">3</span> Feast</span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Tables & QR Codes</h1>
          <p className="text-xs text-slate-400 mt-1">Register dining tables, monitor occupied states, and print table QR code cards.</p>
        </div>
        <button 
          onClick={fetchTables}
          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold"
        >
          <RefreshCw size={14} /> Reload
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
        {/* Left Column: Create Table Form */}
        <Card className="border-slate-100/50 h-fit">
          <CardHeader>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Plus size={16} className="text-primary-500" /> Add New Table
            </h3>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleCreateTable} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Table Name/Number *</label>
                <input
                  type="text"
                  placeholder="E.g., Table 6"
                  value={newTableNum}
                  onChange={(e) => setNewTableNum(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full font-bold rounded-xl"
                loading={submitting}
              >
                Generate QR Table
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* Right Column: Tables Table list (2 cols) */}
        <Card className="lg:col-span-2 border-slate-100">
          <CardHeader>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <TableProperties size={16} className="text-slate-400" /> Active Tables list
            </h3>
          </CardHeader>
          <CardBody className="p-0 max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="text-center py-20 text-slate-400">Loading tables...</div>
            ) : tables.length === 0 ? (
              <div className="text-center py-20 text-slate-400">No tables registered. Add tables to generate QRs.</div>
            ) : (
              <Table headers={['Table', 'QR Code', 'Status', 'Actions']}>
                {tables.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-extrabold text-slate-800">{t.tableNumber}</TableCell>
                    <TableCell>
                      <div className="h-10 w-10 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-100 flex items-center justify-center p-0.5">
                        <img src={t.qrCode} alt="QR Thumbnail" className="h-full w-full object-contain" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <select
                        value={t.status}
                        onChange={(e) => handleUpdateStatus(t.id, e.target.value)}
                        className="text-xs font-semibold bg-slate-100 text-slate-600 rounded-lg py-1.5 px-2 border-none focus:outline-none"
                      >
                        <option value="AVAILABLE">Available</option>
                        <option value="OCCUPIED">Occupied</option>
                        <option value="RESERVED">Reserved</option>
                      </select>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handlePrintQR(t)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                          title="Print Table QR Card"
                        >
                          <Printer size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteTable(t.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </Table>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default Tables;
