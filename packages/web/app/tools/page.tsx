import Link from 'next/link';

export const metadata = {
  title: 'Tools | Blaze Sports Intel',
  description: 'Advanced sports analytics tools and simulators',
};

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">
            Sports Analytics Tools
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Advanced tools for analyzing sports performance, visualizing data, and understanding the science behind the game
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">

          {/* Pitch Tunnel Simulator */}
          <Link href="/tools/pitch-tunnel-simulator" className="group">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-orange-500 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20 h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-orange-500/10 p-3 rounded-lg">
                  <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-orange-500 bg-orange-500/10 px-2 py-1 rounded">
                  3D PHYSICS
                </span>
              </div>

              <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-orange-500 transition-colors">
                Pitch Tunnel Simulator
              </h2>

              <p className="text-gray-400 mb-4">
                Interactive 3D baseball pitch visualization with real Magnus effect physics. Design pitches, analyze movement, and explore pitch tunneling concepts.
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded">Babylon.js</span>
                <span className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded">WebGPU</span>
                <span className="text-xs bg-purple-500/10 text-purple-400 px-2 py-1 rounded">Statcast</span>
              </div>

              <div className="flex items-center text-orange-500 group-hover:translate-x-1 transition-transform">
                <span className="font-semibold">Launch Simulator</span>
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          {/* MMI Calculator - Coming Soon */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 opacity-60 cursor-not-allowed h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-purple-500/10 p-3 rounded-lg">
                <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-gray-500 bg-gray-700 px-2 py-1 rounded">
                COMING SOON
              </span>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">
              MMI Calculator
            </h2>

            <p className="text-gray-400 mb-4">
              Calculate Moment Mentality Index for baseball pitches. Quantify mental difficulty using leverage index, pressure, fatigue, and execution factors.
            </p>

            <div className="flex flex-wrap gap-2">
              <span className="text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded">Analytics</span>
              <span className="text-xs bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded">Psychology</span>
            </div>
          </div>

          {/* Win Probability Model - Coming Soon */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 opacity-60 cursor-not-allowed h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-green-500/10 p-3 rounded-lg">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-gray-500 bg-gray-700 px-2 py-1 rounded">
                COMING SOON
              </span>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">
              Win Probability Model
            </h2>

            <p className="text-gray-400 mb-4">
              Real-time win probability calculations for live games. Track momentum swings and leverage situations as they unfold.
            </p>

            <div className="flex flex-wrap gap-2">
              <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded">Live Data</span>
              <span className="text-xs bg-purple-500/10 text-purple-400 px-2 py-1 rounded">ML Model</span>
            </div>
          </div>

        </div>

        {/* Back to Home */}
        <div className="text-center mt-16">
          <Link
            href="/"
            className="inline-flex items-center text-gray-400 hover:text-orange-500 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
