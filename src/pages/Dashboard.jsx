import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, FileText } from 'lucide-react';

/**
 * Hunt Dashboard - Main landing page for Hunt system
 * 
 * Phase A-E: Upload provisionals, search, validate, score
 * 
 * Shows list of all provisional applications and their current phase status
 */
export default function Dashboard({ userEmail }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="mb-4 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <div className="bg-white rounded-lg shadow-2xl p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-200">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">🔍 Hunt Dashboard</h1>
              <p className="text-slate-600">Prior Art Search & Classification Validation</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/hunt/provisional/new')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Provisional
              </button>
              <div className="flex items-center gap-2 text-emerald-600 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{userEmail}</span>
              </div>
            </div>
          </div>

          {/* Empty State */}
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-50 rounded-full mb-6">
              <Search className="w-12 h-12 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">No Provisional Applications Yet</h2>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              Upload your first provisional patent to begin POD extraction, prior art search, and classification validation
            </p>
            <button
              onClick={() => navigate('/hunt/provisional/new')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Upload Provisional Patent
            </button>
          </div>

          {/* Phase Overview */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Phase A Card */}
            <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-bold text-slate-900">Phase A: Upload</h3>
              </div>
              <p className="text-sm text-slate-600">
                Upload provisional spec, extract PODs, get CPC predictions
              </p>
            </div>

            {/* Phase B Card */}
            <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-emerald-100 p-2 rounded-lg">
                  <Search className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="font-bold text-slate-900">Phase B: Search</h3>
              </div>
              <p className="text-sm text-slate-600">
                POD-based search, score 500-1000 patents, filter 70%+
              </p>
            </div>

            {/* Phase C Card */}
            <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-slate-900">Phase C: Validate</h3>
              </div>
              <p className="text-sm text-slate-600">
                Extract & validate classifications, search edge cases
              </p>
            </div>
          </div>

          {/* Development Note */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              📝 <strong>Development Status:</strong> Phase A implementation in progress. 
              Database connected, ready to build upload flow.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
