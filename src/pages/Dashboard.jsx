import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FileText, LogOut } from 'lucide-react';

/**
 * Hunt Dashboard - Main landing page for Hunt system
 * 
 * Phase A-E: Upload provisionals, search, validate, score
 * 
 * Shows list of all provisional applications and their current phase status
 */
export default function Dashboard({ userEmail }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear any session storage
    sessionStorage.clear();
    localStorage.clear();
    
    // Reload to auth page
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-2xl p-8">
          {/* Header with Video and Centered Title */}
          <div className="mb-6 pb-4 border-b border-slate-200">
            <div className="flex justify-between items-center">
              {/* Video at left */}
              <div className="relative bg-slate-900 rounded-lg overflow-hidden" style={{ width: '240px', height: '135px' }}>
                <video
                  className="absolute inset-0 w-full h-full"
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{ objectFit: 'cover' }}
                >
                  <source src="/trogon-hunt.mp4" type="video/mp4" />
                </video>
              </div>
              
              {/* Centered Title - vertically aligned with video */}
              <div className="flex-1 text-center">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">trogon Hunt Dashboard</h1>
                <p className="text-slate-600">Prior Art Search & Classification Validation</p>
              </div>
              
              {/* Logout at right - vertically aligned with video */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-emerald-600 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{userEmail}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Empty State - REDUCED PADDING */}
          <div className="text-center py-8">
            {/* Large binoculars - 256px with reduced bottom margin */}
            <div className="inline-flex items-center justify-center w-64 h-64 mb-4">
              <img 
                src="/binoculars-icon.png" 
                alt="Binoculars" 
                className="w-full h-full object-contain"
              />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">No Provisional Applications Yet</h2>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              Upload your first provisional patent to begin Points of Distinction ("PODs") extraction, prior art search, and classification validation
            </p>
            <button
              onClick={() => navigate('/hunt/provisional/new')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Upload Provisional Patent
            </button>
          </div>

          {/* Step Overview - REDUCED TOP MARGIN */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 Card - FileText Icon */}
            <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-bold text-slate-900">Step 1: Upload</h3>
              </div>
              <p className="text-sm text-slate-600">
                Upload Provisional Patent Data, extract PODs, get CPC predictions
              </p>
            </div>

            {/* Step 2 Card - Search/Magnifying Glass Icon */}
            <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-emerald-100 p-2 rounded-lg">
                  <Search className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="font-bold text-slate-900">Step 2: Search</h3>
              </div>
              <p className="text-sm text-slate-600">
                POD-based search, score and filter patents
              </p>
            </div>

            {/* Step 3 Card - Checkmark Icon */}
            <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-slate-900">Step 3: Validate</h3>
              </div>
              <p className="text-sm text-slate-600">
                Extract & validate classifications
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
