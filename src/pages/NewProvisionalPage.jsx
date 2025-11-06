import { Link } from 'react-router-dom';
import ProvisionalUpload from '../components/ProvisionalUpload';
/**
 * Page: /provisional/new
 * 
 * Route for creating a new provisional patent application
 */
export default function NewProvisionalPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Optional: Add navigation header */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <h1 className="text-lg font-bold text-gray-900">trogon Hunt</h1>
              <p className="text-xs text-gray-500">Prior Art Search & Classification Validation</p>
            </div>
          </div>
          <Link 
            to="/" 
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </nav>
      {/* Main content */}
      <div className="py-8">
        <ProvisionalUpload />
      </div>
      {/* Optional: Footer */}
      <footer className="border-t border-gray-200 bg-white py-6 mt-12">
        <div className="max-w-4xl mx-auto px-6 text-center text-sm text-gray-500">
          <p>Trogon Mobile © 2025 | Phase A: Provisional Upload & Classification</p>
        </div>
      </footer>
    </div>
  );
}
