import type { Standing } from '@bsi/shared';

interface StandingsTableProps {
  standings: Standing[];
  sport: string;
}

export function StandingsTable({ standings, sport }: StandingsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-700">
          <tr className="text-left text-gray-400">
            <th className="pb-2">Team</th>
            <th className="pb-2 text-center">W</th>
            <th className="pb-2 text-center">L</th>
            <th className="pb-2 text-center">PCT</th>
            {sport === 'MLB' && <th className="pb-2 text-center">GB</th>}
            <th className="pb-2 text-center">STRK</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((standing, idx) => (
            <tr key={standing.team.id} className="border-b border-gray-800/50">
              <td className="py-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-6">{idx + 1}</span>
                  <span className="font-medium">{standing.team.abbreviation || standing.team.name}</span>
                </div>
              </td>
              <td className="text-center">{standing.wins}</td>
              <td className="text-center">{standing.losses}</td>
              <td className="text-center">{standing.winPercentage.toFixed(3)}</td>
              {sport === 'MLB' && (
                <td className="text-center text-gray-400">
                  {standing.gamesBack === 0 ? '-' : standing.gamesBack}
                </td>
              )}
              <td className="text-center">
                <span className={`text-xs ${standing.streak?.startsWith('W') ? 'text-green-400' : standing.streak?.startsWith('L') ? 'text-red-400' : 'text-gray-400'}`}>
                  {standing.streak || '-'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
