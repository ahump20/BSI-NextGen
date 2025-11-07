import { useState, useEffect } from 'react';

interface ApiInfo {
  name: string;
  configured: boolean;
  description: string;
}

export function ApiStatus() {
  const [apis, setApis] = useState<ApiInfo[]>([]);

  useEffect(() => {
    const apiList: ApiInfo[] = [
      {
        name: 'SportsDataIO',
        configured: !!import.meta.env.VITE_SPORTSDATAIO_API_KEY,
        description: 'Real-time sports scores and statistics',
      },
      {
        name: 'SportsRadar',
        configured: !!import.meta.env.VITE_SPORTSRADAR_MASTER_API_KEY,
        description: 'Professional sports data and analytics',
      },
      {
        name: 'TheOddsAPI',
        configured: !!import.meta.env.VITE_THEODDSAPI_KEY,
        description: 'Sports betting odds comparison',
      },
    ];
    setApis(apiList);
  }, []);

  return (
    <div className="dashboard-section">
      <h2>API Configuration Status</h2>
      <div className="api-status-grid">
        {apis.map((api) => (
          <div
            key={api.name}
            className={`api-status-card ${api.configured ? 'configured' : 'not-configured'}`}
          >
            <div className="status-indicator">
              {api.configured ? '✓' : '✗'}
            </div>
            <div className="api-info">
              <h3>{api.name}</h3>
              <p>{api.description}</p>
              <span className="status-label">
                {api.configured ? 'Configured' : 'Not Configured'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="configuration-help">
        <h3>Configuration Guide</h3>
        <ol>
          <li>
            Add your API keys to the <code>.env</code> file:
            <ul>
              <li>
                <code>VITE_SPORTSDATAIO_API_KEY</code>
              </li>
              <li>
                <code>VITE_SPORTSRADAR_MASTER_API_KEY</code>
              </li>
              <li>
                <code>VITE_THEODDSAPI_KEY</code>
              </li>
            </ul>
          </li>
          <li>Restart the development server</li>
          <li>
            For production, add these variables to your deployment platform
            (Netlify/Vercel)
          </li>
        </ol>
      </div>
    </div>
  );
}
