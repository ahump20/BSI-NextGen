import Link from 'next/link';

/**
 * NCAA Fusion Dashboard Card
 *
 * Navigation card for the NCAA Fusion Dashboard that merges
 * ESPN analytics with NCAA.com scoreboard data
 */
export function NcaaFusionCard() {
  return (
    <Link
      href="/college/fusion?sport=basketball"
      className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-200 transform hover:scale-105 overflow-hidden border-2 border-amber-100"
    >
      <div className="bg-gradient-to-br from-amber-600 to-orange-600 p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-2xl font-bold">NCAA Fusion</h4>
          <span className="px-3 py-1 bg-green-400 text-gray-900 text-xs font-bold rounded-full">
            NEW
          </span>
        </div>
        <p className="text-amber-100 text-sm">
          ESPN analytics merged with live NCAA scoreboard
        </p>
      </div>
      <div className="p-6">
        <ul className="space-y-2 text-sm">
          <li className="flex items-center text-gray-700">
            <svg
              className="w-5 h-5 text-green-500 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Pythagorean win expectations
          </li>
          <li className="flex items-center text-gray-700">
            <svg
              className="w-5 h-5 text-green-500 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Live game scoreboard integration
          </li>
          <li className="flex items-center text-gray-700">
            <svg
              className="w-5 h-5 text-green-500 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Basketball, Football, Baseball
          </li>
        </ul>

        {/* Quick Sport Links */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
            Quick Access
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/college/fusion?sport=basketball&teamId=251"
              className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-medium rounded-full transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              🏀 Texas BBall
            </Link>
            <Link
              href="/college/fusion?sport=football&teamId=333"
              className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-medium rounded-full transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              🏈 Alabama FB
            </Link>
            <Link
              href="/college/fusion?sport=baseball&teamId=8"
              className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-medium rounded-full transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              ⚾ Arkansas BB
            </Link>
          </div>
        </div>
      </div>
    </Link>
  );
}
