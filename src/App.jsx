import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthGate from './pages/AuthGate';
import MonitoringLanding from './components/MonitoringLanding';
import Dashboard from './pages/Dashboard';
import NewProvisionalPage from './pages/NewProvisionalPage';
import Submarine from './components/Submarine';

/**
 * Router Configuration for Trogon Monitoring System
 * 
 * ALL ROUTES are protected by AuthGate
 * Only brad@trogonpatent.ai and laura@trogonpatent.ai can access
 * 
 * Flow:
 * 1. AuthGate authenticates user
 * 2. Landing page shows Hunt/Submarine buttons
 * 3. /hunt → Dashboard + Hunt system routes
 * 4. /submarine → Submarine monitoring dashboard
 * 
 * Routes:
 * - / → Landing page (choose Hunt or Submarine)
 * - /hunt → Hunt dashboard
 * - /hunt/provisional/new → Upload new provisional (Phase A)
 * - /submarine → Submarine monitoring dashboard
 * 
 * Future Phase Routes (add as you build):
 * - /hunt/provisional/:id → Application details
 * - /hunt/provisional/:id/search → Phase B: POD-based search
 * - /hunt/provisional/:id/classify → Phase C: Classification validation
 * - /hunt/provisional/:id/threshold → Phase F: Threshold selection
 * - /hunt/provisional/:id/monitoring → Phase G: Monitoring dashboard
 */
function App() {
  return (
    <BrowserRouter>
      <AuthGate>
        {(userEmail) => (
          <Routes>
            {/* Landing page - choose Hunt or Submarine */}
            <Route path="/" element={<MonitoringLanding userEmail={userEmail} />} />
            
            {/* Hunt System Routes */}
            <Route path="/hunt" element={<Dashboard userEmail={userEmail} />} />
            <Route path="/hunt/provisional/new" element={<NewProvisionalPage userEmail={userEmail} />} />
            
            {/* Submarine System Route */}
            <Route path="/submarine" element={<Submarine userEmail={userEmail} />} />
            
            {/* Future Hunt routes - uncomment as you build them */}
            {/* <Route path="/hunt/provisional/:id" element={<ApplicationDetails userEmail={userEmail} />} /> */}
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
          Go to Home
        </a>
      </div>
    </div>
  );
}

export default App;
