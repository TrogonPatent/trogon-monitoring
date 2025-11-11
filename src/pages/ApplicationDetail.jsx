import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  Code, 
  Download, 
  AlertCircle,
  CheckCircle,
  Star,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function ApplicationDetail({ onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [application, setApplication] = useState(null);
  const [pods, setPods] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFullSpec, setShowFullSpec] = useState(false);

  useEffect(() => {
    fetchApplicationDetails();
  }, [id]);

  const fetchApplicationDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/get-application-details?id=${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Application not found');
        }
        throw new Error('Failed to fetch application details');
      }

      const data = await response.json();
      setApplication(data.application);
      setPods(data.pods);
      setSummary(data.summary);
      
    } catch (err) {
      console.error('Error fetching application:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const downloadFile = () => {
    if (application?.file_url) {
      window.open(application.file_url, '_blank');
    }
  };

  const truncateSpec = (text, maxLength = 1000) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Error Loading Application</h3>
                <p className="text-red-700 text-sm mb-4">{error}</p>
                <button
                  onClick={() => navigate('/')}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  ← Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!application) {
    return null;
  }

  const primaryPods = pods.filter(p => p.isPrimary);
  const secondaryPods = pods.filter(p => !p.isPrimary);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
          
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                {application.title}
              </h1>
              
              {/* Status Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {application.isPreFiling ? (
                  <span className="inline-flex items-center gap-1 text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                    <Calendar className="w-4 h-4" />
                    Pre-filing
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">
                    <CheckCircle className="w-4 h-4" />
                    Filed
                  </span>
                )}
                
                {application.technology_area && (
                  <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                    {application.technology_area}
                  </span>
                )}
                
                {application.predicted_primary_cpc && (
                  <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-mono">
                    {application.predicted_primary_cpc}
                  </span>
                )}
              </div>
            </div>

            {/* Download Button */}
            {application.file_url && (
              <button
                onClick={downloadFile}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download File
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Metadata */}
          <div className="lg:col-span-1 space-y-6">
            {/* Timeline Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                Timeline
              </h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Created</p>
                  <p className="text-gray-900 font-medium">{formatDate(application.created_at)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">Filing Date</p>
                  <p className="text-gray-900 font-medium">
                    {application.filing_date ? formatDate(application.filing_date) : 'Pre-filing'}
                  </p>
                </div>
                
                {!application.isPreFiling && application.publication_deadline && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Publication Deadline</p>
                    <p className="text-gray-900 font-medium">{formatDate(application.publication_deadline)}</p>
                    {application.daysUntilPublication !== null && (
                      <p className={`text-sm mt-1 ${
                        application.daysUntilPublication < 90 
                          ? 'text-red-600 font-medium' 
                          : 'text-gray-600'
                      }`}>
                        {application.daysUntilPublication > 0 
                          ? `${application.daysUntilPublication} days remaining`
                          : 'Published'
                        }
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* File Info Card */}
            {application.file_name && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-400" />
                  File Information
                </h2>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Filename</p>
                    <p className="text-gray-900 text-sm font-mono break-all">{application.file_name}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Specification Length</p>
                    <p className="text-gray-900 font-medium">
                      {application.specLength.toLocaleString()} characters
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Summary Stats */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total PODs</span>
                  <span className="font-semibold text-gray-900">{summary?.podCount || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Primary PODs</span>
                  <span className="font-semibold text-gray-900">{summary?.primaryPodCount || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">CPC Codes</span>
                  <span className="font-semibold text-gray-900">{summary?.cpcCount || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* CPC Classifications Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Code className="w-5 h-5 text-gray-400" />
                CPC Classifications
              </h2>
              
              {application.cpcPredictions && application.cpcPredictions.length > 0 ? (
                <div className="space-y-3">
                  {application.cpcPredictions.map((cpc, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-mono font-semibold text-gray-900">{cpc.code}</p>
                        <p className="text-sm text-gray-600 mt-1">{cpc.description}</p>
                      </div>
                      <div className="ml-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {Math.round(cpc.confidence * 100)}% confidence
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No CPC classifications available</p>
              )}
            </div>

            {/* PODs Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-gray-400" />
                Points of Distinction
              </h2>
              
              {pods.length > 0 ? (
                <div className="space-y-4">
                  {/* Primary PODs */}
                  {primaryPods.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                        Primary PODs ({primaryPods.length})
                      </h3>
                      <div className="space-y-3">
                        {primaryPods.map((pod) => (
                          <div 
                            key={pod.id}
                            className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
                          >
                            <div className="flex items-start gap-3">
                              <Star className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-gray-900 leading-relaxed">{pod.text}</p>
                                {pod.rationale && (
                                  <p className="text-sm text-gray-600 mt-2 italic">
                                    Rationale: {pod.rationale}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Secondary PODs */}
                  {secondaryPods.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                        Secondary PODs ({secondaryPods.length})
                      </h3>
                      <div className="space-y-3">
                        {secondaryPods.map((pod) => (
                          <div 
                            key={pod.id}
                            className="p-4 bg-gray-50 border border-gray-200 rounded-lg"
                          >
                            <p className="text-gray-900 leading-relaxed">{pod.text}</p>
                            {pod.rationale && (
                              <p className="text-sm text-gray-600 mt-2 italic">
                                Rationale: {pod.rationale}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No PODs defined</p>
              )}
            </div>

            {/* Specification Text Card */}
            {application.specification_text && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-400" />
                    Specification Text
                  </h2>
                  <button
                    onClick={() => setShowFullSpec(!showFullSpec)}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {showFullSpec ? (
                      <>
                        Show Less <ChevronUp className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Show Full Spec <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                    {showFullSpec 
                      ? application.specification_text 
                      : truncateSpec(application.specification_text, 1000)
                    }
                  </pre>
                </div>
                
                {!showFullSpec && application.specLength > 1000 && (
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    Showing first 1,000 characters of {application.specLength.toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
