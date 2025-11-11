import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';

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
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Change this password to whatever you want
  const CORRECT_PASSWORD = 'TrogonHunt2024!';

  const handleAuth = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (passcode !== CORRECT_PASSWORD) {
      setError('Invalid passcode');
      setLoading(false);
      return;
    }

    setIsAuthenticated(true);
    setLoading(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPasscode('');
    setError('');
  };

  // Show auth form if not authenticated
  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}>
<div style={{
  backgroundColor: 'white',
  padding: '40px',    
    minHeight: '420px', 
  borderRadius: '8px',
  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  width: '100%',
  maxWidth: '400px',
   boxSizing: 'border-box', 
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif'
}}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginTop: '0', marginBottom: '30px',  lineHeight: '1.2', textAlign: 'center' }}>
            trogon Hunt
          </h1>
          
          <form onSubmit={handleAuth}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', marginTop: '0', fontWeight: '500' }}>
                Enter Passcode
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPasscode ? 'text' : 'password'}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter passcode"
                  style={{
                    width: '100%',
                    padding: '12px',
                    paddingRight: '45px',
                    fontSize: '16px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    fontFamily: 'monospace'
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px',
                    padding: '5px'
                  }}
                  title={showPasscode ? 'Hide passcode' : 'Show passcode'}
                >
                  {showPasscode ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                color: '#dc3545',
                marginBottom: '20px',
                padding: '10px',
                backgroundColor: '#f8d7da',
                borderRadius: '4px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                fontWeight: '500',
                backgroundColor: loading ? '#ccc' : '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Verifying...' : 'Access System'}
            </button>
          </form>

          <div style={{
            marginTop: '20px',
            padding: '10px',
            fontSize: '12px',
            color: '#666',
            backgroundColor: '#f9f9f9',
            borderRadius: '4px',
            textAlign: 'center'
          }}>
            Click the eye icon to show/hide your passcode
          </div>
        </div>
      </div>
    );
  }

  // Pass identifier and logout function to children
  return typeof children === 'function' ? children('admin', handleLogout) : children;
}
