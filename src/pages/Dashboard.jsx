import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Calendar, Code, AlertCircle, Plus, Trash2 } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [archiving, setArchiving] = useState(null); // ID of app being archived
  const [showConfirm, setShowConfirm] = useState(false);
  const [appToArchive, setAppToArchive] = useState(null);

  // Fetch applications on mount
  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/get-applications');
      
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const data = await response.json();
      setApplications(data.applications || []);
      
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'Pre-filing';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Archive application (soft delete)
  const handleArchiveClick = (app, e) => {
    e.stopPropagation(); // Prevent card click
    setAppToArchive(app);
    setShowConfirm(true);
  };

  const confirmArchive = async () => {
    if (!appToArchive) return;

    try {
      setArchiving(appToArchive.id);
      setShowConfirm(false);

      const response = await fetch('/api/archive-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: appToArchive.id,
          userEmail: 'brad@trogonpatent.ai' // TODO: Get from auth context
        })
      });

      if (!response.ok) {
        throw new Error('Failed to archive application');
      }

      // Remove from UI
      setApplications(applications.filter(a => a.id !== appToArchive.id));
      setAppToArchive(null);

    } catch (err) {
      console.error('Error archiving application:', err);
      setError(err.message);
    } finally {
      setArchiving(null);
    }
  };

  const cancelArchive = () => {
    setShowConfirm(false);
    setAppToArchive(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">trogon hunt</h1>
              <p className="text-gray-600 mt-1">Prior Art Search</p>
            </div>
            <button
              onClick={() => navigate('/provisional/new')}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add New Provisional Patent Data
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Archive Confirmation Dialog */}
        {showConfirm && appToArchive && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Archive Application?
              </h3>
              <p className="text-gray-600 mb-4">
                "{appToArchive.title}" will be hidden from your dashboard but retained for legal audit trail and IDS compliance.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                You can contact support to restore archived applications if needed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={cancelArchive}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmArchive}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Archive
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading applications...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Error Loading Applications</h3>
                <p className="text-red-700 text-sm">{error}</p>
                <button
                  onClick={fetchApplications}
                  className="mt-3 text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && applications.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Applications Yet</h2>
            <p className="text-gray-600 mb-6">
              Upload your first provisional patent to begin monitoring
            </p>
            <button
              onClick={() => navigate('/provisional/new')}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add New Provisional Patent Data
            </button>
          </div>
        )}

        {/* Applications Grid */}
        {!loading && !error && applications.length > 0 && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Your Applications ({applications.length})
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Monitoring provisional patents for prior art
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow relative"
                >
                  {/* Archive Button */}
                  <button
                    onClick={(e) => handleArchiveClick(app, e)}
                    disabled={archiving === app.id}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Archive application"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Card Content - Clickable */}
                  <div
                    className="cursor-pointer pr-8"
                    onClick={() => navigate(`/application/${app.id}`)}
                  >
                    {/* Header */}
                    <div className="mb-4">
                    <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2">
                      {app.title}
                    </h3>
                    
                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      {app.isPreFiling ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          <Calendar className="w-3 h-3" />
                          Pre-filing
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          <Calendar className="w-3 h-3" />
                          Filed
                        </span>
                      )}
                      
                      {app.technology_area && (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {app.technology_area}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-3 text-sm">
                    {/* CPC Classification */}
                    {app.predicted_primary_cpc && (
                      <div className="flex items-start gap-2">
                        <Code className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-gray-500 text-xs">Primary CPC</p>
                          <p className="text-gray-900 font-medium">{app.predicted_primary_cpc}</p>
                        </div>
                      </div>
                    )}

                    {/* POD Count */}
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-gray-500 text-xs">Points of Distinction</p>
                        <p className="text-gray-900 font-medium">
                          {app.podCount} PODs ({app.primaryPodCount} primary)
                        </p>
                      </div>
                    </div>

                    {/* Filing Date */}
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-gray-500 text-xs">Filing Date</p>
                        <p className="text-gray-900 font-medium">{formatDate(app.filing_date)}</p>
                      </div>
                    </div>

                    {/* Publication Deadline */}
                    {!app.isPreFiling && app.publication_deadline && (
                      <div className="pt-3 border-t border-gray-200">
                        <p className="text-gray-500 text-xs mb-1">Publication Deadline</p>
                        <p className="text-gray-900 font-medium">
                          {formatDate(app.publication_deadline)}
                        </p>
                        {app.daysUntilPublication !== null && (
                          <p className={`text-xs mt-1 ${
                            app.daysUntilPublication < 90 
                              ? 'text-red-600 font-medium' 
                              : 'text-gray-600'
                          }`}>
                            {app.daysUntilPublication > 0 
                              ? `${app.daysUntilPublication} days remaining`
                              : 'Published'
                            }
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                    {/* Footer */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        Created {formatDate(app.created_at)}
                      </p>
                    </div>
                  </div>
                  {/* End clickable div */}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
