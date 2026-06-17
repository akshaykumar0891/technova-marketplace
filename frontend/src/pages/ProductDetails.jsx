import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Star, Plus, Minus, Check, ArrowLeft, PackageCheck, AlertTriangle, MessageSquare, Send } from 'lucide-react';
import API from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';

const ProductDetails = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { token } = useAuth();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Review states
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState('0.0');
  const [reviewsCount, setReviewsCount] = useState(0);
  const [newReview, setNewReview] = useState({ rating: 5, title: '', comment: '', image_url: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewStatus, setReviewStatus] = useState({ type: '', message: '' });
  const [lightboxImage, setLightboxImage] = useState(null);
  const [imageInputMode, setImageInputMode] = useState('upload'); // 'upload' or 'url'

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setReviewStatus({ type: 'error', message: 'Image size should be less than 2MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewReview(prev => ({ ...prev, image_url: reader.result }));
      setReviewStatus({ type: '', message: '' });
    };
    reader.readAsDataURL(file);
  };

  const fetchReviews = async () => {
    try {
      const res = await API.get(`/products/${id}/reviews`);
      setReviews(res.data.reviews || []);
      setAvgRating(res.data.avgRating || '0.0');
      setReviewsCount(res.data.count || 0);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    }
  };

  // Fetch product detail and related products when ID changes
  useEffect(() => {
    const fetchProductAndRelated = async () => {
      setLoading(true);
      setErrorMsg('');
      setQuantity(1);
      try {
        const prodRes = await API.get(`/products/${id}`);
        setProduct(prodRes.data);
        
        // Fetch related products in the same category
        const relRes = await API.get(`/products?category=${prodRes.data.category_id}`);
        // Filter out current product and take at most 4
        const filtered = relRes.data
          .filter(item => item.id !== parseInt(id))
          .slice(0, 4);
        setRelatedProducts(filtered);

        // Fetch reviews
        await fetchReviews();

      } catch (err) {
        console.error('Error fetching product details:', err);
        setErrorMsg('Product not found or database link issue.');
      } finally {
        setLoading(false);
      }
    };
    fetchProductAndRelated();
  }, [id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!newReview.title.trim()) {
      setReviewStatus({ type: 'error', message: 'Review title is required.' });
      return;
    }
    setSubmittingReview(true);
    setReviewStatus({ type: '', message: '' });
    try {
      await API.post(`/products/${id}/reviews`, newReview);
      setReviewStatus({ type: 'success', message: 'Thank you! Your review has been submitted.' });
      setNewReview({ rating: 5, title: '', comment: '', image_url: '' });
      await fetchReviews();
    } catch (err) {
      console.error('Error submitting review:', err);
      setReviewStatus({
        type: 'error',
        message: err.response?.data?.message || 'Failed to submit review.'
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleIncrement = () => {
    if (product && quantity < product.stock) {
      setQuantity(prev => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    setAdding(true);
    setErrorMsg('');
    
    const result = await addToCart(product.id, quantity);
    
    setAdding(false);
    if (result.success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } else {
      setErrorMsg(result.message);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse space-y-8">
        <div className="h-6 bg-slate-200 rounded w-16 mb-4"></div>
        <div className="grid md:grid-cols-2 gap-12">
          <div className="bg-slate-200 aspect-square rounded-2xl"></div>
          <div className="space-y-6">
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="h-8 bg-slate-200 rounded w-3/4"></div>
            <div className="h-6 bg-slate-200 rounded w-1/3"></div>
            <div className="h-20 bg-slate-200 rounded w-full"></div>
            <div className="h-10 bg-slate-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (errorMsg && !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
        <div className="text-red-500 font-bold text-lg">{errorMsg}</div>
        <Link to="/products" className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:underline">
          <ArrowLeft size={16} />
          <span>Back to Catalog</span>
        </Link>
      </div>
    );
  }

  if (!product) return null;

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
      
      {/* Back to Products */}
      <div>
        <Link to="/products" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium text-sm transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to Products</span>
        </Link>
      </div>

      {/* Main Grid details */}
      <section className="grid md:grid-cols-2 gap-12 items-start">
        
        {/* Left: Product Image */}
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden aspect-square flex items-center justify-center p-6 relative">
          <img
            src={product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600'}
            alt={product.title}
            className="max-h-full max-w-full object-contain rounded-2xl"
          />
          {isOutOfStock && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center rounded-3xl">
              <span className="bg-red-600 text-white font-bold text-sm uppercase px-4 py-2 rounded-xl tracking-wider">
                Out Of Stock
              </span>
            </div>
          )}
        </div>

        {/* Right: Info */}
        <div className="space-y-6">
          <div className="space-y-2">
            <span className="inline-block bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {product.category_name}
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight leading-tight">
              {product.title}
            </h1>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">
              Brand: <span className="text-slate-600 font-semibold">{product.brand}</span>
            </p>
          </div>

          {/* Rating */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={18} className={i < Math.round(parseFloat(avgRating)) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"} />
              ))}
            </div>
            <span className="text-sm text-slate-500 font-bold">{avgRating} ({reviewsCount} customer reviews)</span>
          </div>

          {/* Price */}
          <div className="text-3xl font-black text-slate-950">
            ₹{parseFloat(product.price).toFixed(2)}
          </div>

          {/* Stock Badging */}
          <div className="border-t border-b border-slate-100 py-3 flex items-center">
            {isOutOfStock ? (
              <span className="inline-flex items-center text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-md">
                Currently Out of Stock
              </span>
            ) : isLowStock ? (
              <span className="inline-flex items-center text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md animate-pulse">
                <AlertTriangle size={14} className="mr-1" />
                Hurry! Only {product.stock} items left in stock
              </span>
            ) : (
              <span className="inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                <PackageCheck size={14} className="mr-1" />
                In Stock & Ready to Ship ({product.stock} available)
              </span>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Product Overview</h3>
            <p className="text-slate-600 text-sm leading-relaxed">{product.description}</p>
          </div>

          {/* Quantity Selector & Add button */}
          {!isOutOfStock && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center space-x-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quantity</span>
                <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
                  <button
                    onClick={handleDecrement}
                    className="p-2.5 hover:bg-slate-50 text-slate-500 active:bg-slate-100 transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="px-4 py-1 text-sm font-bold text-slate-800 select-none min-w-[32px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={handleIncrement}
                    disabled={quantity >= product.stock}
                    className="p-2.5 hover:bg-slate-50 text-slate-500 active:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={adding}
                  className={`flex-1 py-3.5 px-6 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                    added
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 active:scale-98'
                  }`}
                >
                  {adding ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : added ? (
                    <>
                      <Check size={18} />
                      <span>Added To Cart</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={18} />
                      <span>Add to Shopping Cart</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm text-center shadow-md animate-in fade-in duration-200">
              {errorMsg}
            </div>
          )}

        </div>
      </section>

      {/* Reviews Section */}
      <section className="border-t border-slate-200 pt-12 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-800">Customer Reviews</h2>
            <p className="text-slate-500 text-sm">See what other buyers say about this product.</p>
          </div>
          <div className="flex items-center space-x-4 bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl">
            <div className="text-center">
              <span className="text-3xl font-black text-slate-800">{avgRating}</span>
              <span className="text-xs text-slate-400 font-semibold block">out of 5</span>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div>
              <div className="flex items-center space-x-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className={i < Math.round(parseFloat(avgRating)) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"} />
                ))}
              </div>
              <span className="text-xs text-slate-500 font-bold block mt-0.5">{reviewsCount} ratings total</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Reviews List */}
          <div className="lg:col-span-2 space-y-4">
            {reviews.length === 0 ? (
              <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center text-slate-400 text-sm font-medium">
                No reviews yet. Be the first to leave a feedback!
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div key={rev.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-800">{rev.user_name}</p>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={12} className={i < rev.rating ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-200"} />
                            ))}
                          </div>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {new Date(rev.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-800 text-sm">{rev.title}</h4>
                      <p className="text-slate-600 text-sm leading-relaxed">{rev.comment}</p>
                      {rev.image_url && (
                        <div className="mt-3">
                          <img
                            src={rev.image_url}
                            alt="Customer review attachment"
                            className="w-20 h-20 object-cover rounded-xl border border-slate-200 shadow-sm cursor-zoom-in hover:opacity-90 transition-opacity"
                            onClick={() => setLightboxImage(rev.image_url)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submission Form (Only if logged in) */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4 text-xs font-semibold text-slate-500">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-b border-slate-100 pb-3">
              Write a Review
            </h3>

            {token ? (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                {reviewStatus.message && (
                  <div className={`p-3 rounded-lg text-xs leading-normal ${
                    reviewStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-red-50 text-red-800 border border-red-100'
                  }`}>
                    {reviewStatus.message}
                  </div>
                )}
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rating Star Count</label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                        className="p-1 hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                      >
                        <Star
                          size={24}
                          className={star <= newReview.rating ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-200"}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Review Headline</label>
                  <input
                    type="text"
                    value={newReview.title}
                    onChange={(e) => setNewReview(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-medium text-xs normal-case"
                    placeholder="Summarize your experience..."
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Detailed Review</label>
                  <textarea
                    value={newReview.comment}
                    onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                    rows="4"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white resize-none font-medium text-xs normal-case"
                    placeholder="What did you like or dislike about this product?..."
                  ></textarea>
                </div>

                {/* Review Photo Attachment */}
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Add Product Image (Optional)</label>
                  
                  {/* Mode Tabs */}
                  <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-slate-50 text-[10px] font-bold uppercase tracking-wider">
                    <button
                      type="button"
                      onClick={() => {
                        setImageInputMode('upload');
                        setNewReview(prev => ({ ...prev, image_url: '' }));
                      }}
                      className={`flex-1 py-1.5 transition-colors cursor-pointer ${
                        imageInputMode === 'upload' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImageInputMode('url');
                        setNewReview(prev => ({ ...prev, image_url: '' }));
                      }}
                      className={`flex-1 py-1.5 transition-colors cursor-pointer ${
                        imageInputMode === 'url' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      Image URL
                    </button>
                  </div>

                  {imageInputMode === 'upload' ? (
                    <div className="mt-1">
                      <label className="flex flex-col items-center justify-center border border-slate-200 hover:border-blue-400 rounded-xl p-4 cursor-pointer transition-all bg-slate-50/50">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Local Image</span>
                        <span className="text-[9px] text-slate-400 font-semibold mt-1">JPEG, PNG up to 2MB</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="mt-1">
                      <input
                        type="text"
                        value={newReview.image_url.startsWith('data:') ? '' : newReview.image_url}
                        onChange={(e) => setNewReview(prev => ({ ...prev, image_url: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-medium text-xs normal-case"
                        placeholder="Paste image web link (https://...)"
                      />
                    </div>
                  )}

                  {/* Preview box if image_url is populated */}
                  {newReview.image_url && (
                    <div className="relative w-20 h-20 border border-slate-200 rounded-xl overflow-hidden mt-2 group shadow-sm">
                      <img src={newReview.image_url} alt="Uploaded preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setNewReview(prev => ({ ...prev, image_url: '' }))}
                        className="absolute inset-0 bg-slate-900/75 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 font-bold text-[9px] uppercase cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm text-xs"
                >
                  {submittingReview ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Send size={12} />
                      <span>Submit Review</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="text-center py-6 space-y-3 bg-slate-50 rounded-xl border border-slate-100 p-4">
                <p className="text-xs text-slate-500 leading-normal font-medium">Please sign in to write customer reviews and rate this product.</p>
                <Link
                  to="/login"
                  className="inline-block bg-white border border-slate-200 text-blue-600 hover:bg-slate-50 font-bold px-4 py-2 rounded-lg text-xs"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Related Products Showcase */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6 border-t border-slate-200 pt-12">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-800">You May Also Like</h2>
            <p className="text-slate-500 text-sm">Similar electronic items in this category.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </section>
      )}

      {/* Review Image Lightbox Modal */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-12 right-0 bg-white/10 hover:bg-white/20 text-white rounded-full p-2.5 transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={lightboxImage}
              alt="Full size review product"
              className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl border border-slate-800 animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductDetails;
