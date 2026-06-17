import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IndianRupee, ShoppingCart, Users, Package, AlertOctagon, ArrowRight, UserPlus, Clock } from 'lucide-react';
import API from '../../services/api';
import Sidebar from '../../components/Sidebar';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await API.get('/admin/dashboard');
        setData(res.data);
      } catch (err) {
        console.error('Error fetching admin dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex bg-slate-50 min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8 flex justify-center items-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </main>
      </div>
    );
  }

  if (!data) return null;
  const { stats, recentOrders, lowStockProducts } = data;

  const statCards = [
    { label: 'Total Revenue', value: `₹${stats.totalSales.toFixed(2)}`, icon: <IndianRupee size={24} className="text-emerald-600" />, bg: 'bg-emerald-50 border-emerald-100' },
    { label: 'Total Orders', value: stats.totalOrders, icon: <ShoppingCart size={24} className="text-blue-600" />, bg: 'bg-blue-50 border-blue-100' },
    { label: 'Inventory Items', value: stats.totalProducts, icon: <Package size={24} className="text-indigo-600" />, bg: 'bg-indigo-50 border-indigo-100' },
    { label: 'Registered Customers', value: stats.totalUsers, icon: <Users size={24} className="text-purple-600" />, bg: 'bg-purple-50 border-purple-100' }
  ];

  return (
    <div className="flex bg-slate-50 min-h-screen">
      
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Admin Content Container */}
      <main className="flex-1 p-6 md:p-8 space-y-8 overflow-y-auto max-w-7xl mx-auto">
        
        {/* Header greeting */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Overview Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">Real-time summaries of store revenues, users, and stocks.</p>
          </div>
          
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-white border border-slate-200 py-1.5 px-3 rounded-lg shadow-sm">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
            <span>Live System Monitor</span>
          </div>
        </div>

        {/* Aggregate Stats Cards Grid */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, idx) => (
            <div key={idx} className={`bg-white border rounded-2xl p-6 shadow-sm flex items-center justify-between ${card.bg}`}>
              <div className="space-y-1.5">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{card.label}</p>
                <p className="text-2xl font-black text-slate-800">{card.value}</p>
              </div>
              <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                {card.icon}
              </div>
            </div>
          ))}
        </section>

        {/* Dual Panel widgets */}
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column: Recent Orders List (Span 2) */}
          <section className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                <Clock size={16} className="text-blue-500" />
                <span>Recent Customer Orders</span>
              </h3>
              
              <button
                onClick={() => navigate('/admin/orders')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Manage All</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="overflow-x-auto">
              {recentOrders.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm font-medium">
                  No orders placed in the system yet.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="px-6 py-3.5">Order ID</th>
                      <th className="px-6 py-3.5">Customer</th>
                      <th className="px-6 py-3.5">Total Billing</th>
                      <th className="px-6 py-3.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                    {recentOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-slate-800">#TN-{ord.id}</td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-700">{ord.user_name}</p>
                          <p className="text-[10px] text-slate-400 normal-case">{ord.user_email}</p>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800">₹{parseFloat(ord.total_amount).toFixed(2)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
                            ord.status === 'Delivered' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                            ord.status === 'Cancelled' ? 'bg-red-50 text-red-800 border-red-200' :
                            ord.status === 'Shipped' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                            'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {ord.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* Right Column: Low Stock warnings */}
          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                <AlertOctagon size={16} className="text-amber-500" />
                <span>Low Stock Warnings ({lowStockProducts.length})</span>
              </h3>
            </div>
            
            <div className="p-4 divide-y divide-slate-100">
              {lowStockProducts.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm font-medium">
                  All inventory stocks are at healthy counts.
                </div>
              ) : (
                lowStockProducts.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => navigate('/admin/products')}
                    className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 rounded-lg px-2 transition-all group"
                  >
                    <div className="truncate flex-1">
                      <p className="font-semibold text-slate-800 text-xs sm:text-sm truncate group-hover:text-blue-600 transition-colors">
                        {prod.title}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                        Brand: {prod.brand}
                      </p>
                    </div>
                    
                    <div className="text-right shrink-0">
                      <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded font-bold text-[10px] ${
                        prod.stock === 0 ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {prod.stock === 0 ? 'Out of Stock' : `${prod.stock} Units`}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-bold">₹{parseFloat(prod.price).toFixed(2)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

        </div>

      </main>

    </div>
  );
};

export default AdminDashboard;
