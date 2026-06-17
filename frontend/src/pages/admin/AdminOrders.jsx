import React, { useState, useEffect } from 'react';
import { Calendar, User, ShoppingCart, Loader2 } from 'lucide-react';
import API from '../../services/api';
import Sidebar from '../../components/Sidebar';
import Alert from '../../components/Alert';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });

  const fetchOrders = async () => {
    try {
      const res = await API.get('/admin/orders');
      setOrders(res.data);
    } catch (err) {
      console.error('Error fetching admin orders:', err);
      setStatus({ type: 'error', message: 'Failed to load order logs.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    setStatus({ type: '', message: '' });
    try {
      await API.put(`/admin/orders/${orderId}`, { status: newStatus });
      setStatus({ type: 'success', message: `Order #${orderId} status updated to "${newStatus}".` });
      
      // Update state locally to avoid complete page reload stutter
      setOrders(prev =>
        prev.map(ord => (ord.id === orderId ? { ...ord, status: newStatus } : ord))
      );
    } catch (err) {
      console.error('Error updating status:', err);
      setStatus({
        type: 'error',
        message: err.response?.data?.message || 'Failed to update order status.'
      });
    }
  };

  const statusColors = {
    'Pending': 'bg-amber-50 text-amber-800 border-amber-200 focus:border-amber-400',
    'Shipped': 'bg-blue-50 text-blue-800 border-blue-200 focus:border-blue-400',
    'Delivered': 'bg-emerald-50 text-emerald-800 border-emerald-200 focus:border-emerald-400',
    'Cancelled': 'bg-red-50 text-red-800 border-red-200 focus:border-red-400'
  };

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="border-b border-slate-200 pb-5">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Order Logs Manager</h1>
          <p className="text-slate-500 text-sm mt-1">Review purchase invoices and dispatch tracking states.</p>
        </div>

        {status.message && <Alert type={status.type} message={status.message} />}

        {loading ? (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2 text-blue-600" />
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Loading order logs...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center text-slate-400 text-sm font-medium">
            No customer orders recorded in the system.
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
              >
                {/* Header info */}
                <div className="bg-slate-50 border-b border-slate-100 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-4 sm:gap-6 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    <div>
                      <p className="text-[10px] text-slate-400">Order ID</p>
                      <p className="font-bold text-slate-800 font-mono text-sm mt-1">#TN-{order.id}</p>
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-400">Date Ordered</p>
                      <div className="flex items-center gap-1 text-slate-700 mt-1 font-bold">
                        <Calendar size={13} className="text-slate-400" />
                        <span>{new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-400">Customer</p>
                      <div className="flex items-center gap-1 text-slate-700 mt-1 font-bold normal-case">
                        <User size={13} className="text-slate-400" />
                        <span>{order.user_name} ({order.user_email})</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-400">Invoice Total</p>
                      <p className="font-extrabold text-blue-600 text-sm sm:text-base mt-1">
                        ₹{parseFloat(order.total_amount).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Status editing dropdown select */}
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider hidden sm:inline">
                      Order Status
                    </span>
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className={`border rounded-lg text-xs font-bold px-3 py-1.5 focus:outline-none transition-colors ${statusColors[order.status]}`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Items listing drawer */}
                <div className="p-4 sm:p-5 divide-y divide-slate-100">
                  {order.items && order.items.map((item) => (
                    <div key={item.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center gap-4 text-xs font-semibold text-slate-500">
                      <div className="w-12 h-12 border border-slate-100 bg-slate-50 rounded p-0.5 shrink-0 flex items-center justify-center">
                        <img
                          src={item.image_url || 'https://placeholder.com/60'}
                          alt={item.title}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="flex-1 truncate">
                        <h4 className="font-bold text-slate-800 truncate">{item.title}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">Brand: {item.brand}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-slate-800">₹{parseFloat(item.price).toFixed(2)}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
};

export default AdminOrders;
