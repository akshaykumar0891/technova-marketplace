import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Users, ShoppingBag, ArrowLeft, Shield, ShieldAlert, MessageSquare } from 'lucide-react';

const Sidebar = () => {
  const links = [
    { to: '/admin', icon: <LayoutDashboard size={20} />, label: 'Dashboard', end: true },
    { to: '/admin/products', icon: <ShoppingBag size={20} />, label: 'Products' },
    { to: '/admin/orders', icon: <ShoppingCart size={20} />, label: 'Orders' },
    { to: '/admin/users', icon: <Users size={20} />, label: 'Users' },
    { to: '/admin/deactivations', icon: <ShieldAlert size={20} />, label: 'Deactivations' },
    { to: '/admin/reviews', icon: <MessageSquare size={20} />, label: 'Reviews' }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen flex flex-col border-r border-slate-800 shrink-0">
      
      {/* Admin Panel Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
        <Link to="/admin" className="flex items-center space-x-2">
          <Shield className="text-blue-500 fill-blue-500/20" size={22} />
          <span className="font-bold text-white tracking-wide text-lg">
            Admin Console
          </span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'hover:bg-slate-800 hover:text-white text-slate-400'
              }`
            }
          >
            {link.icon}
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Back to store navigation footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950">
        <Link
          to="/"
          className="flex items-center justify-center space-x-2 w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors border border-slate-700"
        >
          <ArrowLeft size={16} />
          <span>Exit Console</span>
        </Link>
      </div>

    </aside>
  );
};

export default Sidebar;
