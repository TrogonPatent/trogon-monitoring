import React, { useState } from 'react';
import { Mail, Lock, AlertCircle } from 'lucide-react';

/**
 * AuthGate - Authentication Gateway for Monitoring System
 * 
 * CRITICAL: Only brad@trogonpatent.ai and laura@trogonpatent.ai have access
 * 
 * Uses render prop pattern to pass authenticated userEmail to child routes
 * 
 * Usage in App.jsx:
 * <AuthGate>
 *   {(userEmail) => (
 *     <Routes>
 *       <Route path="/" element={<Landing userEmail={userEmail} />} />
 *     </Routes>
 *   )}
 * </AuthGate>
 */
export default function AuthGate({ children }) {
  const [email, setEmail] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  const AUTHORIZED_EMAILS = ['brad@trogonpatent.ai', 'laura@trogonpatent.ai'];

  const handleAuth = () => {
    setError('');
    const normalizedEmail = email.toLowerCase().trim();

    if (!AUTHORIZED_EMAILS.includes(normalizedEmail)) {
      setError('Access denied. Only brad@trogonpatent.ai and laura@trogonpatent.ai are authorized.');
      return;
    }

    setIsAuthenticated(true);
  };

  // Show auth form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Lock className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Trogon Monitoring</h1>
              <p className="text-slate-600">Patent Prior Art & Submarine Monitoring</p>
            </div>

            <div className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
                    placeholder="brad@trogonpatent.ai"
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Restricted to Brad and Laura only
                </p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                onClick={handleAuth}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Access Monitoring System
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">System Access</h3>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>🔍 <strong>Hunt:</strong> POD-based prior art search (Phase A-C)</li>
                  <li>🔒 <strong>Submarine:</strong> 18-month monitoring (Phase F-G)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pass authenticated email to children via render prop
  return typeof children === 'function' ? children(email) : children;
}
