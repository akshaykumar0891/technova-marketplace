import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Search, LogOut, LayoutDashboard, ShoppingBag, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import API from '../services/api';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Fetch categories on mount to display in a nav list
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await API.get('/products/categories');
        setCategories(res.data);
      } catch (err) {
        console.error('Error fetching categories in navbar:', err);
      }
    };
    fetchCategories();
  }, []);

  // Update search input when page changes/resets
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchQuery(params.get('search') || '');
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [location]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/products');
    }
  };

  const handleCategoryClick = (catId) => {
    navigate(`/products?category=${catId}`);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
                TechNova
              </span>
              <span className="text-xs bg-slate-900 text-white font-semibold px-2 py-0.5 rounded">
                MARKET
              </span>
            </Link>
          </div>

          {/* Search Bar (Desktop) */}
          {!['/register', '/login'].includes(location.pathname) && (
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <form onSubmit={handleSearchSubmit} className="relative w-full">
                <input
                  type="text"
                  placeholder="Search premium electronics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg py-2 pl-4 pr-10 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-sm"
                />
                <button type="submit" className="absolute right-3 top-2.5 text-slate-400 hover:text-blue-600">
                  <Search size={18} />
                </button>
              </form>
            </div>
          )}

          {/* Nav Links (Desktop) */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/products" className="text-slate-600 hover:text-blue-600 font-medium text-sm transition-colors">
              All Products
            </Link>

            {/* Categories Menu */}
            <div className="relative group">
              <button className="text-slate-600 hover:text-blue-600 font-medium text-sm transition-colors flex items-center">
                Categories
              </button>
              <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 py-1">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id)}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Cart Icon */}
            <Link to="/cart" className="relative p-2 text-slate-600 hover:text-blue-600 transition-colors">
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full transform translate-x-1/3 -translate-y-1/3">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Profile / Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-slate-700 focus:outline-none"
                >
                  <User size={18} />
                  <span className="text-sm font-medium max-w-[100px] truncate">{user.name}</span>
                </button>
                
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs text-slate-400">Signed in as</p>
                      <p className="text-sm font-semibold text-slate-800 truncate">{user.email}</p>
                    </div>
                    
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                      >
                        <LayoutDashboard size={16} />
                        <span>Admin Console</span>
                      </Link>
                    )}
                    
                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                    >
                      <User size={16} />
                      <span>My Profile</span>
                    </Link>

                    <Link
                      to="/orders"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                    >
                      <ShoppingBag size={16} />
                      <span>My Orders</span>
                    </Link>
                    
                    <button
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                        navigate('/login');
                      }}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left border-t border-slate-100"
                    >
                      <LogOut size={16} />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-semibold bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 hover:shadow-sm active:scale-95 transition-all"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-4">
            <Link to="/cart" className="relative p-2 text-slate-600 hover:text-blue-600 transition-colors">
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-blue-600 rounded-full transform translate-x-1/3 -translate-y-1/3">
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-600 hover:text-blue-600 focus:outline-none"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-3 shadow-md animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Search bar inside mobile menu */}
          {!['/register', '/login'].includes(location.pathname) && (
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 border border-slate-200 rounded-lg py-2 pl-4 pr-10 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-sm"
              />
              <button type="submit" className="absolute right-3 top-2.5 text-slate-400 hover:text-blue-600">
                <Search size={18} />
              </button>
            </form>
          )}

          <Link
            to="/products"
            className="block text-slate-700 hover:text-blue-600 hover:bg-slate-50 px-3 py-2 rounded-md font-medium text-sm transition-colors"
          >
            All Products
          </Link>

          {/* Categories expandable inside mobile */}
          <div>
            <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Categories</p>
            <div className="grid grid-cols-2 gap-1 px-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className="text-left text-slate-600 hover:text-blue-600 hover:bg-slate-50 px-2 py-1.5 rounded text-sm transition-colors"
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* User operations inside mobile */}
          {user ? (
            <div className="space-y-1 pt-1">
              <div className="px-3 py-1">
                <p className="text-xs text-slate-400">Logged in as</p>
                <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
              </div>
              
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className="block text-slate-700 hover:text-blue-600 hover:bg-slate-50 px-3 py-2 rounded-md text-sm transition-colors"
                >
                  Admin Console
                </Link>
              )}
              
              <Link
                to="/profile"
                className="block text-slate-700 hover:text-blue-600 hover:bg-slate-50 px-3 py-2 rounded-md text-sm transition-colors"
              >
                My Profile
              </Link>
              
              <Link
                to="/orders"
                className="block text-slate-700 hover:text-blue-600 hover:bg-slate-50 px-3 py-2 rounded-md text-sm transition-colors"
              >
                My Orders
              </Link>
              
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="w-full text-left text-red-600 hover:bg-red-50 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="flex flex-col space-y-2 pt-2">
              <Link
                to="/login"
                className="text-center border border-slate-300 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="text-center bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
