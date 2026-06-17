import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, MapPin, Plus, Trash2, Calendar, ShieldAlert, Lock, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import API from '../services/api';
import Alert from '../components/Alert';

const checkPasswordStrength = (pass) => {
  let score = 0;
  if (!pass) return { score, label: 'None', color: 'bg-slate-200', textClass: 'text-slate-400', criteria: {} };
  
  const criteria = {
    length: pass.length >= 8,
    uppercase: /[A-Z]/.test(pass),
    lowercase: /[a-z]/.test(pass),
    number: /[0-9]/.test(pass),
    special: /[^A-Za-z0-9]/.test(pass)
  };
  
  score = Object.values(criteria).filter(Boolean).length;
  
  let label = 'Very Weak';
  let color = 'bg-red-500';
  let textClass = 'text-red-500';
  
  if (score === 5) {
    label = 'Strong (Secure)';
    color = 'bg-emerald-500';
    textClass = 'text-emerald-600';
  } else if (score >= 3) {
    label = 'Medium';
    color = 'bg-amber-500';
    textClass = 'text-amber-600';
  } else if (score >= 2) {
    label = 'Weak';
    color = 'bg-orange-500';
    textClass = 'text-orange-500';
  }
  
  return { score, label, color, textClass, criteria };
};

const Profile = () => {
  const { user, addresses, addAddress, logout } = useAuth();

  // Local state for adding address
  const [showForm, setShowForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    full_name: '',
    phone: '',
    city: '',
    state: '',
    pincode: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  // Account deactivation/deletion states
  const [dangerMode, setDangerMode] = useState(null); // 'deactivate' or 'delete'
  const [dangerPassword, setDangerPassword] = useState('');
  const [showDangerPassword, setShowDangerPassword] = useState(false);
  const [dangerReason, setDangerReason] = useState('Too expensive');
  const [dangerOtherReason, setDangerOtherReason] = useState('');
  const [dangerLoading, setDangerLoading] = useState(false);
  const [dangerStatus, setDangerStatus] = useState({ type: '', message: '' });

  // Change Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdStatus, setPwdStatus] = useState({ type: '', message: '' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAddress(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    const { full_name, phone, city, state, pincode, address } = newAddress;
    if (!full_name || !phone || !city || !state || !pincode || !address) {
      setStatus({ type: 'error', message: 'All fields are required.' });
      return;
    }

    setLoading(true);
    const result = await addAddress(newAddress);
    setLoading(false);

    if (result.success) {
      setStatus({ type: 'success', message: 'Address saved to profile successfully!' });
      setNewAddress({
        full_name: '',
        phone: '',
        city: '',
        state: '',
        pincode: '',
        address: ''
      });
      setShowForm(false);
    } else {
      setStatus({ type: 'error', message: result.message });
    }
  };

  const handleDangerSubmit = async (e) => {
    e.preventDefault();
    if (!dangerPassword) {
      setDangerStatus({ type: 'error', message: 'Password is required to confirm.' });
      return;
    }
    setDangerLoading(true);
    setDangerStatus({ type: '', message: '' });
    try {
      const endpoint = dangerMode === 'delete' ? '/auth/delete-account' : '/auth/deactivate';
      await API.post(endpoint, {
        password: dangerPassword,
        reason: dangerReason,
        other_reason: dangerReason === 'Other' ? dangerOtherReason : ''
      });
      // Clear cart
      localStorage.removeItem('technova_guest_cart');
      logout();
      window.location.href = '/login?msg=' + encodeURIComponent(
        dangerMode === 'delete' 
          ? 'Your account has been permanently deleted.' 
          : 'Your account has been deactivated.'
      );
    } catch (err) {
      console.error('Account action error:', err);
      setDangerStatus({
        type: 'error',
        message: err.response?.data?.message || `Failed to ${dangerMode} account.`
      });
    } finally {
      setDangerLoading(false);
    }
  };

  const pwdStrength = checkPasswordStrength(newPassword);

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPwdStatus({ type: '', message: '' });

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPwdStatus({ type: 'error', message: 'All fields are required.' });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPwdStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    if (pwdStrength.score < 5) {
      setPwdStatus({ type: 'error', message: 'Please select a strong password meeting all guidelines.' });
      return;
    }

    setPwdLoading(true);
    try {
      const payload = {
        mode: 'current_password',
        currentPassword,
        newPassword
      };

      await API.post('/auth/change-password', payload);
      setPwdStatus({ type: 'success', message: 'Password updated successfully!' });
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      console.error('Update password error:', err);
      setPwdStatus({
        type: 'error',
        message: err.response?.data?.message || 'Failed to change password. Please verify inputs.'
      });
    } finally {
      setPwdLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Account Profile</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your user details and saved shipping locations.</p>
      </div>

      {status.message && <Alert type={status.type} message={status.message} />}

      <div className="grid md:grid-cols-3 gap-8 items-start">
        
        {/* Left Column Stack */}
        <div className="space-y-6">
          {/* Left: User Details Card */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
            <div className="flex flex-col items-center text-center space-y-3 pb-6 border-b border-slate-100">
              <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-3xl shadow-inner uppercase">
                {user.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">{user.name}</h3>
                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 uppercase tracking-wider mt-1.5">
                  <Shield size={10} />
                  {user.role} Account
                </span>
              </div>
            </div>

            <div className="space-y-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400">Registered Email</span>
                <div className="flex items-center gap-2 text-slate-700 font-medium normal-case">
                  <Mail size={16} className="text-slate-400 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-400">Date Registered</span>
                <div className="flex items-center gap-2 text-slate-700 font-medium normal-case">
                  <Calendar size={16} className="text-slate-400 shrink-0" />
                  <span>{new Date(user.created_at || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Compact Danger Zone Card */}
          <div className="bg-white border border-red-100 rounded-2xl shadow-sm p-5 space-y-4 text-xs">
            <div className="flex items-center space-x-2 text-red-600 font-bold border-b border-red-50 pb-2">
              <ShieldAlert size={16} />
              <span className="uppercase tracking-wider">Danger Zone</span>
            </div>

            <div className="space-y-3 font-semibold text-slate-500 leading-normal">
              <p className="text-[10px]">
                Choose to temporarily deactivate or permanently delete your account.
              </p>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setDangerMode(dangerMode === 'deactivate' ? null : 'deactivate');
                    setDangerStatus({ type: '', message: '' });
                    setDangerPassword('');
                  }}
                  className={`flex-1 py-2 border rounded-lg font-bold text-[10px] uppercase transition-all cursor-pointer ${
                    dangerMode === 'deactivate'
                      ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Deactivate
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDangerMode(dangerMode === 'delete' ? null : 'delete');
                    setDangerStatus({ type: '', message: '' });
                    setDangerPassword('');
                  }}
                  className={`flex-1 py-2 border rounded-lg font-bold text-[10px] uppercase transition-all cursor-pointer ${
                    dangerMode === 'delete'
                      ? 'border-red-500 bg-red-50 text-red-700 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Delete Account
                </button>
              </div>
            </div>

            {dangerMode && (
              <form onSubmit={handleDangerSubmit} className="border-t border-slate-100 pt-4 space-y-3 font-semibold text-slate-500 animate-in fade-in duration-200">
                <div className="flex items-center gap-1.5 text-slate-800">
                  <AlertTriangle className={dangerMode === 'delete' ? 'text-red-500' : 'text-amber-500'} size={14} />
                  <span className="font-bold text-[10px] uppercase">
                    {dangerMode === 'delete' ? 'Permanent Deletion' : 'Temporary Hold'}
                  </span>
                </div>

                {dangerStatus.message && <Alert type={dangerStatus.type} message={dangerStatus.message} />}

                {/* Departure Reason selection */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Departure Reason</label>
                  <select
                    value={dangerReason}
                    onChange={(e) => setDangerReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-red-500"
                  >
                    <option value="Too expensive">Too expensive</option>
                    <option value="Found alternative">Found alternative</option>
                    <option value="Don't use it anymore">Don't use it anymore</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Other Reason Text area */}
                {dangerReason === 'Other' && (
                  <div className="space-y-1 animate-in fade-in duration-200">
                    <label className="text-[9px] font-bold text-slate-400 uppercase block">Details</label>
                    <textarea
                      value={dangerOtherReason}
                      onChange={(e) => setDangerOtherReason(e.target.value)}
                      rows="2"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:border-red-500 resize-none font-medium"
                      placeholder="Tell us what we can improve..."
                      required
                    ></textarea>
                  </div>
                )}

                {/* Password verification input */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Verify password</label>
                  <div className="relative">
                    <input
                      type={showDangerPassword ? "text" : "password"}
                      value={dangerPassword}
                      onChange={(e) => setDangerPassword(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg pl-3 pr-9 py-1.5 text-xs focus:outline-none focus:border-red-500 text-slate-800 font-medium"
                      placeholder="Confirm password..."
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowDangerPassword(!showDangerPassword)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showDangerPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex justify-end gap-2 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setDangerMode(null)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-1.5 px-3 rounded-lg active:scale-95 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={dangerLoading}
                    className={`font-bold py-1.5 px-3 rounded-lg active:scale-95 transition-all cursor-pointer shadow-sm text-white flex items-center justify-center min-w-[60px] ${
                      dangerMode === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'
                    }`}
                  >
                    {dangerLoading ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      'Confirm'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right: Saved Addresses Section */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-base uppercase flex items-center gap-2">
              <MapPin className="text-blue-600" size={18} />
              <span>Saved Shipping Addresses ({addresses.length})</span>
            </h3>
            
            <button
              onClick={() => {
                setShowForm(!showForm);
                setStatus({ type: '', message: '' });
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
            >
              <Plus size={14} />
              <span>{showForm ? 'Cancel' : 'Add Address'}</span>
            </button>
          </div>

          {/* New Address Registration Form */}
          {showForm && (
            <form onSubmit={handleAddressSubmit} className="bg-slate-50 border border-slate-200 p-6 rounded-2xl shadow-inner space-y-4 animate-in fade-in duration-200">
              <h4 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2">New Address Profile</h4>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Full Name</label>
                  <input
                    type="text"
                    name="full_name"
                    value={newAddress.full_name}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    placeholder="e.g. John Doe"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={newAddress.phone}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    placeholder="e.g. 9876543210"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">City</label>
                  <input
                    type="text"
                    name="city"
                    value={newAddress.city}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    placeholder="e.g. Los Angeles"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">State</label>
                  <input
                    type="text"
                    name="state"
                    value={newAddress.state}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    placeholder="e.g. CA"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Pin Code</label>
                  <input
                    type="text"
                    name="pincode"
                    value={newAddress.pincode}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    placeholder="e.g. 90001"
                    required
                  />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Street Address</label>
                  <textarea
                    name="address"
                    value={newAddress.address}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
                    placeholder="e.g. 100 Main St, Apt 2"
                    required
                  ></textarea>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-lg active:scale-95 transition-all text-sm cursor-pointer shadow-sm"
              >
                {loading ? 'Saving...' : 'Save Address'}
              </button>
            </form>
          )}

          {/* Address Cards Grid */}
          {addresses.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl py-12 text-center text-slate-400 text-sm font-medium">
              No saved addresses found. Click "Add Address" to register a shipping address.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div key={addr.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm relative space-y-2 text-xs text-slate-500 leading-relaxed group">
                  
                  {/* Address header */}
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-slate-800 text-sm">{addr.full_name}</p>
                    <span className="p-1 bg-slate-50 rounded text-slate-400 group-hover:text-blue-500 transition-colors">
                      <MapPin size={14} />
                    </span>
                  </div>

                  <p><span className="font-semibold text-slate-400">Phone:</span> {addr.phone}</p>
                  <p className="text-slate-600 font-medium">{addr.address}</p>
                  <p>{addr.city}, {addr.state} - {addr.pincode}</p>
                  
                </div>
              ))}
            </div>
          )}

          {/* Change Password Card */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-5">
            <h3 className="font-bold text-slate-800 text-base uppercase flex items-center gap-2 border-b border-slate-100 pb-3">
              <Lock className="text-blue-600 animate-pulse" size={18} />
              <span>Security & Password Credentials</span>
            </h3>

            {pwdStatus.message && <Alert type={pwdStatus.type} message={pwdStatus.message} />}

            <form onSubmit={handlePasswordUpdate} className="space-y-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              
              {/* Current Password */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 block">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-10 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white normal-case font-medium text-slate-800"
                    placeholder="Enter current password..."
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* New Password & Confirm Password */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 block">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-10 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white normal-case font-medium text-slate-800"
                      placeholder="Min. 8 characters"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors font-medium"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 block">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmNewPassword ? "text" : "password"}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-10 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white normal-case font-medium text-slate-800"
                      placeholder="Re-enter new password..."
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors font-medium"
                    >
                      {showConfirmNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Strength Meter (Replicating Register.jsx) */}
              {newPassword && (
                <div className="space-y-1.5 pt-1 animate-in fade-in duration-200 text-xs normal-case">
                  <div className="flex justify-between items-center font-bold text-[10px] uppercase">
                    <span className="text-slate-400">Password Strength:</span>
                    <span className={pwdStrength.textClass}>{pwdStrength.label}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${pwdStrength.color}`} style={{ width: `${pwdStrength.score * 20}%` }}></div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 text-[10px] text-slate-400 leading-none font-semibold">
                    <div className={pwdStrength.criteria.length ? 'text-emerald-600' : ''}>• Min. 8 characters</div>
                    <div className={pwdStrength.criteria.uppercase ? 'text-emerald-600' : ''}>• 1 Uppercase letter</div>
                    <div className={pwdStrength.criteria.lowercase ? 'text-emerald-600' : ''}>• 1 Lowercase letter</div>
                    <div className={pwdStrength.criteria.number ? 'text-emerald-600' : ''}>• 1 Numeric digit</div>
                    <div className={pwdStrength.criteria.special ? 'text-emerald-600' : ''}>• 1 Special character</div>
                  </div>
                </div>
              )}

              {/* Submit Action */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg active:scale-95 transition-all text-xs cursor-pointer shadow-sm uppercase min-w-[120px]"
                >
                  {pwdLoading ? 'Processing...' : 'Update Password'}
                </button>
              </div>

            </form>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Profile;
