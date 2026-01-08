/**
 * Protected Route Component
 *
 * Wraps components that require authentication.
 * Redirects to sign in page if user is not authenticated.
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requirePro?: boolean; // If true, only pro users can access
  fallback?: React.ReactNode; // Custom fallback when not authenticated
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requirePro = false,
  fallback,
}) => {
  const { isAuthenticated, isLoading, isPro } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show fallback or redirect
  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <Navigate to="/auth/signin" replace />;
  }

  // Requires pro but user is on free tier
  if (requirePro && !isPro) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full text-center border border-slate-700">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Pro Feature</h2>
          <p className="text-slate-400 mb-6">
            This feature is only available to Pro subscribers. Upgrade to unlock unlimited predictions, backtesting, and more!
          </p>
          <button
            onClick={() => window.location.href = '/pricing'}
            className="w-full py-3 px-6 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all"
          >
            Upgrade to Pro
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
