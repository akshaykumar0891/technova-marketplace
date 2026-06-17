import React, { useState, useEffect } from 'react';
import { ShieldAlert, Trash2, Calendar, UserCheck, Loader2, Info } from 'lucide-react';
import API from '../../services/api';
import Sidebar from '../../components/Sidebar';
import Alert from '../../components/Alert';

const AdminDeactivations = () => {
  const [logs, setLogs] = useState([]);
  const [deactivatedCount, setDeactivatedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });

  const fetchLogs = async () => {
    try {
      const res = await API.get('/admin/deactivations');
      setLogs(res.data.logs || []);
      setDeactivatedCount(res.data.deactivatedCount || 0);
    } catch (err) {
      console.error('Error fetching deactivation logs:', err);
      setStatus({ type: 'error', message: 'Failed to load account deactivation logs.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleReactivate = async (id, name) => {
    setStatus({ type: '', message: '' });
    try {
      const res = await API.post(`/admin/deactivations/${id}/reactivate`);
      setStatus({ type: 'success', message: `Account for "${name}" reactivated successfully.` });
      fetchLogs();
    } catch (err) {
      console.error('Error reactivating account:', err);
      setStatus({
        type: 'error',
        message: err.response?.data?.message || 'Failed to reactivate account.'
      });
    }
  };

  const handleDeleteLog = async (id) => {
    if (!window.confirm('Are you sure you want to delete this log entry? This will not reactivate the account.')) return;
    
    setStatus({ type: '', message: '' });
    try {
      await API.delete(`/admin/deactivations/${id}`);
      setStatus({ type: 'success', message: 'Log entry cleared successfully.' });
      fetchLogs();
    } catch (err) {
      console.error('Error deleting log:', err);
      setStatus({
        type: 'error',
        message: err.response?.data?.message || 'Failed to clear log entry.'
      });
    }
  };

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="border-b border-slate-200 pb-5">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Deactivation Logs</h1>
          <p className="text-slate-500 text-sm mt-1">
            Review reasons why customers left, reactivate accounts, or manage logs.
          </p>
        </div>

        {status.message && <Alert type={status.type} message={status.message} />}

        {/* Counter Info Banner */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center space-x-3 text-blue-800 text-sm font-semibold">
          <Info size={20} className="text-blue-600 shrink-0" />
          <span>There are currently <span className="font-extrabold text-blue-900">{deactivatedCount}</span> deactivated accounts that can be reactivated.</span>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2 text-blue-600" />
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Loading logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center text-slate-400 text-sm font-medium">
            No account deactivation or deletion logs recorded.
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-2">
                <ShieldAlert size={16} className="text-blue-500" />
                <span>Customer Deactivation Matrix</span>
              </span>
              <span>Total Logs: {logs.length}</span>
            </div>

            <div className="overflow-x-auto font-medium">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/30 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="px-6 py-3.5">Customer details</th>
                    <th className="px-6 py-3.5">Action Type</th>
                    <th className="px-6 py-3.5">Survey Reason</th>
                    <th className="px-6 py-3.5">Date Logged</th>
                    <th className="px-6 py-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                      
                      {/* Customer Info */}
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{log.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 normal-case font-mono">{log.email}</p>
                      </td>

                      {/* Action Type: Deactivate vs Delete */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          log.type === 'delete'
                            ? 'bg-red-50 text-red-700 border-red-100'
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {log.type === 'delete' ? 'Permanent Delete' : 'Deactivated'}
                        </span>
                      </td>

                      {/* Survey Reason */}
                      <td className="px-6 py-4 max-w-[200px]">
                        <p className="font-semibold text-slate-700">{log.reason}</p>
                        {log.other_reason && (
                          <p className="text-[10px] text-slate-400 mt-0.5 italic truncate font-normal" title={log.other_reason}>
                            "{log.other_reason}"
                          </p>
                        )}
                      </td>

                      {/* Date Joined */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center items-center space-x-2">
                          
                          {/* Reactivate (Only if not deleted account) */}
                          {log.type === 'deactivate' ? (
                            <button
                              onClick={() => handleReactivate(log.id, log.name)}
                              className="p-1.5 border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 text-blue-600 transition-colors cursor-pointer"
                              title="Reactivate Account"
                            >
                              <UserCheck size={13} />
                            </button>
                          ) : (
                            <span className="p-1.5 border border-transparent rounded-lg text-slate-300 select-none text-[10px] uppercase font-bold" title="Deleted accounts cannot be reactivated">
                              Purged
                            </span>
                          )}

                          {/* Delete Log */}
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="p-1.5 border border-slate-200 hover:bg-red-50 text-red-600 hover:border-red-200 rounded-lg transition-colors cursor-pointer"
                            title="Clear Log Entry"
                          >
                            <Trash2 size={13} />
                          </button>
                          
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

      </main>
    </div>
  );
};

export default AdminDeactivations;
