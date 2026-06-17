import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star, Check, AlertTriangle } from 'lucide-react';
import { useCart } from '../context/CartContext';

const ProductCard = ({ product }) => {
  const { cart, addToCart, updateQuantity, removeFromCart } = useCart();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const cartItem = cart.find(item => item.product_id === product.id);

  const handleAddToCart = async (e) => {
    e.preventDefault(); // Prevent navigating to detail page if card wrapper is a link
    setAdding(true);
    setErrorMsg('');
    
    const result = await addToCart(product.id, 1);
    
    setAdding(false);
    if (result.success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } else {
      setErrorMsg(result.message);
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col h-full group relative">
      {/* Product Link wrapper */}
      <Link to={`/product/${product.id}`} className="block overflow-hidden relative aspect-square bg-slate-50">
        <img
          src={product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600'}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        
        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-red-600 text-white font-bold text-xs uppercase px-3 py-1.5 rounded-lg tracking-wider">
              Out Of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Product Info */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Brand & Stock status */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {product.brand || 'Generic'}
          </span>
          {isLowStock && (
            <span className="inline-flex items-center text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 animate-pulse">
              <AlertTriangle size={10} className="mr-0.5" />
              Only {product.stock} left
            </span>
          )}
        </div>

        {/* Title */}
        <Link to={`/product/${product.id}`} className="block mb-2">
          <h3 className="font-semibold text-slate-800 hover:text-blue-600 transition-colors text-sm sm:text-base line-clamp-1">
            {product.title}
          </h3>
        </Link>

        {/* Star Rating (Simulated) */}
        <div className="flex items-center space-x-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={14} className={i < 4 ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"} />
          ))}
          <span className="text-xs text-slate-400 font-medium ml-1">4.0</span>
        </div>

        {/* Price & Add to Cart */}
        <div className="mt-auto flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-base sm:text-lg font-bold text-slate-900">
            ₹{parseFloat(product.price).toFixed(2)}
          </span>
          
          {cartItem ? (
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50 shadow-sm z-10" onClick={(e) => e.preventDefault()}>
              <button
                onClick={async () => {
                  if (cartItem.quantity === 1) {
                    await removeFromCart(cartItem.id);
                  } else {
                    await updateQuantity(cartItem.id, cartItem.quantity - 1);
                  }
                }}
                className="px-2.5 py-1 hover:bg-slate-200 text-slate-500 font-bold text-sm transition-colors cursor-pointer"
              >
                -
              </button>
              <span className="px-2 text-xs font-bold text-slate-800 select-none">
                {cartItem.quantity}
              </span>
              <button
                onClick={async () => {
                  await updateQuantity(cartItem.id, cartItem.quantity + 1);
                }}
                disabled={cartItem.quantity >= product.stock}
                className="px-2.5 py-1 hover:bg-slate-200 text-slate-500 font-bold text-sm transition-colors cursor-pointer disabled:opacity-40"
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || adding}
              className={`p-2 rounded-lg transition-all active:scale-95 cursor-pointer ${
                isOutOfStock
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : added
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-sm'
              }`}
              title="Add to Cart"
            >
              {adding ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : added ? (
                <Check size={18} />
              ) : (
                <ShoppingCart size={18} />
              )}
            </button>
          )}
        </div>

        {/* Error notification banner locally within card */}
        {errorMsg && (
          <div className="absolute bottom-16 left-4 right-4 bg-red-50 border border-red-200 text-red-600 text-xs px-2 py-1.5 rounded-lg text-center shadow-md animate-in fade-in duration-200 z-10">
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
