import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CreditCard, ShoppingBag, MapPin, Plus, Check, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import Alert from '../components/Alert';

const Checkout = () => {
  const { cart, cartTotal, clearCart } = useCart();
  const { addresses, addAddress, fetchAddresses } = useAuth();
  const navigate = useNavigate();

  // Redirect to cart if empty
  useEffect(() => {
    if (cart.length === 0) {
      navigate('/cart');
    }
    fetchAddresses();
  }, [cart, navigate]);

  // Form states
  const [selectedAddressId, setSelectedAddressId] = useState(
    addresses.length > 0 ? addresses[0].id : ''
  );
  const [useNewAddress, setUseNewAddress] = useState(addresses.length === 0);
  const [newAddress, setNewAddress] = useState({
    full_name: '',
    phone: '',
    city: '',
    state: '',
    pincode: '',
    address: ''
  });

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    name: '',
    number: '',
    expiry: '',
    cvv: ''
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle address list update fallback
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId && !useNewAddress) {
      setSelectedAddressId(addresses[0].id);
    }
  }, [addresses]);

  // Pricing calculations
  const shippingFee = cartTotal >= 500 ? 0 : 15.00;
  const taxRate = 0.08;
  const estimatedTax = cartTotal * taxRate;
  const grandTotal = cartTotal + shippingFee + estimatedTax;

  const handleNewAddressChange = (e) => {
    const { name, value } = e.target;
    setNewAddress(prev => ({ ...prev, [name]: value }));
  };

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    setCardDetails(prev => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const payload = {
        paymentMethod
      };

      // Address resolution validation
      if (useNewAddress) {
        const { full_name, phone, city, state, pincode, address } = newAddress;
        if (!full_name || !phone || !city || !state || !pincode || !address) {
          setErrorMsg('Please complete all shipping address fields.');
          setLoading(false);
          return;
        }
        payload.shippingAddress = newAddress;
      } else {
        if (!selectedAddressId) {
          setErrorMsg('Please select a shipping address.');
          setLoading(false);
          return;
        }
        payload.addressId = selectedAddressId;
      }

      // Simulated payment validation
      if (paymentMethod === 'card') {
        const { name, number, expiry, cvv } = cardDetails;
        if (!name || !number || !expiry || !cvv) {
          setErrorMsg('Please fill out all card payment fields.');
          setLoading(false);
          return;
        }
      }

      // Call API
      const res = await API.post('/orders', payload);
      
      setLoading(false);
      clearCart(); // Reset cart in global context
      
      // Redirect to orders history
      navigate('/orders', { 
        state: { successMessage: 'Order placed successfully! Thank you for shopping with TechNova.' } 
      });

    } catch (error) {
      console.error('Checkout error:', error);
      setErrorMsg(error.response?.data?.message || 'Checkout failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Secure Checkout</h1>
        <p className="text-slate-500 text-sm mt-1">Complete your shipping details and payment card.</p>
      </div>

      {errorMsg && <Alert type="error" message={errorMsg} />}

      <form onSubmit={handlePlaceOrder} className="grid lg:grid-cols-3 gap-8 items-start">
        
        {/* LEFT & CENTER: SHIPPING & BILLING */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* SHIPPING ADDRESS CARD */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-base uppercase flex items-center gap-2 border-b border-slate-100 pb-3">
              <MapPin className="text-blue-600" size={18} />
              <span>1. Shipping Location</span>
            </h3>

            {/* Saved Addresses List */}
            {addresses.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`border rounded-xl p-4 flex items-start space-x-3 cursor-pointer transition-all ${
                      !useNewAddress && selectedAddressId === addr.id
                        ? 'border-blue-500 bg-blue-50/30'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="selected_address"
                      checked={!useNewAddress && selectedAddressId === addr.id}
                      onChange={() => {
                        setSelectedAddressId(addr.id);
                        setUseNewAddress(false);
                      }}
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="text-xs space-y-1 text-slate-600">
                      <p className="font-bold text-slate-800 text-sm">{addr.full_name}</p>
                      <p>Phone: {addr.phone}</p>
                      <p>{addr.address}</p>
                      <p>{addr.city}, {addr.state} - {addr.pincode}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {/* Option to use new address */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setUseNewAddress(true)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  useNewAddress
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Plus size={14} />
                <span>Use a New Shipping Address</span>
              </button>
            </div>

            {/* New Address Form */}
            {useNewAddress && (
              <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Full Name</label>
                  <input
                    type="text"
                    name="full_name"
                    value={newAddress.full_name}
                    onChange={handleNewAddressChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
                    placeholder="e.g. John Doe"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={newAddress.phone}
                    onChange={handleNewAddressChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
                    placeholder="e.g. 9876543210"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">City</label>
                  <input
                    type="text"
                    name="city"
                    value={newAddress.city}
                    onChange={handleNewAddressChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
                    placeholder="e.g. New York"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">State</label>
                  <input
                    type="text"
                    name="state"
                    value={newAddress.state}
                    onChange={handleNewAddressChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
                    placeholder="e.g. NY"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pin Code</label>
                  <input
                    type="text"
                    name="pincode"
                    value={newAddress.pincode}
                    onChange={handleNewAddressChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
                    placeholder="e.g. 10001"
                    required
                  />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Street Address</label>
                  <textarea
                    name="address"
                    value={newAddress.address}
                    onChange={handleNewAddressChange}
                    rows="2"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:bg-white resize-none"
                    placeholder="e.g. Apt 4B, 123 Tech Drive"
                    required
                  ></textarea>
                </div>
              </div>
            )}
          </div>

          {/* PAYMENT OPTIONS CARD */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-base uppercase flex items-center gap-2 border-b border-slate-100 pb-3">
              <CreditCard className="text-blue-600" size={18} />
              <span>2. Secure Payment Method</span>
            </h3>

            {/* Payment Method Toggles */}
            <div className="flex gap-4">
              <label className={`flex-1 border rounded-xl p-4 flex items-center space-x-3 cursor-pointer transition-all ${
                paymentMethod === 'card' ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200 hover:border-slate-300'
              }`}>
                <input
                  type="radio"
                  name="payment_method"
                  checked={paymentMethod === 'card'}
                  onChange={() => setPaymentMethod('card')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="font-semibold text-slate-800 text-sm">Credit / Debit Card</span>
              </label>

              <label className={`flex-1 border rounded-xl p-4 flex items-center space-x-3 cursor-pointer transition-all ${
                paymentMethod === 'cod' ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200 hover:border-slate-300'
              }`}>
                <input
                  type="radio"
                  name="payment_method"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="font-semibold text-slate-800 text-sm">Cash on Delivery (COD)</span>
              </label>
            </div>

            {/* Card Inputs */}
            {paymentMethod === 'card' && (
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-4 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Cardholder Name</label>
                  <input
                    type="text"
                    name="name"
                    value={cardDetails.name}
                    onChange={handleCardChange}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    placeholder="e.g. John Doe"
                    required={paymentMethod === 'card'}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Card Number</label>
                  <input
                    type="text"
                    name="number"
                    value={cardDetails.number}
                    onChange={handleCardChange}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    placeholder="e.g. 1111-2222-3333-4444"
                    maxLength="19"
                    required={paymentMethod === 'card'}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Expiration Date</label>
                    <input
                      type="text"
                      name="expiry"
                      value={cardDetails.expiry}
                      onChange={handleCardChange}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                      placeholder="MM/YY"
                      maxLength="5"
                      required={paymentMethod === 'card'}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">CVV</label>
                    <input
                      type="password"
                      name="cvv"
                      value={cardDetails.cvv}
                      onChange={handleCardChange}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                      placeholder="•••"
                      maxLength="3"
                      required={paymentMethod === 'card'}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT: ORDER PREVIEW SUMMARY */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <ShoppingBag className="text-blue-600" size={16} />
              <span>Order Summary</span>
            </h3>

            {/* Cart Items list */}
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-3 items-center text-xs">
                  <div className="w-10 h-10 border border-slate-100 bg-slate-50 p-0.5 rounded flex items-center justify-center shrink-0">
                    <img
                      src={item.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600'}
                      alt={item.title}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="flex-1 truncate">
                    <p className="font-semibold text-slate-700 truncate">{item.title}</p>
                    <p className="text-slate-400 font-medium">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-bold text-slate-800 shrink-0">
                    ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Price lines */}
            <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs font-semibold text-slate-500">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="text-slate-800">₹{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Shipping</span>
                <span className="text-slate-800">
                  {shippingFee === 0 ? <span className="text-emerald-600 font-bold uppercase">Free</span> : `₹${shippingFee.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Sales Tax (8%)</span>
                <span className="text-slate-800">₹{estimatedTax.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-100 pt-3 flex justify-between text-sm font-extrabold text-slate-900">
                <span>Grand Total</span>
                <span className="text-base text-blue-600">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Place Order submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-600/20 active:scale-[0.98] transition-all cursor-pointer text-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  <span>Authorize & Place Order</span>
                </>
              )}
            </button>
          </div>

          <Link
            to="/cart"
            className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl border border-slate-200 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Return to Shopping Cart</span>
          </Link>
        </div>

      </form>

    </div>
  );
};

export default Checkout;
