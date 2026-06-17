import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, AlertOctagon, CheckSquare, Search } from 'lucide-react';
import API from '../../services/api';
import Sidebar from '../../components/Sidebar';
import Alert from '../../components/Alert';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ type: '', message: '' });

  // Search filter inside admin view
  const [searchQuery, setSearchQuery] = useState('');

  // Modal / Form states
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editProductId, setEditProductId] = useState(null);
  const [formData, setFormData] = useState({
    category_id: '',
    title: '',
    description: '',
    price: '',
    brand: '',
    stock: '',
    image_url: ''
  });

  const fetchProductsAndCategories = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        API.get('/products'),
        API.get('/products/categories')
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error('Error fetching admin products data:', err);
      setStatus({ type: 'error', message: 'Failed to fetch catalog data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsAndCategories();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenCreateModal = () => {
    setEditMode(false);
    setEditProductId(null);
    setFormData({
      category_id: categories.length > 0 ? categories[0].id : '',
      title: '',
      description: '',
      price: '',
      brand: '',
      stock: '',
      image_url: ''
    });
    setStatus({ type: '', message: '' });
    setShowModal(true);
  };

  const handleOpenEditModal = (product) => {
    setEditMode(true);
    setEditProductId(product.id);
    setFormData({
      category_id: product.category_id,
      title: product.title,
      description: product.description || '',
      price: product.price,
      brand: product.brand || '',
      stock: product.stock,
      image_url: product.image_url || ''
    });
    setStatus({ type: '', message: '' });
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    const { category_id, title, price, stock } = formData;
    if (!category_id || !title || !price || stock === '') {
      setStatus({ type: 'error', message: 'Required fields: Category, Title, Price, and Stock.' });
      return;
    }

    try {
      if (editMode) {
        await API.put(`/admin/products/${editProductId}`, formData);
        setStatus({ type: 'success', message: 'Product updated successfully.' });
      } else {
        await API.post('/admin/products', formData);
        setStatus({ type: 'success', message: 'New product added to catalog successfully.' });
      }
      setShowModal(false);
      fetchProductsAndCategories();
    } catch (error) {
      console.error('Error saving product:', error);
      setStatus({ 
        type: 'error', 
        message: error.response?.data?.message || 'Failed to save product.' 
      });
    }
  };

  const handleDeleteProduct = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    
    setStatus({ type: '', message: '' });
    try {
      await API.delete(`/admin/products/${id}`);
      setStatus({ type: 'success', message: `"${title}" has been deleted.` });
      fetchProductsAndCategories();
    } catch (error) {
      console.error('Error deleting product:', error);
      setStatus({ 
        type: 'error', 
        message: error.response?.data?.message || 'Failed to delete product.' 
      });
    }
  };

  // Filter products locally for search matching
  const filteredProducts = products.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto">
        
        {/* Header toolbar */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Products Catalog</h1>
            <p className="text-slate-500 text-sm mt-1">Add, update, or remove electronics inventory items.</p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-lg active:scale-95 transition-all text-sm cursor-pointer shadow-md"
          >
            <Plus size={16} />
            <span>Add New Product</span>
          </button>
        </div>

        {status.message && <Alert type={status.type} message={status.message} />}

        {/* Tabular products list */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          
          {/* Table Toolbar Search */}
          <div className="p-4 border-b border-slate-100 flex gap-4 items-center">
            <div className="relative flex-1 max-w-xs text-xs">
              <input
                type="text"
                placeholder="Search products by title or brand..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-8 pr-4 focus:outline-none focus:border-blue-500 focus:bg-white text-xs"
              />
              <Search className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
            </div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider ml-auto">
              Total: {filteredProducts.length} items
            </span>
          </div>

          <div className="overflow-x-auto">
            {loading && products.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Loading catalog...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-sm font-medium">
                No products found matching query.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="px-6 py-3.5">Product Details</th>
                    <th className="px-6 py-3.5">Category</th>
                    <th className="px-6 py-3.5">Price</th>
                    <th className="px-6 py-3.5">Stock</th>
                    <th className="px-6 py-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {filteredProducts.map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-50/30 transition-colors">
                      {/* Details */}
                      <td className="px-6 py-4 flex items-center gap-3">
                        <div className="w-10 h-10 border border-slate-100 bg-slate-50 rounded p-0.5 shrink-0 flex items-center justify-center">
                          <img
                            src={prod.image_url || 'https://placeholder.com/60'}
                            alt={prod.title}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <div className="truncate max-w-[200px]">
                          <p className="font-bold text-slate-800 truncate">{prod.title}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{prod.brand}</p>
                        </div>
                      </td>
                      {/* Category */}
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-slate-200">
                          {prod.category_name}
                        </span>
                      </td>
                      {/* Price */}
                      <td className="px-6 py-4 font-bold text-slate-800">₹{parseFloat(prod.price).toFixed(2)}</td>
                      {/* Stock */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-0.5 font-bold ${
                          prod.stock === 0
                            ? 'text-red-600'
                            : prod.stock <= 5
                            ? 'text-amber-600 animate-pulse'
                            : 'text-slate-700'
                        }`}>
                          {prod.stock <= 5 && <AlertOctagon size={12} />}
                          <span>{prod.stock} Units</span>
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(prod)}
                            className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 text-blue-600 transition-colors cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod.id, prod.title)}
                            className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 text-red-600 transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* CREATE / EDIT DIALOG MODAL */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2 uppercase tracking-wide">
                  <CheckSquare className="text-blue-600" size={18} />
                  <span>{editMode ? 'Edit Product Profile' : 'Register New Product'}</span>
                </h3>
                
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body Forms */}
              <form onSubmit={handleFormSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
                
                {/* Product Title */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Product Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:bg-white"
                    placeholder="e.g. Asus ROG Zephyrus Laptop"
                    required
                  />
                </div>

                {/* Brand & Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Brand Name</label>
                    <input
                      type="text"
                      name="brand"
                      value={formData.brand}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:bg-white"
                      placeholder="e.g. ASUS"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Product Category</label>
                    <select
                      name="category_id"
                      value={formData.category_id}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:bg-white font-semibold"
                      required
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Price & Stock */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Price (₹ INR)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:bg-white"
                      placeholder="e.g. 1599.99"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Inventory Stock</label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:bg-white"
                      placeholder="e.g. 10"
                      required
                    />
                  </div>
                </div>

                {/* Image URL */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Product Image URL</label>
                  <input
                    type="url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:bg-white"
                    placeholder="https://images.unsplash.com/... (image address)"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Description Details</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:bg-white resize-none"
                    placeholder="Provide highlights of hardware, memory, screen dimensions..."
                  ></textarea>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-5 rounded-lg active:scale-95 transition-all cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg active:scale-95 transition-all cursor-pointer shadow-sm"
                  >
                    Save Changes
                  </button>
                </div>

              </form>

            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default AdminProducts;
