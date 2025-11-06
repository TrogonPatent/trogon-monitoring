import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * Submarine Component - 18-Month Provisional Monitoring Dashboard
 * 
 * Phase F-G: Smart threshold selection and 60-day monitoring cycles
 * 
 * Features:
 * - Patentability score tracking
 * - Safety net with 4 automated checks
 * - 60-day monitoring cycles
 * - IDS preparation
 * 
 * This is a PLACEHOLDER - implement full functionality from implementation-phases.md
 */
export default function Submarine({ userEmail }) {
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
              <h1 className="text-3xl font-bold text-slate-900 mb-2">🔒 Submarine Monitoring</h1>
              <p className="text-slate-600">18-Month Provisional Patent Monitoring</p>
            </div>
            <div className="flex items-center gap-2 text-emerald-600 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Authenticated: {userEmail}</span>
            </div>
          </div>

          {/* Placeholder Content */}
          <div className="space-y-6">
            {/* Coming Soon Banner */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-8 text-white text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">Submarine Dashboard Coming Soon</h2>
              <p className="text-green-100">
                Complete Hunt system (Phase A-C) first, then implement Submarine monitoring
              </p>
            </div>

            {/* Feature Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Phase F Card */}
              <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Phase F: Smart Threshold</h3>
                </div>
                <ul className="text-sm text-slate-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Threshold recommendation by technology area</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Safety net (threshold - 5 points)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>4 automated safety checks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>User-adjustable with justification</span>
                  </li>
                </ul>
              </div>

              {/* Phase G Card */}
              <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Phase G: 60-Day Monitoring</h3>
                </div>
                <ul className="text-sm text-slate-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>Search new patents in validated CPCs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>Score against PODs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>Auto-disclose or safety band review</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>18-month publication window tracking</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Implementation Notes */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Implementation Roadmap</h3>
              <div className="space-y-2 text-sm text-blue-800">
                <p><strong>Prerequisites:</strong></p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Complete Hunt Phase A: Provisional upload & POD extraction</li>
                  <li>Complete Hunt Phase B: POD-based search</li>
                  <li>Complete Hunt Phase C: Classification validation</li>
                  <li>Complete Hunt Phase D: Representative claim generation</li>
                  <li>Complete Hunt Phase E: Patentability score display</li>
                </ol>
                <p className="mt-3"><strong>Then implement Submarine:</strong></p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Phase F: Smart threshold & safety net (6-8 hrs)</li>
                  <li>Phase G: 60-day monitoring cycles (4-5 hrs)</li>
                </ol>
              </div>
            </div>

            {/* Development Links */}
            <div className="bg-slate-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Development Resources</h3>
              <div className="space-y-2 text-sm text-slate-700">
                <p>📄 <strong>Documentation:</strong></p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><code>implementation-phases.md</code> - Full Phase F-G specifications</li>
                  <li><code>prior-art-prompt-templates.md</code> - Templates 4 & 7 for thresholds</li>
                  <li><code>prior-art-schema.md</code> - Database schema</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
