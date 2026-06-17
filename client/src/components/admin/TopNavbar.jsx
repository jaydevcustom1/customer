import React, { useEffect, useState } from 'react';
import { Bell, ShieldCheck, Wifi, WifiOff } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useCart } from '../../context/CartContext';

const TopNavbar = () => {
  const { socket } = useSocket();
  const { settings } = useCart();
  const [connected, setConnected] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    if (!socket) return;
    setConnected(socket.connected);

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [socket]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 z-20 shrink-0 font-sans">
      {/* Title / Time */}
      <div className="flex items-center gap-6">
        <span className="text-xs font-bold text-slate-400">
          {formatDate(time)} • <span className="text-slate-600">{formatTime(time)}</span>
        </span>
      </div>

      {/* Network Status / User details */}
      <div className="flex items-center gap-4">
        {/* Real-time Status Badge */}
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${
          connected 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
            : 'bg-red-50 border-red-100 text-red-600'
        }`}>
          {connected ? (
            <>
              <Wifi size={12} className="animate-pulse" />
              Real-time Live
            </>
          ) : (
            <>
              <WifiOff size={12} />
              Reconnecting
            </>
          )}
        </div>

        {/* Divider */}
        <div className="h-4 w-px bg-slate-100" />

        {/* Dashboard Badge */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
          <ShieldCheck size={16} className="text-primary-500" />
          <span>Secured POS Session</span>
        </div>
      </div>
    </div>
  );
};

export default TopNavbar;
