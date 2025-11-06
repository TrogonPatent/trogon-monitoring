import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import NewProvisionalPage from './pages/NewProvisionalPage';

/**
 * Router Configuration for Trogon Submarine
 * 
 * Phase A Routes:
 * - / → Dashboard (default)
 * - /dashboard → Dashboard
 * - /provisional/new → Upload new provisional
 * 
 * Future Phase Routes (add as you build):
 * - /provisional/:id → Application details
 * - /provisional/:id/search → Phase B: POD-based search
 * - /provisional/:id/classify → Phase C: Classification validation
 * - /provisional/:id/threshold → Phase F: Threshold selection
 * - /provisional/:id/monitoring → Phase G: Monitoring dashboard
 */

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Provisional routes */}
        <Route path="/provisional/new" element={<NewProvisionalPage />} />
        
        {/* Future routes - uncomment as you build them */}
        {/* <Route path="/provisional/:id" element={<ApplicationDetails />} /> */}
        {/* <Route path="/provisional/:id/search" element={<PodSearch />} /> */}
        {/* <Route path="/provisional/:id/classify" element={<ClassificationValidation />} /> */}
        {/* <Route path="/provisional/:id/threshold" element={<ThresholdSelection />} /> */}
        {/* <Route path="/provisional/:id/monitoring" element={<MonitoringDashboard />} /> */}
        
        {/* 404 catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
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
          href="/dashboard"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}

export default App;
