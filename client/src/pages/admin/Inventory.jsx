import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Package, ArrowUpRight, ArrowDownRight, RefreshCw, Plus, Minus, FileText } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Table, { TableRow, TableCell } from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';

const Inventory = () => {
  const toast = useToast();

  const [products, setProducts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Adjustment Modal state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustForm, setAdjustForm] = useState({
    quantity: '5',
    type: 'STOCK_IN', // STOCK_IN, STOCK_OUT
    notes: 'Restock arrival'
  });

  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('qr_admin_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [prodRes, logRes] = await Promise.all([
        axios.get(`${backendUrl}/api/products`, config),
        axios.get(`${backendUrl}/api/inventory/logs`, config)
      ]);
      setProducts(prodRes.data);
      setLogs(logRes.data);
    } catch (err) {
      console.error('Fetch inventory data error:', err);
      toast.error('Failed to load inventory details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdjustModal = (product) => {
    setSelectedProduct(product);
    setAdjustForm({
      quantity: '5',
      type: 'STOCK_IN',
      notes: ''
    });
  };

  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    if (!adjustForm.quantity || Number(adjustForm.quantity) <= 0) {
      toast.warning('Please enter a valid positive quantity');
      return;
    }

    try {
      const token = localStorage.getItem('qr_admin_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.post(`${backendUrl}/api/inventory/adjust`, {
        productId: selectedProduct.id,
        quantity: Number(adjustForm.quantity),
        type: adjustForm.type,
        notes: adjustForm.notes
      }, config);

      toast.success('Stock adjusted successfully');
      setSelectedProduct(null);
      fetchData();
    } catch (err) {
      console.error('Save stock adjustment error:', err);
      toast.error(err.response?.data?.message || 'Failed to adjust stock');
    }
  };

  return (
    <div className="p-8 space-y-8 font-sans overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Inventory Tracking</h1>
          <p className="text-xs text-slate-400 mt-1">Audit stock inputs/outputs, adjust values, and review manual correction logs.</p>
        </div>
        <button 
          onClick={fetchData}
          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold"
        >
          <RefreshCw size={14} /> Reload
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column: Products inventory list (3 cols) */}
        <Card className="lg:col-span-3 border-slate-100 flex flex-col">
          <CardHeader>
            <h3 className="text-sm font-bold text-slate-800">Current Stock Inventory</h3>
          </CardHeader>
          <CardBody className="p-0 overflow-y-auto max-h-[500px]">
            {loading ? (
              <div className="text-center py-20 text-slate-400">Loading...</div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 text-slate-400">No products configured.</div>
            ) : (
              <Table headers={['Product', 'Category', 'Stock Level', 'Actions']}>
                {products.map((p) => {
                  const isLow = p.stock < 10;
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-extrabold text-slate-800">{p.name}</TableCell>
                      <TableCell className="font-semibold text-slate-500">{p.category?.name || 'Unassigned'}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-extrabold border ${
                          isLow 
                            ? 'bg-red-50 border-red-100 text-red-600' 
                            : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                        }`}>
                          <Package size={12} /> {p.stock} units
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          className="font-bold text-[10px] rounded-lg py-1 px-2.5"
                          onClick={() => handleOpenAdjustModal(p)}
                        >
                          Adjust
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </Table>
            )}
          </CardBody>
        </Card>

        {/* Right Column: Inventory logs history (2 cols) */}
        <Card className="lg:col-span-2 border-slate-100 flex flex-col">
          <CardHeader>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <FileText size={16} className="text-slate-400" /> Stock Audit Logs
            </h3>
          </CardHeader>
          <CardBody className="p-0 overflow-y-auto max-h-[500px]">
            {loading ? (
              <div className="text-center py-20 text-slate-400">Loading...</div>
            ) : logs.length === 0 ? (
              <div className="text-center py-20 text-slate-400">No stock changes logged yet.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {logs.map((log) => {
                  const isStockIn = log.type === 'STOCK_IN';
                  return (
                    <div key={log.id} className="p-4 flex justify-between items-start text-xs hover:bg-slate-50/50 transition-colors">
                      <div className="space-y-1 pr-4">
                        <h4 className="font-extrabold text-slate-800">{log.product?.name || 'Deleted Product'}</h4>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">{log.notes || 'No description'}</p>
                        <p className="text-[9px] text-slate-400 font-medium">
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded font-extrabold shrink-0 border ${
                        isStockIn 
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                          : 'bg-red-50 border-red-100 text-red-600'
                      }`}>
                        {isStockIn ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {isStockIn ? '+' : '-'}{log.quantity}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Adjustment Modal */}
      {selectedProduct && (
        <Modal
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          title={`Adjust Stock: ${selectedProduct.name}`}
          size="sm"
        >
          <form onSubmit={handleSaveAdjustment} className="space-y-4">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
              <div className="flex justify-between items-center font-bold text-slate-700">
                <span>Current Stock Level:</span>
                <span className="text-primary-500 text-sm">{selectedProduct.stock} units</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Adjustment Type *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustForm(f => ({ ...f, type: 'STOCK_IN' }))}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1 transition-all ${
                    adjustForm.type === 'STOCK_IN'
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Plus size={14} /> Stock In (Add)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustForm(f => ({ ...f, type: 'STOCK_OUT' }))}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1 transition-all ${
                    adjustForm.type === 'STOCK_OUT'
                      ? 'bg-red-500 border-red-500 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Minus size={14} /> Stock Out (Deduct)
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Adjustment Quantity *</label>
              <input
                type="number"
                min="1"
                value={adjustForm.quantity}
                onChange={(e) => setAdjustForm(f => ({ ...f, quantity: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Notes / Description *</label>
              <input
                type="text"
                placeholder="E.g., Restock delivery, kitchen loss, wastage..."
                value={adjustForm.notes}
                onChange={(e) => setAdjustForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none"
                required
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
              <Button variant="outline" size="sm" onClick={() => setSelectedProduct(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Apply Adjustment
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Inventory;
