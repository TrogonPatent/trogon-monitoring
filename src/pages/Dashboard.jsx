import { useState, useEffect } from 'react';
import { useAuth } from './AuthGate';

/**
 * Dashboard Page
 * 
 * Landing page for authenticated users
 * Shows upload button and list of provisionals
 * Simplified stats: Total Applications & Active Monitoring only
 */

export default function Dashboard() {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { email, handleLogout } = useAuth();

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/applications');
      // const data = await response.json();
      // setApplications(data);

      // Start with empty for now
      setApplications([]);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load applications:', error);
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      draft: 'bg-gray-100 text-gray-800',
      monitoring: 'bg-blue-100 text-blue-800',
      completed: 'bg-purple-100 text-purple-800'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || styles.draft}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const calculateDaysUntilPublication = (deadline) => {
    const today = new Date();
    const pubDate = new Date(deadline);
    const diffTime = pubDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Trogon Hunt & Submarine</h1>
              <p className="text-xs text-gray-500">Patent Monitoring System</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>{email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="max-w-6xl mx-auto p-6">
        {/* Simplified Stats - Only 2 cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm text-gray-600">Total Applications</span>
            </div>
            <p className="text-4xl font-bold text-gray-900">{applications.length}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-gray-600">Active Monitoring</span>
            </div>
            <p className="text-4xl font-bold text-green-600">
              {applications.filter(a => a.monitoringActive).length}
            </p>
          </div>
        </div>

        {/* Upload Provisional - Prominent */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Upload Provisional Patent</h2>
              <p className="text-blue-100">Upload specification and drawings to begin monitoring</p>
            </div>
            <a 
              href="/provisional/new"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Upload Provisional
            </a>
          </div>
        </div>

        {/* Applications List - Simplified */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Your Provisional Applications</h2>
          </div>

          {applications.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
              <p className="text-gray-600 mb-4">Upload your first provisional to begin monitoring</p>
              <a 
                href="/provisional/new"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Upload Provisional
              </a>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {applications.map((app) => {
                const daysRemaining = calculateDaysUntilPublication(app.publicationDeadline);
                return (
                  <div key={app.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {app.title}
                          </h3>
                          {getStatusBadge(app.status)}
                          {app.monitoringActive && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              🔒 Monitoring
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                          <div>
                            <p className="text-gray-500">Filing Date</p>
                            <p className="font-medium text-gray-900">{app.filingDate}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Publication</p>
                            <p className="font-medium text-gray-900">
                              {app.publicationDeadline}
                              <span className={`ml-2 text-xs ${daysRemaining < 180 ? 'text-red-600' : 'text-gray-500'}`}>
                                ({daysRemaining} days)
                              </span>
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Technology</p>
                            <p className="font-medium text-gray-900">{app.technologyArea}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Primary CPC</p>
                            <p className="font-medium text-gray-900 font-mono text-xs">{app.primaryCpc}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <button
                          onClick={() => console.log('View details:', app.id)}
                          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          View Details
                        </button>
                        {!app.monitoringActive && (
                          <button
                            onClick={() => console.log('Start monitoring:', app.id)}
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Start Monitoring
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Development Notes */}
        <div className="mt-8">
          <details className="text-sm text-gray-600 bg-white rounded-lg shadow p-4">
            <summary className="cursor-pointer font-medium text-gray-800 mb-2">
              🔒 System Info (Remove in production)
            </summary>
            <div className="space-y-2 pl-4">
              <p>✅ Access: Restricted to Brad & Laura only</p>
              <p>✅ UI Complete: Simplified dashboard focused on upload</p>
              <p>⏳ TODO: Wire up backend API endpoints</p>
              <p>📊 Current State: No mock data - empty dashboard</p>
              <p>🎯 Next: Build backend API routes for provisionals</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
