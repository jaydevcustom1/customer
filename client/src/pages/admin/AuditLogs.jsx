import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { History, RefreshCw, Terminal } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Table, { TableRow, TableCell } from '../../components/ui/Table';

const AuditLogs = () => {
  const toast = useToast();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('qr_admin_token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const res = await axios.get(`${backendUrl}/api/audit-logs`, config);
      setLogs(res.data);
    } catch (err) {
      console.error('Fetch audit logs error:', err);
      toast.error('Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="p-8 space-y-8 font-sans overflow-y-auto max-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Audit Logs</h1>
          <p className="text-xs text-slate-400 mt-1">Review system logs, administrator actions, state transitions, and operator IP records.</p>
        </div>
        <button 
          onClick={fetchLogs}
          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold"
        >
          <RefreshCw size={14} /> Reload
        </button>
      </div>

      {/* Logs Table */}
      <Card className="border-slate-100/50">
        <CardHeader>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <History size={16} className="text-slate-400" /> Administrative History Trail
          </h3>
        </CardHeader>
        <CardBody className="p-0">
          {loading ? (
            <div className="text-center py-20 text-slate-400">Loading audit trail...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-20 text-slate-400">No actions logged in system history.</div>
          ) : (
            <Table headers={['Operator', 'Role', 'Action Executed', 'IP Address', 'Timestamp']}>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-extrabold text-slate-700">{log.user?.name || 'Unknown Operator'}</TableCell>
                  <TableCell className="font-semibold text-slate-400 text-xs">{log.user?.role || 'N/A'}</TableCell>
                  <TableCell className="text-xs font-bold text-slate-800">
                    <span className="inline-flex items-center gap-1">
                      <Terminal size={12} className="text-primary-500" />
                      {log.action}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-400 text-xs font-semibold font-mono">{log.ipAddress || 'unknown'}</TableCell>
                  <TableCell className="text-slate-400 text-xs font-medium">
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default AuditLogs;
