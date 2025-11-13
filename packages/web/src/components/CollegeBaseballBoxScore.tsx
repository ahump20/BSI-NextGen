import type { CollegeBaseballGame, BattingLine, PitchingLine, LinescoreFrame, ScoringPlay } from '@bsi/shared';

interface CollegeBaseballBoxScoreProps {
  game: CollegeBaseballGame;
}

export function CollegeBaseballBoxScore({ game }: CollegeBaseballBoxScoreProps) {
  if (!game.boxScore) {
    return (
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-orange-500">College Baseball Box Score</h3>
        <p className="text-sm text-gray-400">
          Full box score data will appear once the game starts or finishes. Check back soon for batting lines,
          pitching lines, and a play-by-play scoring timeline.
        </p>
      </div>
    );
  }

  const { batting, pitching, scoringPlays, lastUpdated } = game.boxScore;

  const renderBattingTable = (team: 'home' | 'away', lines: BattingLine[]) => (
    <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-4">
      <h4 className="font-semibold text-sm mb-3 text-gray-200">
        {team === 'home' ? game.homeTeam.name : game.awayTeam.name} Batting
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead className="text-gray-400 border-b border-gray-700">
            <tr className="text-left">
              <th className="py-2">Player</th>
              <th className="py-2 text-center">AB</th>
              <th className="py-2 text-center">R</th>
              <th className="py-2 text-center">H</th>
              <th className="py-2 text-center">RBI</th>
              <th className="py-2 text-center">BB</th>
              <th className="py-2 text-center">SO</th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-3 text-center text-gray-500">
                  Batting data not available yet.
                </td>
              </tr>
            ) : (
              lines.map((line, idx) => (
                <tr key={`${team}-batting-${idx}`} className="border-b border-gray-800/60">
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {line.position || '—'}
                      </span>
                      <span className="font-medium text-gray-100">{line.player}</span>
                    </div>
                  </td>
                  <td className="py-2 text-center">{line.ab}</td>
                  <td className="py-2 text-center">{line.r}</td>
                  <td className="py-2 text-center">{line.h}</td>
                  <td className="py-2 text-center">{line.rbi}</td>
                  <td className="py-2 text-center">{line.bb}</td>
                  <td className="py-2 text-center">{line.so}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPitchingTable = (team: 'home' | 'away', lines: PitchingLine[]) => (
    <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-4">
      <h4 className="font-semibold text-sm mb-3 text-gray-200">
        {team === 'home' ? game.homeTeam.name : game.awayTeam.name} Pitching
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead className="text-gray-400 border-b border-gray-700">
            <tr className="text-left">
              <th className="py-2">Pitcher</th>
              <th className="py-2 text-center">IP</th>
              <th className="py-2 text-center">H</th>
              <th className="py-2 text-center">R</th>
              <th className="py-2 text-center">ER</th>
              <th className="py-2 text-center">BB</th>
              <th className="py-2 text-center">SO</th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-3 text-center text-gray-500">
                  Pitching data not available yet.
                </td>
              </tr>
            ) : (
              lines.map((line, idx) => (
                <tr key={`${team}-pitching-${idx}`} className="border-b border-gray-800/60">
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      {line.decision && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide bg-gray-700 text-gray-300">
                          {line.decision}
                        </span>
                      )}
                      <span className="font-medium text-gray-100">{line.player}</span>
                    </div>
                  </td>
                  <td className="py-2 text-center">{line.ip.toFixed(1)}</td>
                  <td className="py-2 text-center">{line.h}</td>
                  <td className="py-2 text-center">{line.r}</td>
                  <td className="py-2 text-center">{line.er}</td>
                  <td className="py-2 text-center">{line.bb}</td>
                  <td className="py-2 text-center">{line.so}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderLinescore = (frames: LinescoreFrame[] | undefined) => {
    if (!frames || frames.length === 0) {
      return null;
    }

    return (
      <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-4">
        <h4 className="font-semibold text-sm mb-3 text-gray-200">Linescore</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead className="text-gray-400 border-b border-gray-700">
              <tr>
                <th className="py-2 text-left">Team</th>
                {frames.map((frame, idx) => (
                  <th key={`inning-${idx}`} className="py-2 text-center">
                    {frame.inning}
                  </th>
                ))}
                <th className="py-2 text-center">R</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-800/60">
                <td className="py-2 font-medium text-gray-100">{game.awayTeam.abbreviation || game.awayTeam.name}</td>
                {frames.map((frame, idx) => (
                  <td key={`away-inning-${idx}`} className="py-2 text-center">
                    {frame.away}
                  </td>
                ))}
                <td className="py-2 text-center font-semibold text-gray-100">{game.awayScore}</td>
              </tr>
              <tr>
                <td className="py-2 font-medium text-gray-100">{game.homeTeam.abbreviation || game.homeTeam.name}</td>
                {frames.map((frame, idx) => (
                  <td key={`home-inning-${idx}`} className="py-2 text-center">
                    {frame.home}
                  </td>
                ))}
                <td className="py-2 text-center font-semibold text-gray-100">{game.homeScore}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderScoringPlays = (plays: ScoringPlay[]) => (
    <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-4">
      <h4 className="font-semibold text-sm mb-3 text-gray-200">Scoring Timeline</h4>
      {plays.length === 0 ? (
        <p className="text-sm text-gray-500">No scoring plays recorded yet.</p>
      ) : (
        <ul className="space-y-3">
          {plays.map((play, idx) => (
            <li key={`play-${idx}`} className="border border-gray-700 rounded-md p-3 bg-gray-900/60">
              <div className="flex flex-wrap items-center justify-between text-xs text-gray-400 mb-1">
                <span>
                  {formatHalfInning(play.halfInning)} {formatInning(play.inning)}
                </span>
                <span>
                  {game.awayTeam.abbreviation || game.awayTeam.name} {play.awayScore} —{' '}
                  {game.homeTeam.abbreviation || game.homeTeam.name} {play.homeScore}
                </span>
              </div>
              <p className="text-sm text-gray-200 leading-snug">{play.description}</p>
              {typeof play.outs === 'number' && (
                <p className="text-[11px] text-gray-500 mt-2">Outs: {play.outs}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h3 className="text-xl font-bold text-orange-500">College Baseball Box Score</h3>
        <p className="text-sm text-gray-400">
          {game.awayTeam.name} at {game.homeTeam.name} • {game.period || 'Scheduled'} • Updated {lastUpdated}
        </p>
      </header>

      {renderLinescore(game.linescore)}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {renderBattingTable('away', batting.away)}
        {renderBattingTable('home', batting.home)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {renderPitchingTable('away', pitching.away)}
        {renderPitchingTable('home', pitching.home)}
      </div>

      {renderScoringPlays(scoringPlays)}
    </div>
  );
}

function formatInning(inning: number): string {
  if (!inning) return '';
  if (inning === 1) return '1st';
  if (inning === 2) return '2nd';
  if (inning === 3) return '3rd';
  return `${inning}th`;
}

