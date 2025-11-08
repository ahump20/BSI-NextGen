'use client';

import type { CollegeBaseballGame } from '@bsi/shared';
import { useState } from 'react';

interface BaseballBoxScoreProps {
  game: CollegeBaseballGame;
}

export function BaseballBoxScore({ game }: BaseballBoxScoreProps) {
  const [activeTab, setActiveTab] = useState<'box' | 'plays'>('box');

  if (!game.boxScore) {
    return null;
  }

  return (
    <div className="mt-4 bg-gray-900 rounded-lg p-4">
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-4 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('box')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'box'
              ? 'text-blaze-orange border-b-2 border-blaze-orange'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Box Score
        </button>
        {game.boxScore.playByPlay && (
          <button
            onClick={() => setActiveTab('plays')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'plays'
                ? 'text-blaze-orange border-b-2 border-blaze-orange'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Play-by-Play
          </button>
        )}
      </div>

      {/* Content */}
      {activeTab === 'box' ? (
        <div className="space-y-6">
          {/* Inning Scores */}
          {game.boxScore.inningScores && (
            <InningScoreTable
              inningScores={game.boxScore.inningScores}
              homeTeam={game.homeTeam.abbreviation}
              awayTeam={game.awayTeam.abbreviation}
            />
          )}

          {/* Batting Stats */}
          <div>
            <h3 className="text-lg font-bold mb-3 text-blaze-orange">Batting</h3>
            <BattingTable battingLines={game.boxScore.battingLines} />
          </div>

          {/* Pitching Stats */}
          <div>
            <h3 className="text-lg font-bold mb-3 text-blaze-orange">Pitching</h3>
            <PitchingTable pitchingLines={game.boxScore.pitchingLines} />
          </div>

          {/* Recap */}
          {game.recap && (
            <div className="mt-4 p-4 bg-gray-800 rounded-lg">
              <h3 className="text-lg font-bold mb-2 text-blaze-orange">Game Recap</h3>
              <p className="text-sm text-gray-300 leading-relaxed">{game.recap}</p>
            </div>
          )}
        </div>
      ) : (
        <PlayByPlayView playByPlay={game.boxScore.playByPlay || []} />
      )}

      {/* Preview for scheduled games */}
      {game.preview && game.status === 'scheduled' && (
        <div className="mt-4 p-4 bg-gray-800 rounded-lg">
          <h3 className="text-lg font-bold mb-2 text-blaze-orange">Game Preview</h3>
          <p className="text-sm text-gray-300 leading-relaxed">{game.preview}</p>
        </div>
      )}
    </div>
  );
}

interface InningScoreTableProps {
  inningScores: Array<{ inning: number; homeScore: number; awayScore: number }>;
  homeTeam: string;
  awayTeam: string;
}

function InningScoreTable({ inningScores, homeTeam, awayTeam }: InningScoreTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border border-gray-700">
        <thead>
          <tr className="bg-gray-800">
            <th className="px-2 py-1 text-left border-r border-gray-700">Team</th>
            {inningScores.map((score) => (
              <th key={score.inning} className="px-2 py-1 text-center border-r border-gray-700">
                {score.inning}
              </th>
            ))}
            <th className="px-2 py-1 text-center font-bold bg-gray-900">R</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-gray-700">
            <td className="px-2 py-1 font-medium border-r border-gray-700">{awayTeam}</td>
            {inningScores.map((score) => (
              <td key={score.inning} className="px-2 py-1 text-center border-r border-gray-700">
                {score.awayScore || '-'}
              </td>
            ))}
            <td className="px-2 py-1 text-center font-bold bg-gray-900">
              {inningScores.reduce((sum, s) => sum + s.awayScore, 0)}
            </td>
          </tr>
          <tr className="border-t border-gray-700">
            <td className="px-2 py-1 font-medium border-r border-gray-700">{homeTeam}</td>
            {inningScores.map((score) => (
              <td key={score.inning} className="px-2 py-1 text-center border-r border-gray-700">
                {score.homeScore || '-'}
              </td>
            ))}
            <td className="px-2 py-1 text-center font-bold bg-gray-900">
              {inningScores.reduce((sum, s) => sum + s.homeScore, 0)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

interface BattingTableProps {
  battingLines: Array<{
    player: string;
    ab: number;
    r: number;
    h: number;
    rbi: number;
    bb: number;
    so: number;
  }>;
}

function BattingTable({ battingLines }: BattingTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="px-2 py-1 text-left">Player</th>
            <th className="px-2 py-1 text-center">AB</th>
            <th className="px-2 py-1 text-center">R</th>
            <th className="px-2 py-1 text-center">H</th>
            <th className="px-2 py-1 text-center">RBI</th>
            <th className="px-2 py-1 text-center">BB</th>
            <th className="px-2 py-1 text-center">SO</th>
            <th className="px-2 py-1 text-center">AVG</th>
          </tr>
        </thead>
        <tbody>
          {battingLines.map((line, idx) => {
            const avg = line.ab > 0 ? (line.h / line.ab).toFixed(3) : '.000';
            return (
              <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800">
                <td className="px-2 py-2 font-medium">{line.player}</td>
                <td className="px-2 py-2 text-center">{line.ab}</td>
                <td className="px-2 py-2 text-center">{line.r}</td>
                <td className="px-2 py-2 text-center">{line.h}</td>
                <td className="px-2 py-2 text-center">{line.rbi}</td>
                <td className="px-2 py-2 text-center">{line.bb}</td>
                <td className="px-2 py-2 text-center">{line.so}</td>
                <td className="px-2 py-2 text-center text-gray-400">{avg}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface PitchingTableProps {
  pitchingLines: Array<{
    player: string;
    ip: number;
    h: number;
    r: number;
    er: number;
    bb: number;
    so: number;
  }>;
}

function PitchingTable({ pitchingLines }: PitchingTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="px-2 py-1 text-left">Player</th>
            <th className="px-2 py-1 text-center">IP</th>
            <th className="px-2 py-1 text-center">H</th>
            <th className="px-2 py-1 text-center">R</th>
            <th className="px-2 py-1 text-center">ER</th>
            <th className="px-2 py-1 text-center">BB</th>
            <th className="px-2 py-1 text-center">SO</th>
            <th className="px-2 py-1 text-center">ERA</th>
          </tr>
        </thead>
        <tbody>
          {pitchingLines.map((line, idx) => {
            const era = line.ip > 0 ? ((line.er * 9) / line.ip).toFixed(2) : '0.00';
            return (
              <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800">
                <td className="px-2 py-2 font-medium">{line.player}</td>
                <td className="px-2 py-2 text-center">{line.ip.toFixed(1)}</td>
                <td className="px-2 py-2 text-center">{line.h}</td>
                <td className="px-2 py-2 text-center">{line.r}</td>
                <td className="px-2 py-2 text-center">{line.er}</td>
                <td className="px-2 py-2 text-center">{line.bb}</td>
                <td className="px-2 py-2 text-center">{line.so}</td>
                <td className="px-2 py-2 text-center text-gray-400">{era}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface PlayByPlayViewProps {
  playByPlay: Array<{
    inning: number;
    halfInning: 'top' | 'bottom';
    outs: number;
    plays: Array<{
      id: string;
      description: string;
      timestamp: string;
      batter: string;
      pitcher: string;
      result: string;
      runsScored: number;
      rbi?: number;
    }>;
  }>;
}

function PlayByPlayView({ playByPlay }: PlayByPlayViewProps) {
  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {playByPlay.map((inning, idx) => (
        <div key={idx} className="bg-gray-800 rounded-lg p-4">
          <h4 className="text-sm font-bold mb-3 text-blaze-orange">
            {inning.halfInning === 'top' ? 'Top' : 'Bottom'} of {inning.inning}{' '}
            {inning.outs > 0 && `(${inning.outs} out${inning.outs > 1 ? 's' : ''})`}
          </h4>
          <div className="space-y-2">
            {inning.plays.map((play) => (
              <div key={play.id} className="text-xs border-l-2 border-gray-700 pl-3 py-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-gray-300 mb-1">{play.description}</p>
                    <div className="flex gap-3 text-gray-500">
                      <span>
                        <span className="font-medium">Batter:</span> {play.batter}
                      </span>
                      <span>
                        <span className="font-medium">Pitcher:</span> {play.pitcher}
                      </span>
                    </div>
                  </div>
                  {play.runsScored > 0 && (
                    <span className="text-green-400 font-bold text-sm">{play.runsScored}R</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
