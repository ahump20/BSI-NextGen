/**
 * Blaze Sports Intel Dashboard
 * Main entry point for the sports analytics web application
 *
 * Features:
 * - College Baseball coverage (box scores, rankings, standings)
 * - User authentication with Auth0 OAuth
 * - Protected routes for premium features
 * - Mobile-first responsive design
 * - Real-time data updates
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
} from 'react-router-dom';

// Pages
import CollegeBaseballGame from './pages/CollegeBaseballGame';
import CollegeBaseballSchedule from './pages/CollegeBaseballSchedule';
import CollegeBaseballRankings from './pages/CollegeBaseballRankings';
import CollegeBaseballStandings from './pages/CollegeBaseballStandings';
import Login from './pages/Login';
import UserProfile from './pages/UserProfile';

// Components
import ProtectedRoute from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import { useAuth } from './hooks/useAuth';

/**
 * Navigation Header
 */
const Header: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navLinkClass = (path: string) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive(path)
        ? 'bg-gray-900 text-white'
        : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
    }`;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                Blaze Sports Intel
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/college-baseball/schedule" className={navLinkClass('/college-baseball/schedule')}>
                Schedule
              </Link>
              <Link to="/college-baseball/rankings" className={navLinkClass('/college-baseball/rankings')}>
                Rankings
              </Link>
              <Link to="/college-baseball/standings" className={navLinkClass('/college-baseball/standings')}>
                Standings
              </Link>
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <Link
                to="/profile"
                className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || user.email}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-sm font-bold text-gray-600">
                      {(user.name || user.email).charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="hidden md:inline text-sm font-medium text-gray-700">
                  {user.name || user.email}
                </span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden mt-4 flex flex-wrap gap-2">
          <Link to="/college-baseball/schedule" className={navLinkClass('/college-baseball/schedule')}>
            Schedule
          </Link>
          <Link to="/college-baseball/rankings" className={navLinkClass('/college-baseball/rankings')}>
            Rankings
          </Link>
          <Link to="/college-baseball/standings" className={navLinkClass('/college-baseball/standings')}>
            Standings
          </Link>
        </div>
      </nav>
    </header>
  );
};

/**
 * Footer Component
 */
const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4">Blaze Sports Intel</h3>
            <p className="text-sm text-gray-400">
              Professional sports analytics platform covering college baseball, MLB,
              NFL, and more with real-time data and advanced insights.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/college-baseball/schedule" className="text-gray-400 hover:text-white transition-colors">
                  College Baseball
                </Link>
              </li>
              <li>
                <a href="/" className="text-gray-400 hover:text-white transition-colors">
                  Backyard Baseball Game
                </a>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <a
                  href="mailto:contact@blazesportsintel.com"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>
            &copy; {new Date().getFullYear()} Blaze Sports Intel. All rights reserved.
            {' · '}
            <span className="text-gray-500">America/Chicago</span>
          </p>
          <p className="mt-2 text-xs">
            Data updated in real-time from official sources. All statistics cited
            with sources and timestamps.
          </p>
        </div>
      </div>
    </footer>
  );
};

/**
 * Home Page / Dashboard
 */
const HomePage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Blaze Sports Intel
        </h1>
        <p className="text-lg text-gray-600">
          Professional sports analytics platform with real-time data and advanced insights.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* College Baseball Card */}
        <Link
          to="/college-baseball/schedule"
          className="block p-6 bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⚾</span>
            </div>
            <h2 className="ml-4 text-xl font-bold text-gray-900">
              College Baseball
            </h2>
          </div>
          <p className="text-gray-600 mb-4">
            Complete box scores, D1Baseball rankings, and conference standings
            with play-by-play coverage.
          </p>
          <div className="flex items-center text-blue-600 font-semibold">
            View Schedule
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        {/* MLB Card (Coming Soon) */}
        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 opacity-75">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⚾</span>
            </div>
            <h2 className="ml-4 text-xl font-bold text-gray-700">MLB</h2>
          </div>
          <p className="text-gray-500 mb-4">
            Live scores, standings, and advanced analytics. Coming soon.
          </p>
          <div className="text-gray-400 font-semibold">Coming Soon</div>
        </div>

        {/* NFL Card (Coming Soon) */}
        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 opacity-75">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏈</span>
            </div>
            <h2 className="ml-4 text-xl font-bold text-gray-700">NFL</h2>
          </div>
          <p className="text-gray-500 mb-4">
            Team stats, player analytics, and predictions. Coming soon.
          </p>
          <div className="text-gray-400 font-semibold">Coming Soon</div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Why Choose Blaze Sports Intel?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ✅ Real-Time Data
            </h3>
            <p className="text-gray-600">
              Live scores and stats updated every 30 seconds during games.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ✅ Complete Box Scores
            </h3>
            <p className="text-gray-600">
              Full player statistics that ESPN doesn't provide for college baseball.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ✅ Advanced Analytics
            </h3>
            <p className="text-gray-600">
              Pythagorean win expectations, strength of schedule, and more.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ✅ Mobile-First Design
            </h3>
            <p className="text-gray-600">
              Optimized for mobile devices with responsive layouts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Main App Component with Routing
 */
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">
            <Routes>
              {/* Home */}
              <Route path="/" element={<HomePage />} />

              {/* Authentication */}
              <Route path="/login" element={<Login />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                }
              />

              {/* College Baseball - Public Routes */}
              <Route path="/college-baseball/schedule" element={<CollegeBaseballSchedule />} />
              <Route path="/college-baseball/game/:gameId" element={<CollegeBaseballGame />} />
              <Route path="/college-baseball/rankings" element={<CollegeBaseballRankings />} />
              <Route path="/college-baseball/standings" element={<CollegeBaseballStandings />} />

              {/* Fallback */}
              <Route path="/college-baseball" element={<Navigate to="/college-baseball/schedule" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

// Initialize React app
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Enable hot module replacement for development
if (import.meta.hot) {
  import.meta.hot.accept();
}
