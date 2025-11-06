import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthGate from './pages/AuthGate';
import Dashboard from './pages/Dashboard';
import NewProvisionalPage from './pages/NewProvisionalPage';
import ApplicationDetail from './pages/ApplicationDetail';

/**
 * Router Configuration for Trogon Monitoring System
 * 
 * SIMPLIFIED ROUTING: Auth → Hunt Dashboard (direct)
 * 
 * Routes:
 * - / → Hunt dashboard (direct after auth)
 * - /provisional/new → Upload new provisional (Phase A)
 * - /application/:id → Application detail view (NEW)
 */
function App() {
  return (
    <BrowserRouter>
      <AuthGate>
        {(userEmail) => (
          <Routes>
            {/* Root goes directly to Hunt dashboard */}
            <Route path="/" element={<Dashboard userEmail={userEmail} />} />
            
            {/* Hunt System Routes */}
            <Route path="/provisional/new" element={<NewProvisionalPage userEmail={userEmail} />} />
            
            {/* Application Detail - NEW */}
            <Route path="/application/:id" element={<ApplicationDetail userEmail={userEmail} />} />
            
            {/* Future Hunt routes - uncomment as you build them */}
            {/* <Route path="/hunt/provisional/:id/search" element={<PodSearch userEmail={userEmail} />} /> */}
            {/* <Route path="/hunt/provisional/:id/classify" element={<ClassificationValidation userEmail={userEmail} />} /> */}
            {/* <Route path="/hunt/provisional/:id/threshold" element={<ThresholdSelection userEmail={userEmail} />} /> */}
            {/* <Route path="/hunt/provisional/:id/monitoring" element={<MonitoringDashboard userEmail={userEmail} />} /> */}
            
            {/* 404 catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        )}
      </AuthGate>
    </BrowserRouter>
  );
}

// Simple 404 page
function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">Page not found</p>
        <a 
          href="/"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-block"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}

export default App;
