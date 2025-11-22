import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Phase A: Provisional Upload & Classification
 * Multiple files + DOCX support + Real APIs
 */

export default function ProvisionalUpload({ onLogout }) {
  const navigate = useNavigate();
  
  // Form state
  const [filingDate, setFilingDate] = useState('');
  const [files, setFiles] = useState([]); // Changed to array
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
  const [primaryPodId, setPrimaryPodId] = useState(null);
  const [applicationId, setApplicationId] = useState(null);

  // Handle file selection - MULTIPLE FILES + DOCX
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

    // Aggregate files, dedupe by name, max 10
    setFiles(prev => {
      const existingNames = new Set(prev.map(f => f.name));
      const newFiles = selectedFiles.filter(f => !existingNames.has(f.name));
      const combined = [...prev, ...newFiles];
      if (combined.length > 10) {
        setError('Maximum 10 files allowed');
        return combined.slice(0, 10);
      }
      return combined;
    });
    setError(null);
  };

  // Remove individual file
  const removeFile = (fileName) => {
    setFiles(prev => prev.filter(f => f.name !== fileName));
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
    
    // Aggregate files, dedupe by name, max 10
    setFiles(prev => {
      const existingNames = new Set(prev.map(f => f.name));
      const newFiles = droppedFiles.filter(f => !existingNames.has(f.name));
      const combined = [...prev, ...newFiles];
      if (combined.length > 10) {
        setError('Maximum 10 files allowed');
        return combined.slice(0, 10);
      }
      return combined;
    });
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
      
      // Add all files
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

      setTimeout(() => {
        handleClassification(data.extractedText, data.title, data.id);
      }, 1000);

    } catch (err) {
      setError(err.message);
      setIsProcessing(false);
      setStep('upload');
    }
  };

  // Call Classification API
  const handleClassification = async (textToClassify, titleToUse, appId) => {
    setStep('classification');

    const specTextToUse = textToClassify || specText;
    const titleToUseActual = titleToUse || title;
    const applicationIdToUse = appId || applicationId;

    try {
      const response = await fetch('/api/classify-provisional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          specText: specTextToUse, 
          title: titleToUseActual,
          applicationId: applicationIdToUse 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Classification failed');
      }

      const data = await response.json();

      console.log('Classification API response:', {
        primaryCpc: data.primaryCpc,
        podCount: data.pods.length,
        cpcCount: data.cpcPredictions.length
      });

      setCpcPredictions(data.cpcPredictions);
      setPrimaryCpc(data.primaryCpc);
      setTechnologyArea(data.technologyArea);

      await new Promise(resolve => setTimeout(resolve, 1500));

      setStep('pods');
      await new Promise(resolve => setTimeout(resolve, 1000));

      const transformedPods = data.pods.map((pod, index) => ({
        id: index + 1,
        text: pod.pod_text,
        rationale: pod.rationale,
        isPrimary: pod.is_primary,
        suggested: true
      }));

      setSuggestedPods(transformedPods);
      setApprovedPods(transformedPods.filter(p => p.isPrimary));
      // Set initial primary to AI-suggested primary
      const aiPrimary = transformedPods.find(p => p.isPrimary);
      if (aiPrimary) setPrimaryPodId(aiPrimary.id);
      
      // Use AI-generated title
      if (data.generatedTitle) setTitle(data.generatedTitle);
      
      setIsProcessing(false);
      setStep('review');

    } catch (err) {
      console.error('Classification error:', err);
      setError(err.message || 'Classification and POD extraction failed');
      setIsProcessing(false);
      setStep('upload');
    }
  };

  const determineTechnologyArea = (cpcCode) => {
    const prefix = cpcCode.substring(0, 3);
    const areaMap = {
      'G06': 'Software/Computing',
      'H04': 'Communication/Networking',
      'A61': 'Medical Devices',
      'C07': 'Chemistry/Pharmaceuticals',
      'F16': 'Mechanical Engineering',
      'H01': 'Electrical Engineering',
      'E05': 'Locks/Keys/Accessories',
      'B62': 'Land Vehicles'
    };
    return areaMap[prefix] || 'General Technology';
  };

  const togglePodApproval = (podId) => {
    const pod = suggestedPods.find(p => p.id === podId);
    if (!pod) return;

    if (approvedPods.find(p => p.id === podId)) {
      setApprovedPods(approvedPods.filter(p => p.id !== podId));
      // If removing the primary, clear primary selection
      if (primaryPodId === podId) setPrimaryPodId(null);
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
      const response = await fetch('/api/save-provisional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          title,
          filingDate: isPreFiling ? null : filingDate,
          isPreFiling,
          cpcPredictions,
          primaryCpc,
          technologyArea,
          approvedPods
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Save failed');
      }

      const data = await response.json();
      console.log('Save successful:', data.summary);

      setStep('complete');
      setIsProcessing(false);

    } catch (err) {
      console.error('Save error:', err);
      setError(err.message || 'Failed to save provisional data');
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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Back to Dashboard</span>
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-2">Upload Provisional Patent Application</h1>
        <p className="text-gray-600 mb-6">
          Phase A: Upload your provisional specification to begin monitoring
        </p>

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

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

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
                      <p className="text-xs text-blue-600 font-medium mt-2">
                        ✓ {files.length} file{files.length > 1 ? 's' : ''} selected (see below)
                      </p>
                    )}
                  </div>
                </label>
              </div>
              {files.length > 0 && (
                <div className="mt-3 border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <p className="text-xs font-medium text-gray-700 mb-2">Selected files ({files.length}/10):</p>
                  <ul className="space-y-1">
                    {files.map((f, i) => (
                      <li key={i} className="flex items-center justify-between text-xs">
                        <span className="truncate flex-1 mr-2">{f.name} ({(f.size / 1024).toFixed(0)} KB)</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeFile(f.name); }}
                          className="text-red-500 hover:text-red-700 font-medium px-2"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="mt-2 text-xs text-gray-500">
                Upload spec + drawings together. Title will be auto-generated from AI.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Filing Date <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              
              <div className="mb-3">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                          type="checkbox"
                          checked={!!isApproved}
                          onChange={() => togglePodApproval(pod.id)}
                          className="mt-1 h-5 w-5 text-blue-600"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {isApproved && (
                              <button
                                type="button"
                                onClick={() => setPrimaryPodId(pod.id)}
                                className={`text-xs px-2 py-1 rounded ${
                                  primaryPodId === pod.id 
                                    ? 'bg-green-500 text-white' 
                                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                }`}
                              >
                                {primaryPodId === pod.id ? '★ Primary' : 'Set Primary'}
                              </button>
                            )}
                            {pod.isPrimary && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                AI Suggested
                              </span>
                            )}
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
                      Publication deadline: {calculatePublicationDeadline(filingDate)}
                    </p>
                  )}
                </div>
              )}

              {isPreFiling && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    Pre-filing mode: No publication deadline tracking yet
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

        {(step === 'processing' || step === 'classification' || step === 'pods') && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <h3 className="text-xl font-semibold mb-2">
              {step === 'processing' && 'Extracting text from files...'}
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

        {step === 'review' && (
          <div className="space-y-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Application Details</h3>
              <p className="text-sm mb-1">
                <span className="font-medium">Title:</span> {title}
              </p>
              <p className="text-sm">
                <span className="font-medium">Status:</span> {isPreFiling ? 'Pre-filing' : `Filed: ${filingDate}`}
              </p>
            </div>

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

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm">
                <span className="font-medium">Approved PODs:</span> {approvedPods.length}
                {approvedPods.length < 3 && (
                  <span className="text-red-600 ml-2">
                    (Minimum 3 required)
                  </span>
                )}
              </p>
              <p className="text-sm mt-1">
                <span className="font-medium">Primary POD:</span>{' '}
                {primaryPodId 
                  ? <span className="text-green-600">Selected</span>
                  : <span className="text-red-600">Please select a primary POD</span>
                }
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setStep('upload');
                  setFiles([]);
                  setError(null);
                }}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Start Over
              </button>
             <button
                onClick={handleSave}
                disabled={isProcessing || approvedPods.length < 3 || !primaryPodId}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? 'Saving...' : 'Save & Continue'}
              </button>
            </div>
          </div>
        )}

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
              <p className="text-sm text-gray-600">
                {isPreFiling ? 'Pre-filing' : `Filed: ${filingDate}`}
              </p>
              {!isPreFiling && (
                <p className="text-sm text-gray-600">
                  Publication: {calculatePublicationDeadline(filingDate)}
                </p>
              )}
              <p className="text-sm text-gray-600 mt-2">PODs Approved: {approvedPods.length}</p>
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
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Upload Another
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
