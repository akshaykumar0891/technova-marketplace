import React, { useState, useEffect } from 'react';
import { Users, Trash2, Calendar, Shield, Loader2 } from 'lucide-react';
import API from '../../services/api';
import Sidebar from '../../components/Sidebar';
import Alert from '../../components/Alert';
import { useAuth } from '../../context/AuthContext';

const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });

  const fetchUsers = async () => {
    try {
      const res = await API.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching admin users:', err);
      setStatus({ type: 'error', message: 'Failed to load user directories.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (id, name, email) => {
    if (currentUser && currentUser.id === id) {
      setStatus({ type: 'error', message: 'Self-deletion is not permitted.' });
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete user "${name}" (${email})? All their cart items, orders, and addresses will be permanently deleted.`)) return;

    setStatus({ type: '', message: '' });
    try {
      await API.delete(`/admin/users/${id}`);
      setStatus({ type: 'success', message: `Account for "${name}" has been deleted.` });
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      setStatus({
        type: 'error',
        message: err.response?.data?.message || 'Failed to delete user account.'
      });
    }
  };

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="border-b border-slate-200 pb-5">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Registered Customers</h1>
          <p className="text-slate-500 text-sm mt-1">Monitor user directories and administrative profiles.</p>
        </div>

        {status.message && <Alert type={status.type} message={status.message} />}

        {loading ? (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2 text-blue-600" />
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Loading users list...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center text-slate-400 text-sm font-medium">
            No registered users recorded in the database.
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            
            {/* Header info */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-2">
                <Users size={16} className="text-blue-500" />
                <span>User Account Matrix</span>
              </span>
              <span>Total: {users.length} Users</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/30 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="px-6 py-3.5">User Details</th>
                    <th className="px-6 py-3.5">Access Role</th>
                    <th className="px-6 py-3.5">Registration Date</th>
                    <th className="px-6 py-3.5 text-center">Delete Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/30 transition-colors">
                      
                      {/* Name & Email */}
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{u.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 normal-case font-mono">{u.email}</p>
                      </td>

                      {/* Access Role */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          u.role === 'admin'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}>
                          <Shield size={10} />
                          <span>{u.role}</span>
                        </span>
                      </td>

                      {/* Date Joined */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name, u.email)}
                          disabled={currentUser && currentUser.id === u.id}
                          className={`p-1.5 border rounded-lg transition-colors cursor-pointer ${
                            currentUser && currentUser.id === u.id
                              ? 'border-slate-100 text-slate-300 cursor-not-allowed bg-slate-50'
                              : 'border-slate-200 hover:bg-red-50 text-red-600 hover:border-red-200'
                          }`}
                          title={currentUser && currentUser.id === u.id ? 'Self-deletion disabled' : 'Delete Account'}
                        >
                          <Trash2 size={13} />
                        </button>
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

export default AdminUsers;
