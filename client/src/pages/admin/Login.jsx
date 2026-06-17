import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, Mail, ShieldAlert } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';
import Card, { CardBody } from '../../components/ui/Card';

const Login = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // If already logged in, redirect to dashboard
  useEffect(() => {
    const token = localStorage.getItem('qr_admin_token');
    if (token) {
      navigate('/admin/dashboard');
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.warning('Please enter email and password');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${backendUrl}/api/auth/login`, { email, password });
      
      const { token, user } = res.data;
      
      // Save data
      localStorage.setItem('qr_admin_token', token);
      localStorage.setItem('qr_admin_user', JSON.stringify(user));
      
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/admin/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      toast.error(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-primary-500/30 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-orange-600/20 blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <Card className="border-slate-800 bg-slate-950/80 backdrop-blur-md shadow-2xl rounded-2xl">
          <CardBody className="p-8 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="h-12 w-12 bg-primary-500 rounded-2xl flex items-center justify-center text-white mx-auto shadow-xl shadow-primary-500/20 font-black text-xl">
                POS
              </div>
              <h1 className="text-xl font-extrabold text-white tracking-tight">Management Sign In</h1>
              <p className="text-xs text-slate-500">Provide credentials to access POS controls.</p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Username or Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Mail size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="E.g., admin or admin@bistro.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-sm pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-sm pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full font-bold py-3 mt-2 rounded-xl"
                loading={loading}
              >
                Sign In
              </Button>
            </form>

            <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <ShieldAlert size={14} className="text-primary-500 shrink-0" />
              <span>Authorized personnel only. Sessions are audited for security logs.</span>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default Login;
