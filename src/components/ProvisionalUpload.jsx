import { useState } from 'react';

/**
 * Phase A: Provisional Upload & Classification
 * 
 * User Flow:
 * 1. Upload provisional spec (PDF or text)
 * 2. Extract text from file
 * 3. Call USPTO classifier to predict CPC codes
 * 4. Extract PODs using Claude API
 * 5. User reviews/approves PODs
 * 6. Save to database
 */

export default function ProvisionalUpload() {
  // Form state
  const [title, setTitle] = useState('');
  const [filingDate, setFilingDate] = useState('');
  const [file, setFile] = useState(null);
  const [specText, setSpecText] = useState('');
  
  // Processing state
  const [step, setStep] = useState('upload'); // upload | processing | classification | pods | review | complete
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  
  // Results state
  const [cpcPredictions, setCpcPredictions] = useState([]);
  const [primaryCpc, setPrimaryCpc] = useState('');
  const [technologyArea, setTechnologyArea] = useState('');
  const [suggestedPods, setSuggestedPods] = useState([]);
  const [approvedPods, setApprovedPods] = useState([]);
  
  // Final application ID
  const [applicationId, setApplicationId] = useState(null);

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const fileType = selectedFile.type;
    const validTypes = ['application/pdf', 'text/plain'];
    
    if (!validTypes.includes(fileType)) {
      setError('Please upload a PDF or text file');
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  // Handle text paste (alternative to file upload)
  const handleTextPaste = (e) => {
    setSpecText(e.target.value);
    setError(null);
  };

  // Step 1: Upload and extract text
  const handleUpload = async () => {
    if (!title || !filingDate) {
      setError('Please provide title and filing date');
      return;
    }

    if (!file && !specText) {
      setError('Please upload a file or paste specification text');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setStep('processing');

    try {
      // TODO: Implement actual file upload and text extraction
      // For now, use mock data for testing UI
      
      if (file) {
        // Extract text from PDF or read text file
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        formData.append('filingDate', filingDate);

        // TODO: Replace with actual API call
        // const response = await fetch('/api/upload-provisional', {
        //   method: 'POST',
        //   body: formData
        // });
        // const data = await response.json();
        
        // Mock extracted text
        const mockExtractedText = specText || "A system and method for mobile patent filing using AI-powered document generation with multi-modal input processing...";
        setSpecText(mockExtractedText);
      }

      // Move to classification step
      setTimeout(() => {
        handleClassification();
      }, 1000);

    } catch (err) {
      setError(err.message);
      setIsProcessing(false);
      setStep('upload');
    }
  };

  // Step 2: Call USPTO classifier
  const handleClassification = async () => {
    setStep('classification');

    try {
      // TODO: Call USPTO classifier API
      // const response = await fetch('/api/classify-provisional', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ specText, title })
      // });
      // const data = await response.json();

      // Mock CPC predictions for testing
      const mockPredictions = [
        { code: 'G06F 40/169', confidence: 0.92, description: 'Document processing' },
        { code: 'G06N 3/08', confidence: 0.87, description: 'Neural networks' },
        { code: 'G06F 16/33', confidence: 0.81, description: 'Query processing' },
        { code: 'H04L 51/00', confidence: 0.75, description: 'User-to-user messaging' }
      ];

      setCpcPredictions(mockPredictions);
      setPrimaryCpc(mockPredictions[0].code);
      
      // Determine technology area from primary CPC
      const area = determineTechnologyArea(mockPredictions[0].code);
      setTechnologyArea(area);

      // Move to POD extraction
      setTimeout(() => {
        handlePodExtraction();
      }, 1500);

    } catch (err) {
      setError(err.message);
      setIsProcessing(false);
      setStep('upload');
    }
  };

  // Step 3: Extract PODs using Claude
  const handlePodExtraction = async () => {
    setStep('pods');

    try {
      // TODO: Call Claude API to extract PODs
      // const response = await fetch('/api/extract-pods', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ specText, title, primaryCpc })
      // });
      // const data = await response.json();

      // Mock POD suggestions for testing
      const mockPods = [
        {
          id: 1,
          text: 'Mobile device interface for patent document creation',
          rationale: 'Core distinguishing feature from desktop-only prior art',
          isPrimary: true,
          suggested: true
        },
        {
          id: 2,
          text: 'AI-powered claim generation from natural language input',
          rationale: 'Key innovation over manual drafting',
          isPrimary: true,
          suggested: true
        },
        {
          id: 3,
          text: 'Multi-modal input processing (text, voice, image)',
          rationale: 'Enhances accessibility and user experience',
          isPrimary: true,
          suggested: true
        },
        {
          id: 4,
          text: 'Real-time prior art checking during drafting',
          rationale: 'Secondary feature that adds value',
          isPrimary: false,
          suggested: true
        }
      ];

      setSuggestedPods(mockPods);
      setApprovedPods(mockPods.filter(p => p.isPrimary)); // Auto-approve primary PODs
      setIsProcessing(false);
      setStep('review');

    } catch (err) {
      setError(err.message);
      setIsProcessing(false);
      setStep('upload');
    }
  };

  // Helper: Determine technology area from CPC
  const determineTechnologyArea = (cpcCode) => {
    const prefix = cpcCode.substring(0, 3);
    const areaMap = {
      'G06': 'Software/Computing',
      'H04': 'Communication/Networking',
      'A61': 'Medical Devices',
      'C07': 'Chemistry/Pharmaceuticals',
      'F16': 'Mechanical Engineering',
      'H01': 'Electrical Engineering'
    };
    return areaMap[prefix] || 'General Technology';
  };

  // Toggle POD approval
  const togglePodApproval = (podId) => {
    const pod = suggestedPods.find(p => p.id === podId);
    if (!pod) return;

    if (approvedPods.find(p => p.id === podId)) {
      setApprovedPods(approvedPods.filter(p => p.id !== podId));
    } else {
      setApprovedPods([...approvedPods, pod]);
    }
  };

  // Edit POD text
  const editPodText = (podId, newText) => {
    setSuggestedPods(suggestedPods.map(pod => 
      pod.id === podId ? { ...pod, text: newText, suggested: false } : pod
    ));
    // Update approved list if this POD is approved
    setApprovedPods(approvedPods.map(pod =>
      pod.id === podId ? { ...pod, text: newText, suggested: false } : pod
    ));
  };

  // Add custom POD
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

  // Save to database
  const handleSave = async () => {
    if (approvedPods.length < 3) {
      setError('Please approve at least 3 PODs before saving');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // TODO: Save to database
      // const response = await fetch('/api/save-provisional', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     title,
      //     filingDate,
      //     specText,
      //     cpcPredictions,
      //     primaryCpc,
      //     technologyArea,
      //     approvedPods
      //   })
      // });
      // const data = await response.json();
      // setApplicationId(data.applicationId);

      // Mock successful save
      const mockAppId = 'mock-uuid-' + Date.now();
      setApplicationId(mockAppId);
      setStep('complete');
      setIsProcessing(false);

    } catch (err) {
      setError(err.message);
      setIsProcessing(false);
    }
  };

  // Calculate publication deadline
  const calculatePublicationDeadline = (filingDate) => {
    if (!filingDate) return '';
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
          <span className={`text-sm ${step === 'pods' ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
            3. Extract PODs
          </span>
          <span className={`text-sm ${step === 'review' ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
            4. Review
          </span>
          <span className={`text-sm ${step === 'complete' ? 'text-green-600 font-semibold' : 'text-gray-500'}`}>
            5. Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ 
              width: step === 'upload' ? '0%' : 
                     step === 'processing' ? '20%' :
                     step === 'classification' ? '40%' :
                     step === 'pods' ? '60%' :
                     step === 'review' ? '80%' : '100%'
            }}
          />
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Step 1: Upload Form */}
      {step === 'upload' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Application Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Mobile Patent Filing System"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Filing Date *
            </label>
            <input
              type="date"
              value={filingDate}
              onChange={(e) => setFilingDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {filingDate && (
              <p className="text-sm text-gray-600 mt-1">
                Publication deadline: {calculatePublicationDeadline(filingDate)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Upload Specification *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
              <input
                type="file"
                accept=".pdf,.txt"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="space-y-2">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="text-sm text-gray-600">
                    {file ? file.name : 'Click to upload PDF or text file'}
                  </p>
                  <p className="text-xs text-gray-500">
                    PDF or TXT up to 10MB
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Or Paste Specification Text
            </label>
            <textarea
              value={specText}
              onChange={handleTextPaste}
              placeholder="Paste your provisional specification text here..."
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
          </div>

          <button
            onClick={handleUpload}
            disabled={isProcessing}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? 'Processing...' : 'Begin Classification'}
          </button>
        </div>
      )}

      {/* Step 2-3: Processing */}
      {(step === 'processing' || step === 'classification' || step === 'pods') && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <h3 className="text-xl font-semibold mb-2">
            {step === 'processing' && 'Extracting text from file...'}
            {step === 'classification' && 'Calling USPTO classifier...'}
            {step === 'pods' && 'Extracting Points of Distinction...'}
          </h3>
          <p className="text-gray-600">
            {step === 'processing' && 'Reading your specification'}
            {step === 'classification' && 'Predicting CPC classifications'}
            {step === 'pods' && 'Identifying key distinguishing features'}
          </p>
        </div>
      )}

      {/* Step 4: Review PODs */}
      {step === 'review' && (
        <div className="space-y-6">
          {/* Classification Results */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Classification Results</h3>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Primary CPC:</span> {primaryCpc}
              </p>
              <p className="text-sm">
                <span className="font-medium">Technology Area:</span> {technologyArea}
              </p>
              <details className="text-sm">
                <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                  View all predictions ({cpcPredictions.length})
                </summary>
                <ul className="mt-2 space-y-1 pl-4">
                  {cpcPredictions.map((pred, idx) => (
                    <li key={idx}>
                      {pred.code} - {pred.description} ({(pred.confidence * 100).toFixed(0)}%)
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          </div>

          {/* POD Review */}
          <div>
            <h3 className="text-xl font-semibold mb-4">
              Review Points of Distinction (PODs)
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Select at least 3 PODs that best describe your invention's unique features.
              You can edit text or add custom PODs.
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
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              Primary
                            </span>
                          )}
                          {pod.suggested && (
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              AI Suggested
                            </span>
                          )}
                        </div>
                        <textarea
                          value={pod.text}
                          onChange={(e) => editPodText(pod.id, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={2}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Rationale: {pod.rationale}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={addCustomPod}
              className="mt-4 w-full border-2 border-dashed border-gray-300 rounded-lg py-3 text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              + Add Custom POD
            </button>
          </div>

          {/* Approval Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm">
              <span className="font-medium">Approved PODs:</span> {approvedPods.length}
              {approvedPods.length < 3 && (
                <span className="text-red-600 ml-2">
                  (Minimum 3 required)
                </span>
              )}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => setStep('upload')}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Start Over
            </button>
            <button
              onClick={handleSave}
              disabled={isProcessing || approvedPods.length < 3}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? 'Saving...' : 'Save & Continue'}
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Complete */}
      {step === 'complete' && (
        <div className="text-center py-12">
          <div className="inline-block bg-green-100 rounded-full p-4 mb-4">
            <svg className="h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Provisional Application Uploaded!</h2>
          <p className="text-gray-600 mb-6">
            Your application has been saved and is ready for monitoring.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
            <p className="text-sm text-gray-600 mb-2">Application Details:</p>
            <p className="font-medium">{title}</p>
            <p className="text-sm text-gray-600">Filed: {filingDate}</p>
            <p className="text-sm text-gray-600">Publication: {calculatePublicationDeadline(filingDate)}</p>
            <p className="text-sm text-gray-600 mt-2">PODs Approved: {approvedPods.length}</p>
            <p className="text-xs text-gray-500 mt-2 font-mono">ID: {applicationId}</p>
          </div>
          <div className="space-x-4">
            <button
              onClick={() => {
                // Reset form for new application
                setStep('upload');
                setTitle('');
                setFilingDate('');
                setFile(null);
                setSpecText('');
                setSuggestedPods([]);
                setApprovedPods([]);
                setApplicationId(null);
              }}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Upload Another
            </button>
            <button
              onClick={() => {
                // TODO: Navigate to Phase B (POD-based search)
                console.log('Navigate to POD search for application:', applicationId);
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Continue to Search →
            </button>
          </div>
        </div>
      )}

      {/* Development Notes */}
      <div className="mt-12 pt-6 border-t border-gray-200">
        <details className="text-sm text-gray-600">
          <summary className="cursor-pointer font-medium text-gray-800 mb-2">
            Development Notes (Remove in production)
          </summary>
          <div className="space-y-2 pl-4">
            <p>✅ UI Flow Complete: Upload → Classify → Extract PODs → Review → Save</p>
            <p>⏳ TODO: Wire up actual API endpoints:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>/api/upload-provisional - Handle file upload & text extraction</li>
              <li>/api/classify-provisional - Call USPTO classifier (or Claude fallback)</li>
              <li>/api/extract-pods - Use Claude to extract PODs from spec</li>
              <li>/api/save-provisional - Save to database with PODs</li>
            </ul>
            <p>📊 Current State: Using mock data for UI testing</p>
            <p>🎯 Next: Build backend endpoints to replace mock data</p>
          </div>
        </details>
      </div>
    </div>
  );
}
