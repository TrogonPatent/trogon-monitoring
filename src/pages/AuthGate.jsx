import React, { useState } from 'react';
import { Lock, AlertCircle } from 'lucide-react';

/**
 * AuthGate - Authentication Gateway for Hunt System
 * 
 * Uses password-based authentication with visibility toggle
 * 
 * Usage in App.jsx:
 * <AuthGate>
 *   {(userIdentifier, handleLogout) => (
 *     <div>
 *       <button onClick={handleLogout}>Logout</button>
 *       <Routes>
 *         <Route path="/" element={<Dashboard userEmail={userIdentifier} />} />
 *       </Routes>
 *     </div>
 *   )}
 * </AuthGate>
 */
export default function AuthGate({ children }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  // Change this password to whatever you want
  const CORRECT_PASSWORD = 'TrogonHunt2024!';

  const handleAuth = () => {
    setError('');
    
    if (password !== CORRECT_PASSWORD) {
      setError('Incorrect password. Access denied.');
      return;
    }

    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    setError('');
  };

  // Show auth form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-40 h-40 mb-4">
                <img 
                  src="/binoculars-icon.png" 
                  alt="Binoculars" 
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">trogon hunt</h1>
              <p className="text-slate-600">Prior Art Search</p>
            </div>

            <div className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors text-xl"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Access restricted to authorized users
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
                Access
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pass identifier and logout function to children
  return typeof children === 'function' ? children('admin', handleLogout) : children;
}
