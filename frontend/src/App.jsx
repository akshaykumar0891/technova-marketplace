import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Shield, Sparkles } from 'lucide-react';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import ChatBot from './components/ChatBot';

// Storefront Pages
import Home from './pages/Home';
import ProductCatalog from './pages/ProductCatalog';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';

// Admin Console Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminDeactivations from './pages/admin/AdminDeactivations';
import AdminReviews from './pages/admin/AdminReviews';

// Storefront Layout Wrapper
const StorefrontLayout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      
      {/* AI Chatbot Assistant */}
      <ChatBot />
      
      {/* Premium Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-white">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                TechNova
              </span>
              <span className="text-[10px] bg-blue-600/20 text-blue-400 font-bold px-2 py-0.5 rounded border border-blue-500/20">
                E-COMM
              </span>
            </div>
            <p className="text-xs leading-relaxed max-w-xs text-slate-400">
              Modern full-stack electronics e-commerce platform engineered for smart shopping and premium devices.
            </p>
          </div>

          {/* Quick links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/" className="hover:text-white transition-colors">Home Page</Link></li>
              <li><Link to="/products" className="hover:text-white transition-colors">All Products</Link></li>
              <li><Link to="/cart" className="hover:text-white transition-colors">My Cart</Link></li>
            </ul>
          </div>

          {/* Account links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest">My Account</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/profile" className="hover:text-white transition-colors">Profile Details</Link></li>
              <li><Link to="/orders" className="hover:text-white transition-colors">Order Tracking</Link></li>
              <li><Link to="/admin" className="hover:text-white transition-colors flex items-center gap-1"><Shield size={12}/>Admin Console</Link></li>
            </ul>
          </div>

          {/* Tech Stack */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1">
              <Sparkles size={12} className="text-blue-400" />
              <span>Technology Stack</span>
            </h4>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Frontend: React.js, Tailwind CSS, Lucide icons.<br />
              Backend: Node.js, Express.js, JWT, bcryptjs.<br />
              Database: MySQL/SQLite Relational Adapter.
            </p>
          </div>
        </div>
        
        <div className="border-t border-slate-800/60 py-6 text-center text-[10px] text-slate-600 bg-slate-950">
          <p>© {new Date().getFullYear()} TechNova Marketplace. All rights reserved. Relational database indices active.</p>
        </div>
      </footer>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Routes>
            
            {/* PUBLIC STOREFRONT PATHS */}
            <Route path="/" element={<StorefrontLayout><Home /></StorefrontLayout>} />
            <Route path="/products" element={<StorefrontLayout><ProductCatalog /></StorefrontLayout>} />
            <Route path="/product/:id" element={<StorefrontLayout><ProductDetails /></StorefrontLayout>} />
            <Route path="/login" element={<StorefrontLayout><Login /></StorefrontLayout>} />
            <Route path="/register" element={<StorefrontLayout><Register /></StorefrontLayout>} />

            {/* SECURE PROTECTED CUSTOMER PATHS */}
            <Route element={<ProtectedRoute adminOnly={false} />}>
              <Route path="/cart" element={<StorefrontLayout><Cart /></StorefrontLayout>} />
              <Route path="/checkout" element={<StorefrontLayout><Checkout /></StorefrontLayout>} />
              <Route path="/orders" element={<StorefrontLayout><Orders /></StorefrontLayout>} />
              <Route path="/profile" element={<StorefrontLayout><Profile /></StorefrontLayout>} />
            </Route>

            {/* SECURE PROTECTED ADMINISTRATOR PATHS */}
            <Route element={<ProtectedRoute adminOnly={true} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/products" element={<AdminProducts />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/deactivations" element={<AdminDeactivations />} />
              <Route path="/admin/reviews" element={<AdminReviews />} />
            </Route>

          </Routes>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
