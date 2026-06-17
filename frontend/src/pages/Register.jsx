import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';

const Register = () => {
  const { register, user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // If already logged in, redirect to home
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

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

  const strength = checkPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name || !email || !password || !confirmPassword) {
      setErrorMsg('All fields are required.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (strength.score < 5) {
      setErrorMsg('Please choose a Strong password meeting all the criteria below.');
      return;
    }

    setLoading(true);
    const result = await register(name, email, password);
    setLoading(false);

    if (!result.success) {
      setErrorMsg(result.message);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-lg w-full max-w-md space-y-6">
        
        {/* Form Header */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Create Account</h2>
          <p className="text-sm text-slate-500">Sign up today and start smart shopping.</p>
        </div>

        {/* Display Alert for Errors */}
        {errorMsg && <Alert type="error" message={errorMsg} />}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Full Name input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-sm"
                required
              />
              <User className="absolute left-3 top-3.5 text-slate-400" size={16} />
            </div>
          </div>

          {/* Email input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-sm"
                required
              />
              <Mail className="absolute left-3 top-3.5 text-slate-400" size={16} />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters with criteria"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-10 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-sm"
                required
              />
              <Lock className="absolute left-3 top-3.5 text-slate-400" size={16} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Strength Meter details */}
            {password && (
              <div className="space-y-1.5 pt-1 animate-in fade-in duration-200 text-xs">
                <div className="flex justify-between items-center font-bold text-[10px] uppercase">
                  <span className="text-slate-400">Password Strength:</span>
                  <span className={strength.textClass}>{strength.label}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-full transition-all duration-300 ${strength.color}`} style={{ width: `${strength.score * 20}%` }}></div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 text-[10px] text-slate-400 leading-none">
                  <div className={strength.criteria.length ? 'text-emerald-600 font-semibold' : ''}>• Min. 8 characters</div>
                  <div className={strength.criteria.uppercase ? 'text-emerald-600 font-semibold' : ''}>• 1 Uppercase letter</div>
                  <div className={strength.criteria.lowercase ? 'text-emerald-600 font-semibold' : ''}>• 1 Lowercase letter</div>
                  <div className={strength.criteria.number ? 'text-emerald-600 font-semibold' : ''}>• 1 Number</div>
                  <div className={strength.criteria.special ? 'text-emerald-600 font-semibold' : ''}>• 1 Special symbol</div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-10 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-sm"
                required
              />
              <Lock className="absolute left-3 top-3.5 text-slate-400" size={16} />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-sm hover:shadow active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        <hr className="border-slate-100" />

        {/* Redirect toggle */}
        <div className="text-center">
          <p className="text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-semibold hover:underline">
              Log in instead
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Register;
