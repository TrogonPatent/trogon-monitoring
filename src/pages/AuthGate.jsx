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
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Change this password to whatever you want
  const CORRECT_PASSWORD = 'TrogonHunt2024!';

  const handleAuth = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (password !== CORRECT_PASSWORD) {
      setError('Incorrect password. Access denied.');
      setLoading(false);
      return;
    }

    setIsAuthenticated(true);
    setLoading(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
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
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '400px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              width: '120px', 
              height: '120px', 
              marginBottom: '16px' 
            }}>
              <img 
                src="/binoculars-icon.png" 
                alt="Binoculars" 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
              trogon hunt
            </h1>
            <p style={{ color: '#666' }}>Prior Art Search</p>
          </div>
          
          <form onSubmit={handleAuth}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
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
                  onClick={() => setShowPassword(!showPassword)}
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
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              <p style={{ 
                marginTop: '8px', 
                fontSize: '12px', 
                color: '#666' 
              }}>
                Access restricted to authorized users
              </p>
            </div>

            {error && (
              <div style={{
                color: '#dc3545',
                marginBottom: '20px',
                padding: '10px',
                backgroundColor: '#f8d7da',
                borderRadius: '4px',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'start',
                gap: '8px'
              }}>
                <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0, marginTop: '2px' }} />
                <span>{error}</span>
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
              {loading ? 'Verifying...' : 'Access'}
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
            Click the eye icon to show/hide your password
          </div>
        </div>
      </div>
    );
  }

  // Pass identifier and logout function to children
  return typeof children === 'function' ? children('admin', handleLogout) : children;
}
