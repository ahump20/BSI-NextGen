'use client';

import React from 'react';
import Link from 'next/link';
import { Trend, SPORT_LABELS, SPORT_COLORS, SPORT_ICONS, SportType } from '@/types/trends';

interface TrendCardProps {
  trend: Trend;
}

export function TrendCard({ trend }: TrendCardProps) {
  const sportColor = SPORT_COLORS[trend.sport as SportType] || SPORT_COLORS.all;
  const sportIcon = SPORT_ICONS[trend.sport as SportType] || SPORT_ICONS.all;
  const sportLabel = SPORT_LABELS[trend.sport as SportType] || trend.sport;

  const timeSince = getTimeSince(trend.createdAt);

  return (
    <article className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
      {/* Header */}
      <div className={`${sportColor} px-4 py-2 flex items-center justify-between`}>
        <div className="flex items-center gap-2 text-white">
          <span className="text-xl">{sportIcon}</span>
          <span className="font-semibold text-sm uppercase tracking-wide">{sportLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/90 text-xs">{timeSince}</span>
          {trend.viralScore >= 70 && (
            <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
              🔥 {trend.viralScore}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-6">
        {/* Title */}
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 line-clamp-2">
          {trend.title}
        </h2>

        {/* Summary */}
        <p className="text-gray-700 text-sm md:text-base mb-4 line-clamp-3">
          {trend.summary}
        </p>

        {/* Key Players */}
        {trend.keyPlayers && trend.keyPlayers.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Key Players
            </h3>
            <div className="flex flex-wrap gap-2">
              {trend.keyPlayers.map((player, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {player}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Teams */}
        {trend.teamIds && trend.teamIds.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Teams
            </h3>
            <div className="flex flex-wrap gap-2">
              {trend.teamIds.map((team, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {team}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Significance */}
        {trend.significance && (
          <div className="mb-4 p-3 bg-orange-50 border-l-4 border-orange-500 rounded">
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-orange-800">Why it matters:</span>{' '}
              {trend.significance}
            </p>
          </div>
        )}

        {/* Sources */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Sources ({trend.sources.length})
          </h3>
          <div className="space-y-2">
            {trend.sources.slice(0, 3).map((source, idx) => (
              <a
                key={idx}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-blue-600 hover:text-blue-800 hover:underline line-clamp-1"
              >
                {source.title} - {source.sourceName}
              </a>
            ))}
            {trend.sources.length > 3 && (
              <p className="text-xs text-gray-500">
                +{trend.sources.length - 3} more sources
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
        <Link
          href={`/trends/${trend.id}`}
          className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
        >
          Read More →
        </Link>
        <div className="flex gap-2">
          <button
            onClick={() => shareOnTwitter(trend)}
            className="text-gray-500 hover:text-blue-500 transition-colors"
            aria-label="Share on Twitter"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
}

function getTimeSince(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function shareOnTwitter(trend: Trend) {
  const text = `${trend.title}\n\n${trend.summary}\n\nvia @BlazeSportsIntel`;
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'width=550,height=420');
}
