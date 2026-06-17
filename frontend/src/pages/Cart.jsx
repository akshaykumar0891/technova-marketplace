import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Truck, CreditCard } from 'lucide-react';
import { useCart } from '../context/CartContext';

const Cart = () => {
  const { cart, cartTotal, loading, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();

  // Pricing calculations
  const shippingFee = cartTotal >= 500 || cartTotal === 0 ? 0 : 15.00;
  const taxRate = 0.08; // 8% sales tax
  const estimatedTax = cartTotal * taxRate;
  const grandTotal = cartTotal + shippingFee + estimatedTax;

  const handleQtyChange = async (itemId, currentQty, stock, increment) => {
    const newQty = increment ? currentQty + 1 : currentQty - 1;
    if (newQty <= 0) return;
    if (newQty > stock) return;
    await updateQuantity(itemId, newQty);
  };

  const handleProceedToCheckout = () => {
    navigate('/checkout');
  };

  if (loading && cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex justify-center items-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6 flex flex-col items-center">
        <div className="p-5 bg-slate-100 rounded-full text-slate-400">
          <ShoppingBag size={48} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-800">Your Cart is Empty</h2>
          <p className="text-sm text-slate-500">
            Looks like you haven't added any electronic products to your cart yet.
          </p>
        </div>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg active:scale-95 transition-all shadow-sm"
        >
          <span>Start Shopping</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Shopping Cart</h1>
        <p className="text-slate-500 text-sm mt-1">Review the gadgets in your basket before checkout.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        
        {/* Left: Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row items-center gap-4 relative"
            >
              {/* Product Thumbnail */}
              <Link to={`/product/${item.product_id}`} className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center p-1">
                <img
                  src={item.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600'}
                  alt={item.title}
                  className="max-h-full max-w-full object-contain rounded"
                />
              </Link>

              {/* Product Text details */}
              <div className="flex-1 text-center sm:text-left space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                  {item.brand}
                </span>
                <Link to={`/product/${item.product_id}`} className="font-semibold text-slate-800 hover:text-blue-600 transition-colors text-sm sm:text-base line-clamp-1">
                  {item.title}
                </Link>
                <div className="text-slate-900 font-bold text-sm">
                  ₹{parseFloat(item.price).toFixed(2)} each
                </div>
              </div>

              {/* Quantity Changer */}
              <div className="flex items-center space-x-2 border border-slate-200 rounded-lg bg-slate-50">
                <button
                  onClick={() => handleQtyChange(item.id, item.quantity, item.stock, false)}
                  disabled={item.quantity <= 1}
                  className="p-1.5 hover:bg-slate-100 text-slate-500 disabled:opacity-35 disabled:cursor-not-allowed"
                >
                  <Minus size={12} />
                </button>
                <span className="text-xs font-bold text-slate-800 w-8 text-center select-none">
                  {item.quantity}
                </span>
                <button
                  onClick={() => handleQtyChange(item.id, item.quantity, item.stock, true)}
                  disabled={item.quantity >= item.stock}
                  className="p-1.5 hover:bg-slate-100 text-slate-500 disabled:opacity-35 disabled:cursor-not-allowed"
                >
                  <Plus size={12} />
                </button>
              </div>

              {/* Subtotal & Delete */}
              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <div className="text-right sm:text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Subtotal</p>
                  <p className="font-bold text-slate-900 text-sm sm:text-base">
                    ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                  </p>
                </div>
                
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Remove item"
                >
                  <Trash2 size={18} />
                </button>
              </div>

            </div>
          ))}
        </div>

        {/* Right: Checkout Box */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
          <h3 className="font-bold text-slate-800 text-lg uppercase border-b border-slate-100 pb-3">Order Summary</h3>

          {/* Pricing breakdowns */}
          <div className="space-y-3 text-sm font-medium">
            <div className="flex justify-between text-slate-600">
              <span>Items Subtotal</span>
              <span className="text-slate-800 font-semibold">₹{cartTotal.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between text-slate-600">
              <span>Estimated Shipping</span>
              <span className="text-slate-800 font-semibold">
                {shippingFee === 0 ? (
                  <span className="text-emerald-600 font-bold uppercase">Free</span>
                ) : (
                  `₹${shippingFee.toFixed(2)}`
                )}
              </span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Sales Tax (8%)</span>
              <span className="text-slate-800 font-semibold">₹{estimatedTax.toFixed(2)}</span>
            </div>

            {shippingFee > 0 && (
              <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-lg text-xs flex gap-2 items-start leading-snug">
                <Truck size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <span>Add <span className="font-bold">₹{(500 - cartTotal).toFixed(2)}</span> more to unlock free shipping.</span>
              </div>
            )}

            <div className="border-t border-slate-100 pt-3 flex justify-between text-base font-extrabold text-slate-900">
              <span>Total Amount</span>
              <span className="text-lg text-blue-600">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            onClick={handleProceedToCheckout}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-600/20 active:scale-[0.98] transition-all cursor-pointer text-sm"
          >
            <CreditCard size={18} />
            <span>Proceed to Checkout</span>
            <ArrowRight size={16} />
          </button>

          {/* Shipping notice */}
          <p className="text-[10px] text-slate-400 text-center leading-relaxed">
            Shipping and sales tax calculated based on your final billing location inside the checkout form.
          </p>
        </div>

      </div>

    </div>
  );
};

export default Cart;
