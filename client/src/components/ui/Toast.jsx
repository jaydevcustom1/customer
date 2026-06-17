import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-remove after 3.5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 3500);
  }, [removeToast]);

  const toast = {
    success: (msg) => showToast(msg, 'success'),
    error: (msg) => showToast(msg, 'error'),
    info: (msg) => showToast(msg, 'info'),
    warning: (msg) => showToast(msg, 'warning'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Toast Portal Container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem = ({ toast, onClose }) => {
  const { message, type } = toast;

  const bgStyles = {
    success: 'bg-emerald-50 border-emerald-100 text-emerald-800 shadow-emerald-100/30',
    error: 'bg-red-50 border-red-100 text-red-800 shadow-red-100/30',
    info: 'bg-blue-50 border-blue-100 text-blue-800 shadow-blue-100/30',
    warning: 'bg-amber-50 border-amber-100 text-amber-800 shadow-amber-100/30',
  };

  const icons = {
    success: <CheckCircle className="text-emerald-500 shrink-0" size={18} />,
    error: <AlertCircle className="text-red-500 shrink-0" size={18} />,
    info: <Info className="text-blue-500 shrink-0" size={18} />,
    warning: <AlertCircle className="text-amber-500 shrink-0" size={18} />,
  };

  return (
    <div className={`flex items-start justify-between p-4 border rounded-xl shadow-lg pointer-events-auto animate-in slide-in-from-bottom-4 duration-300 ${bgStyles[type]}`}>
      <div className="flex items-center gap-3">
        {icons[type]}
        <p className="text-sm font-medium pr-2">{message}</p>
      </div>
      <button 
        onClick={onClose} 
        className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
      >
        <X size={15} />
      </button>
    </div>
  );
};
