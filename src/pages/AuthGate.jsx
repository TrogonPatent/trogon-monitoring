import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Auth Gate - Restricts access to Brad and Laura only
 * 
 * Authorized users:
 * - brad@trogonpatent.ai
 * - laura@trogonpatent.ai
 */

export default function AuthGate({ children }) {
  const [email, setEmail] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const AUTHORIZED_EMAILS = [
    'brad@trogonpatent.ai',
    'laura@trogonpatent.ai'
  ];

  // Check for existing session on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('trogon_monitoring_email');
    if (savedEmail && AUTHORIZED_EMAILS.includes(savedEmail.toLowerCase())) {
      setEmail(savedEmail);
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = () => {
    const normalizedEmail = email.toLowerCase().trim();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!AUTHORIZED_EMAILS.includes(normalizedEmail)) {
      setError('Access denied. This system is restricted to authorized personnel only.');
      return;
    }

    // Save to localStorage for session persistence
    localStorage.setItem('trogon_monitoring_email', normalizedEmail);
    setIsAuthenticated(true);
    setError('');
  };

  const handleLogout = () => {
    localStorage.removeItem('trogon_monitoring_email');
    setIsAuthenticated(false);
    setEmail('');
    navigate('/');
  };

  // Show loading state briefly
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login gate if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Trogon Monitoring</h1>
              <p className="text-slate-600">Patent Hunt & Submarine System</p>
              <p className="text-sm text-red-600 mt-2 font-medium">
                🔒 Restricted Access - Authorized Personnel Only
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    placeholder="your.email@trogonpatent.ai"
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                onClick={handleLogin}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Access System
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200">
              <p className="text-xs text-slate-500 text-center">
                This system is restricted to Trogon Mobile authorized personnel only.
                Unauthorized access is prohibited.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated - show children with logout option in context
  return (
    <AuthContext.Provider value={{ email, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Create context for sharing auth state
import { createContext, useContext } from 'react';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthGate');
  }
  return context;
}
