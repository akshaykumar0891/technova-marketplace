import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Laptop, Smartphone, Gamepad2, Headphones, Watch, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import API from '../services/api';
import ProductCard from '../components/ProductCard';

const Home = () => {
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch 4 featured products on mount
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await API.get('/products');
        // Slice the first 4 products
        setFeaturedProducts(res.data.slice(0, 4));
      } catch (err) {
        console.error('Error fetching featured products on homepage:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const categoryIcons = {
    'laptops': <Laptop className="w-6 h-6 text-current" />,
    'smartphones': <Smartphone className="w-6 h-6 text-current" />,
    'gaming': <Gamepad2 className="w-6 h-6 text-current" />,
    'audio': <Headphones className="w-6 h-6 text-current" />,
    'accessories': <Watch className="w-6 h-6 text-current" />
  };

  const categories = [
    { id: 1, name: 'Laptops', slug: 'laptops', image: 'https://images.unsplash.com/photo-1496181130204-7552cc14b1b0?auto=format&fit=crop&q=80&w=400' },
    { id: 2, name: 'Smartphones', slug: 'smartphones', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=400' },
    { id: 3, name: 'Gaming', slug: 'gaming', image: 'https://images.unsplash.com/photo-1600861195091-690c92f1d2cc?auto=format&fit=crop&q=80&w=400' },
    { id: 4, name: 'Audio', slug: 'audio', image: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&q=80&w=400' },
    { id: 5, name: 'Accessories', slug: 'accessories', image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=400' }
  ];

  return (
    <div className="space-y-16 pb-16">
      
      {/* Hero Section */}
      <section className="relative bg-slate-900 text-white overflow-hidden rounded-b-[2rem] shadow-xl">
        {/* Background Overlay Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-900 to-slate-900 z-0"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 relative z-10 grid md:grid-cols-2 gap-12 items-center">
          {/* Hero Left */}
          <div className="space-y-6 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-400">
              TechNova Flagship Showcase
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Elevate Your <br />
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Digital Experience
              </span>
            </h1>
            <p className="text-slate-400 text-base sm:text-lg max-w-md mx-auto md:mx-0">
              Discover cutting-edge gadgets, power laptops, and smart tech devices curated for premium lifestyles.
            </p>
            <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-4">
              <Link
                to="/products"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg hover:shadow-lg hover:shadow-blue-600/20 active:scale-98 transition-all"
              >
                <span>Shop Catalog</span>
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/products?brand=Apple"
                className="inline-flex items-center justify-center border border-slate-700 hover:border-slate-500 bg-slate-800/50 text-slate-200 font-medium px-6 py-3 rounded-lg transition-colors"
              >
                Apple Products
              </Link>
            </div>
          </div>

          {/* Hero Right: Product Graphic */}
          <div className="flex justify-center relative">
            <div className="absolute w-72 h-72 bg-blue-500/20 rounded-full blur-3xl -z-10"></div>
            <img
              src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600"
              alt="Ultimate Gaming Setup Setup"
              className="w-full max-w-[450px] rounded-2xl shadow-2xl object-cover aspect-[4/3] border border-slate-800"
            />
          </div>
        </div>
      </section>

      {/* Selling Points Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-slate-700">
        <div className="flex items-start gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <Truck className="text-blue-600 w-10 h-10 shrink-0" />
          <div>
            <h4 className="font-semibold text-slate-800">Free Insured Shipping</h4>
            <p className="text-xs text-slate-500 mt-1">Get free delivery on orders over ₹500, tracked & fully insured.</p>
          </div>
        </div>
        <div className="flex items-start gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <ShieldCheck className="text-blue-600 w-10 h-10 shrink-0" />
          <div>
            <h4 className="font-semibold text-slate-800">Authorized Dealer Warranty</h4>
            <p className="text-xs text-slate-500 mt-1">All products include 100% official brand warranty certificates.</p>
          </div>
        </div>
        <div className="flex items-start gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
          <RefreshCw className="text-blue-600 w-10 h-10 shrink-0" />
          <div>
            <h4 className="font-semibold text-slate-800">30-Day Hassle-Free Returns</h4>
            <p className="text-xs text-slate-500 mt-1">Change your mind? Return your products easily for a refund.</p>
          </div>
        </div>
      </section>

      {/* Categories Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Shop by Categories</h2>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">Explore tailored tech ecosystems engineered for your productivity.</p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => navigate(`/products?category=${cat.id}`)}
              className="category-card bg-white border border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-center space-y-4 transition-all text-center cursor-pointer"
            >
              <div className="category-icon p-3 bg-blue-50 rounded-xl text-blue-600 transition-colors">
                {categoryIcons[cat.slug] || <Laptop className="w-6 h-6" />}
              </div>
              <span className="category-title font-semibold text-sm text-slate-800 transition-colors">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-end justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Featured Releases</h2>
            <p className="text-slate-500 text-sm mt-1">Our newest and most popular tech gear.</p>
          </div>
          <Link to="/products" className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1">
            <span>View All</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 animate-pulse">
                <div className="bg-slate-100 aspect-square rounded-lg w-full"></div>
                <div className="h-4 bg-slate-100 rounded w-1/3"></div>
                <div className="h-6 bg-slate-100 rounded w-3/4"></div>
                <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                <div className="flex justify-between items-center pt-2">
                  <div className="h-6 bg-slate-100 rounded w-1/4"></div>
                  <div className="h-8 bg-slate-100 rounded-lg w-8"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

    </div>
  );
};

export default Home;
