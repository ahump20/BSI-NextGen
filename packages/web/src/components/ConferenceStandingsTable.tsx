'use client';

import type { ConferenceStanding } from '@bsi/shared';
import { useState } from 'react';

interface ConferenceStandingsTableProps {
  standings: ConferenceStanding[];
  conference: string;
  availableConferences: string[];
  onConferenceChange: (conference: string) => void;
}

export function ConferenceStandingsTable({
  standings,
  conference,
  availableConferences,
  onConferenceChange,
}: ConferenceStandingsTableProps) {
  return (
    <div className="bg-gray-900 rounded-lg p-4">
      {/* Header with Conference Selector */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-xl font-bold text-blaze-orange">Conference Standings</h2>
        <select
          value={conference}
          onChange={(e) => onConferenceChange(e.target.value)}
          className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:border-blaze-orange focus:outline-none"
        >
          {availableConferences.map((conf) => (
            <option key={conf} value={conf}>
              {conf}
            </option>
          ))}
        </select>
      </div>

      {/* Mobile-optimized standings table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="px-3 py-2 text-left font-semibold text-gray-400">Team</th>
              <th className="px-3 py-2 text-center font-semibold text-gray-400">CONF</th>
              <th className="px-3 py-2 text-center font-semibold text-gray-400">OVERALL</th>
              <th className="px-3 py-2 text-center font-semibold text-gray-400">WIN%</th>
              <th className="px-3 py-2 text-center font-semibold text-gray-400">STRK</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((standing, index) => (
              <tr
                key={standing.team}
                className="border-b border-gray-800 hover:bg-gray-800 transition-colors"
              >
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-xs font-medium w-6">
                      {index + 1}
                    </span>
                    <span className="font-medium text-white">{standing.team}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-center text-gray-300">
                  {standing.conferenceRecord}
                </td>
                <td className="px-3 py-3 text-center text-gray-300">
                  {standing.overallRecord}
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="font-semibold text-blaze-orange">
                    {(standing.winPercentage * 100).toFixed(1)}%
                  </span>
                </td>
                <td className="px-3 py-3 text-center">
                  {standing.streak ? (
                    <span
                      className={`text-xs font-medium ${
                        standing.streak.startsWith('W')
                          ? 'text-green-400'
                          : standing.streak.startsWith('L')
                          ? 'text-red-400'
                          : 'text-gray-400'
                      }`}
                    >
                      {standing.streak}
                    </span>
                  ) : (
                    <span className="text-gray-600">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {standings.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No standings available for this conference
        </div>
      )}
    </div>
  );
}
