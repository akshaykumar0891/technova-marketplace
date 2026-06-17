import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

const Alert = ({ type = 'info', message }) => {
  if (!message) return null;

  const styles = {
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      icon: <CheckCircle size={18} className="text-emerald-600 shrink-0" />
    },
    error: {
      bg: 'bg-rose-50 border-rose-200 text-rose-800',
      icon: <AlertCircle size={18} className="text-rose-600 shrink-0" />
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: <AlertTriangle size={18} className="text-amber-600 shrink-0" />
    },
    info: {
      bg: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: <Info size={18} className="text-blue-600 shrink-0" />
    }
  };

  const currentStyle = styles[type] || styles.info;

  return (
    <div className={`flex items-start gap-3 border px-4 py-3 rounded-xl shadow-sm text-sm font-medium transition-all ${currentStyle.bg}`}>
      {currentStyle.icon}
      <span className="flex-1 leading-snug">{message}</span>
    </div>
  );
};

export default Alert;
