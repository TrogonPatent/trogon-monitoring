import { useState, useEffect } from 'react';

/**
 * Dashboard Page
 * 
 * Lists all provisional applications and their monitoring status
 */

export default function Dashboard() {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/applications');
      // const data = await response.json();
      // setApplications(data);

      // Mock data for testing
      const mockApps = [
        {
          id: '1',
          title: 'Mobile Patent Filing System',
          filingDate: '2025-07-23',
          publicationDeadline: '2027-01-23',
          technologyArea: 'Software/Mobile Applications',
          primaryCpc: 'G06F 40/169',
          status: 'active',
          podCount: 4,
          monitoringActive: false,
          patentabilityScore: null,
          createdAt: '2025-11-05'
        },
        {
          id: '2',
          title: 'Patent Asset Management Platform',
          filingDate: '2025-08-21',
          publicationDeadline: '2027-02-21',
          technologyArea: 'Business Methods/Legal Tech',
          primaryCpc: 'G06Q 50/18',
          status: 'active',
          podCount: 3,
          monitoringActive: false,
          patentabilityScore: null,
          createdAt: '2025-11-05'
        }
      ];

      setApplications(mockApps);
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
              <h1 className="text-lg font-bold text-gray-900">Trogon Submarine</h1>
              <p className="text-xs text-gray-500">Patent Monitoring Dashboard</p>
            </div>
          </div>
          <a 
            href="/provisional/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            + New Provisional
          </a>
        </div>
      </nav>

      {/* Main content */}
      <div className="max-w-6xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 mb-1">Total Applications</p>
            <p className="text-3xl font-bold text-gray-900">{applications.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 mb-1">Active Monitoring</p>
            <p className="text-3xl font-bold text-blue-600">
              {applications.filter(a => a.monitoringActive).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 mb-1">Avg. Score</p>
            <p className="text-3xl font-bold text-green-600">
              {applications.filter(a => a.patentabilityScore).length > 0
                ? Math.round(applications.reduce((sum, a) => sum + (a.patentabilityScore || 0), 0) / applications.filter(a => a.patentabilityScore).length)
                : '-'}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 mb-1">Total PODs</p>
            <p className="text-3xl font-bold text-purple-600">
              {applications.reduce((sum, a) => sum + a.podCount, 0)}
            </p>
          </div>
        </div>

        {/* Applications List */}
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
                              Monitoring
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

                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span className="text-gray-600">{app.podCount} PODs</span>
                          </div>
                          {app.patentabilityScore && (
                            <div className="flex items-center gap-2">
                              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                              <span className="text-gray-600">Score: {app.patentabilityScore}/100</span>
                            </div>
                          )}
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
              Development Notes (Remove in production)
            </summary>
            <div className="space-y-2 pl-4">
              <p>✅ UI Complete: Dashboard with application list</p>
              <p>⏳ TODO: Wire up actual API endpoints:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>GET /api/applications - Fetch all applications</li>
                <li>GET /api/applications/:id - Fetch single application details</li>
                <li>POST /api/applications/:id/start-monitoring - Begin Phase B</li>
              </ul>
              <p>📊 Current State: Using mock data for UI testing</p>
              <p>🎯 Next: Build backend API routes</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
