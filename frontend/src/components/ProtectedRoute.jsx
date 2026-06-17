import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ adminOnly = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show a premium pulsing loader while auth checks are running
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-medium animate-pulse">Verifying credentials...</p>
      </div>
    );
  }

  // If not logged in, redirect to login page with history context
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If admin privileges are required but user is a customer, redirect to homepage
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Render sub-routes
  return <Outlet />;
};

export default ProtectedRoute;
