'use client';

import React from 'react';
import { SportType, SPORT_LABELS, SPORT_ICONS } from '@/types/trends';

interface SportFilterProps {
  selectedSport: SportType;
  onSportChange: (sport: SportType) => void;
}

const SPORTS: SportType[] = [
  'all',
  'college_baseball',
  'mlb',
  'college_football',
  'nfl',
  'college_basketball',
];

export function SportFilter({ selectedSport, onSportChange }: SportFilterProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter by Sport</h2>

      {/* Mobile: Dropdown */}
      <div className="md:hidden">
        <select
          value={selectedSport}
          onChange={(e) => onSportChange(e.target.value as SportType)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {SPORTS.map((sport) => (
            <option key={sport} value={sport}>
              {SPORT_ICONS[sport]} {SPORT_LABELS[sport]}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop: Buttons */}
      <div className="hidden md:flex md:flex-wrap gap-2">
        {SPORTS.map((sport) => (
          <button
            key={sport}
            onClick={() => onSportChange(sport)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
              transition-all duration-200
              ${
                selectedSport === sport
                  ? 'bg-blue-600 text-white shadow-md scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            <span className="text-lg">{SPORT_ICONS[sport]}</span>
            <span>{SPORT_LABELS[sport]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
