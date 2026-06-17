import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Calendar, Landmark, CheckCircle, Clock, Truck, XCircle, Printer } from 'lucide-react';
import API from '../services/api';
import Alert from '../components/Alert';

const Orders = () => {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successBanner, setSuccessBanner] = useState(location.state?.successMessage || '');

  // Fetch orders on mount
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await API.get('/orders');
        setOrders(res.data);
      } catch (err) {
        console.error('Error fetching order list:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();

    // Clear history state on navigate refresh
    window.history.replaceState({}, document.title);
  }, []);

  const statusIcons = {
    'Pending': <Clock className="w-3.5 h-3.5 text-amber-600" />,
    'Shipped': <Truck className="w-3.5 h-3.5 text-blue-600" />,
    'Delivered': <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />,
    'Cancelled': <XCircle className="w-3.5 h-3.5 text-red-600" />
  };

  const statusColors = {
    'Pending': 'bg-amber-50 text-amber-800 border-amber-200',
    'Shipped': 'bg-blue-50 text-blue-800 border-blue-200',
    'Delivered': 'bg-emerald-50 text-emerald-800 border-emerald-200',
    'Cancelled': 'bg-red-50 text-red-800 border-red-200'
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex justify-center items-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Order History</h1>
        <p className="text-slate-500 text-sm mt-1">Track current shipments and view billing records.</p>
      </div>

      {/* Success checkout banner */}
      {successBanner && (
        <div className="animate-in fade-in duration-300">
          <Alert type="success" message={successBanner} />
        </div>
      )}

      {/* Order Logs list */}
      {orders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl py-20 px-4 text-center max-w-md mx-auto shadow-sm flex flex-col items-center space-y-5">
          <div className="p-4 bg-slate-100 rounded-full text-slate-400">
            <ShoppingBag size={40} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-800">No Orders Found</h3>
            <p className="text-sm text-slate-500">
              You haven't placed any purchases yet. Your tracking invoices will appear here.
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg active:scale-95 transition-all text-sm shadow-sm"
          >
            <span>Explore Electronics Catalog</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              
              {/* Order Card Header */}
              <div className="bg-slate-50 border-b border-slate-100 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
                
                {/* Meta details */}
                <div className="flex flex-wrap gap-4 sm:gap-6 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  <div>
                    <p className="text-[10px] text-slate-400">Date Ordered</p>
                    <div className="flex items-center gap-1 text-slate-700 mt-1 font-bold">
                      <Calendar size={13} className="text-slate-400" />
                      <span>{new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-400">Invoice Number</p>
                    <div className="flex items-center gap-1 text-slate-700 mt-1 font-bold font-mono">
                      <span>#TN-{order.id}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-400">Billing Total</p>
                    <div className="flex items-center gap-1 text-blue-600 mt-1 font-extrabold text-sm sm:text-base">
                      <Landmark size={13} className="text-slate-400" />
                      <span>₹{parseFloat(order.total_amount).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Status Badging & Print Button */}
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColors[order.status]}`}>
                    {statusIcons[order.status]}
                    <span>{order.status}</span>
                  </span>
                  
                  <button
                    onClick={() => window.print()}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700 cursor-pointer"
                    title="Print Receipt"
                  >
                    <Printer size={15} />
                  </button>
                </div>

              </div>

              {/* Order Items list */}
              <div className="p-4 sm:p-5 divide-y divide-slate-100">
                {order.items && order.items.map((item) => (
                  <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4 text-sm">
                    {/* Thumbnail */}
                    <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center p-1">
                      <img
                        src={item.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600'}
                        alt={item.title}
                        className="max-h-full max-w-full object-contain rounded"
                      />
                    </div>
                    {/* Descriptions */}
                    <div className="flex-1 truncate">
                      <h4 className="font-semibold text-slate-800 truncate">{item.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Brand: {item.brand}</p>
                    </div>
                    {/* Price and Quantities */}
                    <div className="text-right shrink-0">
                      <p className="font-bold text-slate-800">₹{parseFloat(item.price).toFixed(2)}</p>
                      <p className="text-xs text-slate-400 font-semibold mt-0.5">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default Orders;
