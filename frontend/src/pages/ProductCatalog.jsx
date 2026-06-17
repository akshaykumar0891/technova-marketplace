import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Filter, RotateCcw, SlidersHorizontal, PackageX } from 'lucide-react';
import API from '../services/api';
import ProductCard from '../components/ProductCard';

const ProductCatalog = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Load initial states from URL query parameters
  const getUrlParams = () => {
    const params = new URLSearchParams(location.search);
    return {
      search: params.get('search') || '',
      category: params.get('category') || '',
      brand: params.get('brand') || '',
      minPrice: params.get('minPrice') || '',
      maxPrice: params.get('maxPrice') || '',
      sortBy: params.get('sortBy') || 'latest'
    };
  };

  const initialParams = getUrlParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter local states
  const [search, setSearch] = useState(initialParams.search);
  const [selectedCategory, setSelectedCategory] = useState(initialParams.category);
  const [selectedBrand, setSelectedBrand] = useState(initialParams.brand);
  const [minPrice, setMinPrice] = useState(initialParams.minPrice);
  const [maxPrice, setMaxPrice] = useState(initialParams.maxPrice);
  const [sortBy, setSortBy] = useState(initialParams.sortBy);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sync state if URL updates externally (e.g. search in navbar)
  useEffect(() => {
    const params = getUrlParams();
    setSearch(params.search);
    setSelectedCategory(params.category);
    setSelectedBrand(params.brand);
    setMinPrice(params.minPrice);
    setMaxPrice(params.maxPrice);
    setSortBy(params.sortBy);
  }, [location.search]);

  // Fetch filter options (categories and brands) on mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          API.get('/products/categories'),
          API.get('/products/brands')
        ]);
        setCategories(catRes.data);
        setBrands(brandRes.data);
      } catch (err) {
        console.error('Error fetching filter options:', err);
      }
    };
    fetchFilterOptions();
  }, []);

  // Fetch products when filters or URL query params change
  useEffect(() => {
    const fetchFilteredProducts = async () => {
      setLoading(true);
      try {
        // Construct query parameters
        const queryParams = new URLSearchParams();
        if (search) queryParams.append('search', search);
        if (selectedCategory) queryParams.append('category', selectedCategory);
        if (selectedBrand) queryParams.append('brand', selectedBrand);
        if (minPrice) queryParams.append('minPrice', minPrice);
        if (maxPrice) queryParams.append('maxPrice', maxPrice);
        if (sortBy) queryParams.append('sortBy', sortBy);

        const res = await API.get(`/products?${queryParams.toString()}`);
        setProducts(res.data);
      } catch (err) {
        console.error('Error fetching filtered products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredProducts();
  }, [search, selectedCategory, selectedBrand, minPrice, maxPrice, sortBy]);

  // Apply filters by pushing them to the URL search params
  const updateUrl = (newParams) => {
    const params = new URLSearchParams(location.search);
    Object.entries(newParams).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.set(key, val);
      } else {
        params.delete(key);
      }
    });
    navigate(`/products?${params.toString()}`, { replace: true });
  };

  const handleCategorySelect = (catId) => {
    const val = selectedCategory === String(catId) ? '' : String(catId);
    setSelectedCategory(val);
    updateUrl({ category: val });
  };

  const handleBrandSelect = (brandName) => {
    const val = selectedBrand === brandName ? '' : brandName;
    setSelectedBrand(val);
    updateUrl({ brand: val });
  };

  const handlePriceFilterSubmit = (e) => {
    e.preventDefault();
    updateUrl({ minPrice, maxPrice });
  };

  const handleSortChange = (e) => {
    const val = e.target.value;
    setSortBy(val);
    updateUrl({ sortBy: val });
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedBrand('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('latest');
    navigate('/products');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">E-Commerce Catalog</h1>
          <p className="text-slate-500 text-sm mt-1">Browse and filter our selection of smart electronics.</p>
        </div>

        {/* Search inside catalog page */}
        <div className="w-full md:max-w-xs flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search in catalog..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                updateUrl({ search: e.target.value });
              }}
              className="w-full bg-white border border-slate-300 rounded-lg py-2 pl-9 pr-4 focus:outline-none focus:border-blue-500 transition-colors text-sm"
            />
            <Search className="absolute left-3 top-3 text-slate-400" size={16} />
          </div>
          
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="md:hidden flex items-center justify-center border border-slate-300 bg-white p-2 rounded-lg text-slate-600 hover:bg-slate-50"
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>
      </div>

      <div className="flex gap-8 items-start">
        
        {/* LEFT COLUMN: FILTERS (Desktop) */}
        <aside className="hidden md:block w-64 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6 shrink-0 sticky top-20">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-sm uppercase tracking-wider">
              <Filter size={16} className="text-blue-600" />
              <span>Filters</span>
            </div>
            <button
              onClick={handleClearFilters}
              className="text-xs text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1 font-semibold cursor-pointer"
            >
              <RotateCcw size={12} />
              Reset
            </button>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Categories</h4>
            <div className="space-y-2">
              {categories.map((cat) => (
                <label key={cat.id} className="flex items-center space-x-2 text-sm text-slate-600 hover:text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCategory === String(cat.id)}
                    onChange={() => handleCategorySelect(cat.id)}
                    className="rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span className={selectedCategory === String(cat.id) ? 'font-semibold text-blue-600' : ''}>
                    {cat.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Brands */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Brands</h4>
            <div className="space-y-2">
              {brands.map((brandName) => (
                <label key={brandName} className="flex items-center space-x-2 text-sm text-slate-600 hover:text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedBrand === brandName}
                    onChange={() => handleBrandSelect(brandName)}
                    className="rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span className={selectedBrand === brandName ? 'font-semibold text-blue-600' : ''}>
                    {brandName}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Price Limit</h4>
            <form onSubmit={handlePriceFilterSubmit} className="space-y-2">
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                />
                <span className="text-slate-400 text-xs">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-1.5 rounded text-xs transition-colors cursor-pointer"
              >
                Apply Price
              </button>
            </form>
          </div>
        </aside>

        {/* RIGHT COLUMN: LIST & SORT */}
        <div className="flex-1 space-y-6 w-full">
          
          {/* Mobile Collapsible Filter Drawer */}
          {mobileFiltersOpen && (
            <div className="md:hidden bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-5 animate-in fade-in slide-in-from-top-3 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="font-bold text-slate-800 text-sm uppercase tracking-wider">Mobile Filters</div>
                <button
                  onClick={handleClearFilters}
                  className="text-xs text-red-500 font-semibold cursor-pointer"
                >
                  Reset All
                </button>
              </div>

              {/* Mobile Categories */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Categories</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategorySelect(cat.id)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        selectedCategory === String(cat.id)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Brands */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Brands</p>
                <div className="flex flex-wrap gap-2">
                  {brands.map(brandName => (
                    <button
                      key={brandName}
                      onClick={() => handleBrandSelect(brandName)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        selectedBrand === brandName
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {brandName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Prices */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Price Range</p>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    placeholder="Min Price"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Max Price"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => {
                      updateUrl({ minPrice, maxPrice });
                      setMobileFiltersOpen(false);
                    }}
                    className="bg-slate-900 text-white font-bold py-1.5 px-3 rounded text-xs"
                  >
                    Go
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sort bar & Toolbar */}
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between shadow-sm">
            <span className="text-xs sm:text-sm text-slate-500 font-medium">
              Found <span className="font-bold text-slate-800">{products.length}</span> electronic items
            </span>

            {/* Sort selection dropdown */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider hidden sm:inline">
                Sort By
              </span>
              <select
                value={sortBy}
                onChange={handleSortChange}
                className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold px-2 py-1.5 text-slate-700 focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="latest">Latest Releases</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A to Z</option>
                <option value="name_desc">Name: Z to A</option>
              </select>
            </div>
          </div>

          {/* Grid view container */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 animate-pulse">
                  <div className="bg-slate-100 aspect-square rounded-lg w-full"></div>
                  <div className="h-4 bg-slate-100 rounded w-1/3"></div>
                  <div className="h-6 bg-slate-100 rounded w-3/4"></div>
                  <div className="flex justify-between items-center pt-2">
                    <div className="h-6 bg-slate-100 rounded w-1/4"></div>
                    <div className="h-8 bg-slate-100 rounded-lg w-8"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl py-20 px-4 text-center max-w-lg mx-auto shadow-sm flex flex-col items-center space-y-4">
              <div className="p-4 bg-slate-50 rounded-full text-slate-400">
                <PackageX size={48} />
              </div>
              <h3 className="text-xl font-bold text-slate-800">No Products Found</h3>
              <p className="text-sm text-slate-500">
                Your search criteria didn't yield any results. Try checking your spelling or clearing filters.
              </p>
              <button
                onClick={handleClearFilters}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg active:scale-95 transition-all cursor-pointer"
              >
                Reset Catalog Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default ProductCatalog;
