import { useState } from 'react';

/**
 * Phase A: Provisional Upload & Classification
 * 
 * User Flow:
 * 1. Upload provisional spec(s) (PDF, TXT, or DOCX) - auto-extract title
 * 2. Optionally enter filing date (may be pre-filing)
 * 3. Extract text, classify with Claude API, extract PODs
 * 4. User reviews/approves PODs
 * 5. Save to database
 * 
 * CHANGES FROM PREVIOUS VERSION:
 * - ✅ Removed all mock data
 * - ✅ Added real API calls to backend
 * - ✅ Multiple file upload support
 * - ✅ Multiple file types (PDF, TXT, DOCX)
 * - ✅ Better error handling
 */

export default function ProvisionalUpload() {
  // Form state
  const [filingDate, setFilingDate] = useState('');
  const [files, setFiles] = useState([]);
  const [isPreFiling, setIsPreFiling] = useState(true);
  
  // Processing state
  const [step, setStep] = useState('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  
  // Results state
  const [title, setTitle] = useState('');
  const [specText, setSpecText] = useState('');
  const [cpcPredictions, setCpcPredictions] = useState([]);
  const [primaryCpc, setPrimaryCpc] = useState('');
  const [technologyArea, setTechnologyArea] = useState('');
  const [suggestedPods, setSuggestedPods] = useState([]);
  const [approvedPods, setApprovedPods] = useState([]);
  const [applicationId, setApplicationId] = useState(null);

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    const validTypes = [
      'application/pdf',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    const invalidFiles = selectedFiles.filter(f => !validTypes.includes(f.type));
    if (invalidFiles.length > 0) {
      setError(`Invalid file type: ${invalidFiles[0].name}. Please upload PDF, TXT, or DOCX files only.`);
      return;
    }

    setFiles(selectedFiles);
    setError(null);
  };

  // Handle drag and drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const validTypes = [
      'application/pdf',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    const invalidFiles = droppedFiles.filter(f => !validTypes.includes(f.type));
    if (invalidFiles.length > 0) {
      setError(`Invalid file type: ${invalidFiles[0].name}. Please upload PDF, TXT, or DOCX files only.`);
      return;
    }
    
    setFiles(droppedFiles);
    setError(null);
  };

  // Upload and extract text
  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please upload at least one file');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setStep('processing');

    try {
      const formData = new FormData();
      
      // Add all files to form data
      files.forEach(file => {
        formData.append('file', file);
      });
      
      formData.append('filingDate', filingDate || '');
      formData.append('isPreFiling', isPreFiling);

      const response = await fetch('/api/upload-provisional', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      
      const data = await response.json();
      
      setSpecText(data.extractedText || '');
      setTitle(data.title);
      setApplicationId(data.id);
      
      console.log('Upload successful:', {
        id: data.id,
        title: data.title,
        fileCount: data.fileCount,
        textLength: data.textLength
      });

      // Immediately proceed to classification
      setTimeout(() => {
        handleClassification(data.id, data.extractedText);
      }, 500);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message);
      setIsProcessing(false);
      setStep('upload');
    }
  };

  // Call Claude API for classification and POD extraction
  const handleClassification = async (appId, extractedText) => {
    setStep('classification');

    try {
      // Call real backend API (NO MOCK DATA)
      const response = await fetch('/api/classify-provisional', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          applicationId: appId,
          specificationText: extractedText
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Classification failed');
      }

      const data = await response.json();
      
      console.log('Classification successful:', {
        primaryCpc: data.primaryCpc,
        predictionsCount: data.predictions?.length || 0,
        podsCount: data.pods?.length || 0
      });

      // Set CPC classifications from API response
      if (data.predictions && data.predictions.length > 0) {
        setCpcPredictions(data.predictions);
        setPrimaryCpc(data.primaryCpc || data.predictions[0].code);
      } else {
        throw new Error('No CPC predictions returned from API');
      }
      
      // Set technology area
      const area = data.technologyArea || determineTechnologyArea(data.primaryCpc || data.predictions[0].code);
      setTechnologyArea(area);

      // Set PODs from API response
      if (data.pods && data.pods.length > 0) {
        // Transform PODs to match component state structure
        const transformedPods = data.pods.map((pod, index) => ({
          id: index + 1,
          text: pod.pod_text || pod.text,
          rationale: pod.rationale || 'AI-extracted POD',
          isPrimary: pod.is_primary !== false, // Default to true if not specified
          suggested: true
        }));
        
        setSuggestedPods(transformedPods);
        
        // Auto-approve primary PODs
        setApprovedPods(transformedPods.filter(p => p.isPrimary));
      } else {
        throw new Error('No PODs returned from API');
      }

      // Move to review step
      setIsProcessing(false);
      setStep('review');

    } catch (err) {
      console.error('Classification error:', err);
      setError(`Classification failed: ${err.message}`);
      setIsProcessing(false);
      setStep('upload');
    }
  };

  // Helper function to determine technology area from CPC code
  const determineTechnologyArea = (cpcCode) => {
    if (!cpcCode) return 'General Technology';
    
    const prefix = cpcCode.substring(0, 3);
    const areaMap = {
      'A61': 'Medical Devices',
      'A63': 'Sports/Games/Amusements',
      'B60': 'Vehicles',
      'B62': 'Land Vehicles',
      'C07': 'Chemistry/Pharmaceuticals',
      'C12': 'Biochemistry',
      'E05': 'Locks/Keys/Accessories',
      'F16': 'Mechanical Engineering',
      'G06': 'Software/Computing',
      'G16': 'ICT for Healthcare',
      'H01': 'Electrical Engineering',
      'H04': 'Communication/Networking'
    };
    return areaMap[prefix] || 'General Technology';
  };

  const togglePodApproval = (podId) => {
    const pod = suggestedPods.find(p => p.id === podId);
    if (!pod) return;

    if (approvedPods.find(p => p.id === podId)) {
      setApprovedPods(approvedPods.filter(p => p.id !== podId));
    } else {
      setApprovedPods([...approvedPods, pod]);
    }
  };

  const editPodText = (podId, newText) => {
    setSuggestedPods(suggestedPods.map(pod => 
      pod.id === podId ? { ...pod, text: newText, suggested: false } : pod
    ));
    setApprovedPods(approvedPods.map(pod =>
      pod.id === podId ? { ...pod, text: newText, suggested: false } : pod
    ));
  };

  const addCustomPod = () => {
    const newPod = {
      id: Date.now(),
      text: '',
      rationale: 'User-added POD',
      isPrimary: true,
      suggested: false
    };
    setSuggestedPods([...suggestedPods, newPod]);
  };

  const handleSave = async () => {
    if (approvedPods.length < 3) {
      setError('Please approve at least 3 PODs before saving');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Call backend API to save PODs to database
      const response = await fetch('/api/save-provisional', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          applicationId,
          approvedPods: approvedPods.map(pod => ({
            text: pod.text,
            rationale: pod.rationale,
            isPrimary: pod.isPrimary,
            suggested: pod.suggested
          })),
          primaryCpc,
          technologyArea
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save PODs');
      }

      console.log('PODs saved successfully');
      setStep('complete');
      setIsProcessing(false);
      
    } catch (err) {
      console.error('Save error:', err);
      setError(`Failed to save: ${err.message}`);
      setIsProcessing(false);
    }
  };

  const calculatePublicationDeadline = (filingDate) => {
    if (!filingDate) return 'N/A (Pre-filing)';
    const date = new Date(filingDate);
    date.setMonth(date.getMonth() + 18);
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Upload Provisional Patent Application</h1>
      <p className="text-gray-600 mb-6">
        Phase A: Upload your provisional specification to begin monitoring
      </p>

      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm ${step === 'upload' ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
            1. Upload
          </span>
          <span className={`text-sm ${step === 'classification' || step === 'processing' ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
            2. Classify
          </span>
          <span className={`text-sm ${step === 'review' ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
            3. Review
          </span>
          <span className={`text-sm ${step === 'complete' ? 'text-green-600 font-semibold' : 'text-gray-500'}`}>
            4. Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ 
              width: step === 'upload' ? '0%' : 
                     step === 'processing' ? '25%' :
                     step === 'classification' ? '50%' :
                     step === 'review' ? '75%' : '100%'
            }}
          />
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Step 1: Upload Form */}
      {step === 'upload' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Upload Provisional Patent Files
            </label>
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
              }}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".pdf,.txt,.docx"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="space-y-2">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="text-sm text-gray-600 font-medium">
                    {files.length > 0 ? `${files.length} file${files.length > 1 ? 's' : ''} selected` : 'Click to upload or drag files here'}
                  </p>
                  <p className="text-xs text-gray-500">
                    PDF, DOCX, or TXT • Multiple files OK • 25MB total
                  </p>
                  {files.length > 0 && (
                    <div className="text-xs text-blue-600 font-medium mt-2">
                      <p className="mb-1">✓ Files selected:</p>
                      <ul className="space-y-1 text-left max-w-xs mx-auto">
                        {files.map((f, i) => (
                          <li key={i} className="truncate">• {f.name} ({(f.size / 1024).toFixed(0)} KB)</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </label>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Upload spec + drawings together. Title will be auto-generated from content.
            </p>
          </div>

          {/* Filing Date */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Filing Date <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            
            <div className="mb-3">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPreFiling}
                  onChange={(e) => {
                    setIsPreFiling(e.target.checked);
                    if (e.target.checked) {
                      setFilingDate('');
                    }
                  }}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  This is pre-filing (not yet filed with USPTO)
                </span>
              </label>
            </div>

            {!isPreFiling && (
              <div>
                <input
                  type="date"
                  value={filingDate}
                  onChange={(e) => setFilingDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {filingDate && (
                  <p className="text-sm text-gray-600 mt-2">
                    📅 Publication deadline: {calculatePublicationDeadline(filingDate)}
                  </p>
                )}
              </div>
            )}

            {isPreFiling && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  ℹ️ Pre-filing mode: No publication deadline tracking yet
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleUpload}
            disabled={isProcessing || files.length === 0}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? 'Processing...' : 'Begin Classification'}
          </button>
        </div>
      )}

      {/* Processing / Classification */}
      {(step === 'processing' || step === 'classification') && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <h3 className="text-xl font-semibold mb-2">
            {step === 'processing' && 'Extracting text from files...'}
            {step === 'classification' && 'Analyzing with Claude API...'}
          </h3>
          <p className="text-gray-600">
            {step === 'processing' && 'Reading your specification and combining files'}
            {step === 'classification' && 'Predicting CPC classifications and extracting Points of Distinction'}
          </p>
          <p className="text-xs text-gray-500 mt-4">
            This may take 3-5 seconds...
          </p>
        </div>
      )}

      {/* Review PODs */}
      {step === 'review' && (
        <div className="space-y-6">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Application Details</h3>
            <p className="text-sm mb-1">
              <span className="font-medium">Title:</span> {title}
            </p>
            <p className="text-sm mb-1">
              <span className="font-medium">Status:</span> {isPreFiling ? '🟡 Pre-filing' : `🟢 Filed: ${filingDate}`}
            </p>
            <p className="text-xs text-gray-500 font-mono">ID: {applicationId}</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Classification Results</h3>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Primary CPC:</span> <code className="bg-white px-2 py-1 rounded text-xs">{primaryCpc}</code>
              </p>
              <p className="text-sm">
                <span className="font-medium">Technology Area:</span> {technologyArea}
              </p>
              <details className="text-sm">
                <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium">
                  View all predictions ({cpcPredictions.length})
                </summary>
                <ul className="mt-2 space-y-1 pl-4">
                  {cpcPredictions.map((pred, idx) => (
                    <li key={idx} className="text-xs">
                      <code className="bg-white px-2 py-1 rounded">{pred.code}</code> 
                      {pred.description && ` - ${pred.description}`}
                      {pred.confidence && ` (${(pred.confidence * 100).toFixed(0)}%)`}
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">
              Review Points of Distinction (PODs)
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Select at least 3 PODs that best describe your invention's unique features. These will be used for prior art searching.
            </p>

            <div className="space-y-3">
              {suggestedPods.map((pod) => {
                const isApproved = approvedPods.find(p => p.id === pod.id);
                return (
                  <div 
                    key={pod.id}
                    className={`border-2 rounded-lg p-4 transition-all ${
                      isApproved ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={!!isApproved}
                        onChange={() => togglePodApproval(pod.id)}
                        className="mt-1 h-5 w-5 text-blue-600"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {pod.isPrimary && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                              Primary
                            </span>
                          )}
                          {pod.suggested && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                              AI Suggested
                            </span>
                          )}
                          {!pod.suggested && (
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              User Added
                            </span>
                          )}
                        </div>
                        <textarea
                          value={pod.text}
                          onChange={(e) => editPodText(pod.id, e.target.value)}
                          placeholder="Enter POD description..."
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={2}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          💡 {pod.rationale}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={addCustomPod}
              className="mt-4 w-full border-2 border-dashed border-gray-300 rounded-lg py-3 text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors font-medium"
            >
              + Add Custom POD
            </button>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm">
              <span className="font-medium">Approved PODs:</span> {approvedPods.length}
              {approvedPods.length < 3 && (
                <span className="text-red-600 ml-2 font-medium">
                  ⚠️ (Minimum 3 required)
                </span>
              )}
              {approvedPods.length >= 3 && (
                <span className="text-green-600 ml-2">
                  ✓ Ready to save
                </span>
              )}
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => {
                setStep('upload');
                setFiles([]);
                setError(null);
                setCpcPredictions([]);
                setSuggestedPods([]);
                setApprovedPods([]);
              }}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              ← Start Over
            </button>
            <button
              onClick={handleSave}
              disabled={isProcessing || approvedPods.length < 3}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? 'Saving...' : 'Save & Continue →'}
            </button>
          </div>
        </div>
      )}

      {/* Complete */}
      {step === 'complete' && (
        <div className="text-center py-12">
          <div className="inline-block bg-green-100 rounded-full p-4 mb-4">
            <svg className="h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Provisional Application Saved!</h2>
          <p className="text-gray-600 mb-6">
            Your application has been saved with {approvedPods.length} approved PODs and is ready for Phase B (Prior Art Search).
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
            <p className="text-sm text-gray-600 mb-2">Application Details:</p>
            <p className="font-medium">{title}</p>
            <p className="text-sm text-gray-600 mt-1">
              {isPreFiling ? '🟡 Pre-filing' : `🟢 Filed: ${filingDate}`}
            </p>
            {!isPreFiling && (
              <p className="text-sm text-gray-600">
                📅 Publication: {calculatePublicationDeadline(filingDate)}
              </p>
            )}
            <p className="text-sm text-gray-600 mt-2">
              Primary CPC: <code className="bg-white px-2 py-1 rounded text-xs">{primaryCpc}</code>
            </p>
            <p className="text-sm text-gray-600 mt-1">PODs Approved: {approvedPods.length}</p>
            <p className="text-xs text-gray-500 mt-2 font-mono">ID: {applicationId}</p>
          </div>
          <div className="space-x-4">
            <button
              onClick={() => {
                setStep('upload');
                setTitle('');
                setFilingDate('');
                setFiles([]);
                setSpecText('');
                setSuggestedPods([]);
                setApprovedPods([]);
                setApplicationId(null);
                setIsPreFiling(true);
                setCpcPredictions([]);
                setPrimaryCpc('');
                setTechnologyArea('');
              }}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Upload Another
            </button>
            <button
              onClick={() => {
                window.location.href = `/hunt/application/${applicationId}`;
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              View Application →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
