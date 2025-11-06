import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Monitoring System Landing Page
 * 
 * Shows after successful authentication
 * Provides navigation to Hunt and Submarine systems
 */
export default function MonitoringLanding({ userEmail }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-2xl p-8">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Trogon Patent Monitoring</h1>
            <p className="text-slate-600">Choose a system to access</p>
            <div className="flex items-center justify-center gap-2 text-emerald-600 text-sm mt-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Authenticated: {userEmail}</span>
            </div>
          </div>

          {/* System Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            
            {/* Hunt System Card */}
            <button
              onClick={() => navigate('/hunt')}
              className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-8 text-white hover:shadow-xl transition-all group text-left"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="bg-white/20 p-4 rounded-lg">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-2">🔍 Hunt System</h3>
              <p className="text-blue-100 mb-4">
                POD-based prior art search and classification validation
              </p>
              <div className="flex items-center gap-2 text-sm text-blue-100">
                <span className="px-3 py-1 bg-white/20 rounded">Phase A-C</span>
                <span>• Upload & Search</span>
              </div>
            </button>

            {/* Submarine System Card */}
            <button
              onClick={() => navigate('/submarine')}
              className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-8 text-white hover:shadow-xl transition-all group text-left"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="bg-white/20 p-4 rounded-lg">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-2">🔒 Submarine</h3>
              <p className="text-green-100 mb-4">
                18-month provisional monitoring with safety net scoring
              </p>
              <div className="flex items-center gap-2 text-sm text-green-100">
                <span className="px-3 py-1 bg-white/20 rounded">Phase F-G</span>
                <span>• 60-day cycles</span>
              </div>
            </button>
          </div>

          {/* System Overview */}
          <div className="bg-slate-50 rounded-lg p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">System Overview</h2>
            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <strong>Hunt:</strong> Upload provisional patents, extract PODs, validate classifications, and build comprehensive prior art filters
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <strong>Submarine:</strong> Monitor publication window with 60-day cycles, safety net scoring, and automated IDS preparation
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-slate-200 text-center text-slate-500 text-sm">
            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Access restricted to brad@trogonpatent.ai and laura@trogonpatent.ai
          </div>
        </div>
      </div>
    </div>
  );
}
