import { useState } from 'react';
import './App.css';
import { SportsDataDashboard } from './components/SportsDataDashboard';
import { OddsComparison } from './components/OddsComparison';
import { ApiStatus } from './components/ApiStatus';

type Tab = 'sports-data' | 'odds' | 'status';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('sports-data');

  return (
    <div className="app">
      <header className="app-header">
        <h1>🏈 BSI Sports Dashboard</h1>
        <p className="subtitle">Real-time Sports Data & Odds Analysis</p>
      </header>

      <nav className="tab-navigation">
        <button
          className={`tab ${activeTab === 'sports-data' ? 'active' : ''}`}
          onClick={() => setActiveTab('sports-data')}
        >
          Sports Data
        </button>
        <button
          className={`tab ${activeTab === 'odds' ? 'active' : ''}`}
          onClick={() => setActiveTab('odds')}
        >
          Odds Comparison
        </button>
        <button
          className={`tab ${activeTab === 'status' ? 'active' : ''}`}
          onClick={() => setActiveTab('status')}
        >
          API Status
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'sports-data' && <SportsDataDashboard />}
        {activeTab === 'odds' && <OddsComparison />}
        {activeTab === 'status' && <ApiStatus />}
      </main>

      <footer className="app-footer">
        <p>
          Powered by SportsDataIO, SportsRadar, and TheOddsAPI |{' '}
          <a
            href="https://github.com/ahump20/BSI-NextGen"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
