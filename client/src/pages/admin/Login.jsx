import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, Mail, ShieldAlert, Eye, EyeOff, Store } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';

const Login = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Dynamic Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Orb 1: Orange/Amber */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-primary-500/20 to-amber-600/10 blur-[130px] animate-pulse" style={{ animationDuration: '8s' }} />
        {/* Orb 2: Purple */}
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-purple-600/20 to-indigo-500/10 blur-[130px] animate-pulse" style={{ animationDuration: '12s' }} />
        {/* Orb 3: Soft Amber Center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[350px] rounded-full bg-primary-600/5 blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Glassmorphic Container */}
        <div className="bg-slate-900/50 border border-slate-800/80 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] rounded-3xl p-8 space-y-8 relative before:absolute before:inset-0 before:rounded-3xl before:border before:border-white/5 before:pointer-events-none">
          
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="h-14 w-14 bg-gradient-to-tr from-primary-500 to-amber-500 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-primary-500/20 transform hover:rotate-6 transition-transform duration-300">
              <Store size={26} className="stroke-[2.5]" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-2xl font-black text-white tracking-tight bg-clip-text bg-gradient-to-b from-white to-slate-200">
                Management Portal
              </h1>
              <p className="text-xs text-slate-400 font-medium tracking-wide">
                Provide credentials to access POS controls
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Username/Email Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block pl-1">
                Username or Email
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 group-focus-within:text-primary-500 transition-colors duration-200">
                  <Mail size={16} />
                </span>
                <input
                  type="text"
                  placeholder="admin@bistro.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800/80 text-white placeholder-slate-600 text-sm pl-11 pr-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 font-medium"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center pl-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                  Password
                </label>
              </div>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 group-focus-within:text-primary-500 transition-colors duration-200">
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800/80 text-white placeholder-slate-600 text-sm pl-11 pr-11 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors duration-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-500 to-orange-600 hover:from-primary-600 hover:to-orange-700 text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-primary-500/10 hover:shadow-primary-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer text-sm mt-3"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="flex items-start gap-2.5 text-[10px] font-semibold text-slate-400 bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/50">
            <ShieldAlert size={14} className="text-primary-500 shrink-0 mt-0.5" />
            <span className="leading-normal">
              Authorized personnel only. Sessions are audited and recorded for security logs.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
