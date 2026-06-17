import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Save, RefreshCw, Settings as SetIcon, ShieldAlert } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { useCart } from '../../context/CartContext';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const Settings = () => {
  const toast = useToast();
  const { settings: globalSettings, fetchSettings } = useCart();

  const [form, setForm] = useState({
    restaurantName: '',
    address: '',
    phone: '',
    currency: 'USD',
    tax: '0.00',
    serviceFee: '0.00'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${backendUrl}/api/settings`);
      setForm({
        restaurantName: res.data.restaurantName || '',
        address: res.data.address || '',
        phone: res.data.phone || '',
        currency: res.data.currency || 'USD',
        tax: res.data.tax.toString(),
        serviceFee: res.data.serviceFee.toString()
      });
    } catch (err) {
      console.error('Fetch settings error:', err);
      toast.error('Failed to load settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.restaurantName) {
      toast.warning('Restaurant name is required');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('qr_admin_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.put(`${backendUrl}/api/settings`, {
        restaurantName: form.restaurantName,
        address: form.address,
        phone: form.phone,
        currency: form.currency,
        tax: Number(form.tax),
        serviceFee: Number(form.serviceFee)
      }, config);

      toast.success('Restaurant settings updated successfully!');
      
      // Force trigger settings refresh in window (simplest reload)
      window.location.reload();
    } catch (err) {
      console.error('Save settings error:', err);
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-10 bg-slate-100 rounded w-1/4" />
        <div className="h-96 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 font-sans overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">System Settings</h1>
          <p className="text-xs text-slate-400 mt-1">Configure shop name, local tax rates, billing charges, currency and metadata.</p>
        </div>
        <button 
          onClick={loadSettings}
          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold"
        >
          <RefreshCw size={14} /> Reload
        </button>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSave}>
          <Card className="border-slate-100/50">
            <CardHeader>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <SetIcon size={16} className="text-primary-500" /> Restaurant Properties
              </h3>
            </CardHeader>
            <CardBody className="space-y-4">
              {/* Restaurant name */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Restaurant Name *</label>
                <input
                  type="text"
                  value={form.restaurantName}
                  onChange={(e) => setForm(f => ({ ...f, restaurantName: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none font-semibold text-slate-700"
                  required
                />
              </div>

              {/* Contact / Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Contact Number</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Currency (Code)</label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm(f => ({ ...f, currency: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none font-semibold"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="PHP">PHP (₱)</option>
                    <option value="IDR">IDR (Rp)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Address Details</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none"
                />
              </div>

              <div className="border-t border-slate-100 my-4" />

              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Billing Charges</h4>

              {/* Tax & Service fee */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Tax Percentage (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.tax}
                    onChange={(e) => setForm(f => ({ ...f, tax: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Service Fee Percentage (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.serviceFee}
                    onChange={(e) => setForm(f => ({ ...f, serviceFee: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-[10px] text-slate-400 font-medium bg-slate-50 p-3 rounded-xl border border-slate-150/40">
                <ShieldAlert size={14} className="text-primary-500" />
                <span>Adjusting these rates modifies new customer cart checkouts immediately.</span>
              </div>
            </CardBody>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="font-bold flex items-center gap-1.5 rounded-xl shadow-md shadow-primary-500/10"
                loading={saving}
              >
                <Save size={16} /> Save Properties
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default Settings;
