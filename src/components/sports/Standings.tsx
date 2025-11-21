import React, { useState } from 'react';
import Table, { Column } from '../primitives/Table';
import Card, { CardHeader, CardTitle, CardContent } from '../primitives/Card';

export interface TeamStanding {
  rank: number;
  teamName: string;
  teamLogo?: string;
  wins: number;
  losses: number;
  winPercentage: string;
  gamesBack: string;
  homeRecord: string;
  awayRecord: string;
  lastTen: string;
  streak: string;
  runsScored?: number;
  runsAllowed?: number;
  runDifferential?: number;
}

export interface ConferenceStandings {
  conferenceName: string;
  divisions?: {
    divisionName: string;
    teams: TeamStanding[];
  }[];
  teams?: TeamStanding[];
}

export interface StandingsProps {
  conferences: ConferenceStandings[];
  sport?: 'baseball' | 'football' | 'basketball';
  showRunDifferential?: boolean;
  compactMode?: boolean;
}

const Standings: React.FC<StandingsProps> = ({
  conferences,
  sport = 'baseball',
  showRunDifferential = false,
  compactMode = false,
}) => {
  const [expandedConferences, setExpandedConferences] = useState<Set<string>>(
    new Set(conferences.map((c) => c.conferenceName))
  );

  const toggleConference = (conferenceName: string) => {
    setExpandedConferences((prev) => {
      const next = new Set(prev);
      if (next.has(conferenceName)) {
        next.delete(conferenceName);
      } else {
        next.add(conferenceName);
      }
      return next;
    });
  };

  const baseColumns: Column<TeamStanding>[] = [
    {
      key: 'rank',
      header: '#',
      align: 'center',
      className: 'w-12',
    },
    {
      key: 'teamName',
      header: 'Team',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2 font-medium">
          {row.teamLogo && (
            <img src={row.teamLogo} alt={value} className="w-6 h-6 object-contain" />
          )}
          <span className="truncate">{value}</span>
        </div>
      ),
    },
    {
      key: 'wins',
      header: 'W',
      align: 'center',
      sortable: true,
    },
    {
      key: 'losses',
      header: 'L',
      align: 'center',
      sortable: true,
    },
    {
      key: 'winPercentage',
      header: 'PCT',
      align: 'center',
      sortable: true,
      className: 'font-semibold',
    },
    {
      key: 'gamesBack',
      header: 'GB',
      align: 'center',
      sortable: true,
    },
  ];

  const detailedColumns: Column<TeamStanding>[] = [
    ...baseColumns,
    {
      key: 'homeRecord',
      header: 'Home',
      align: 'center',
      className: compactMode ? 'hidden md:table-cell' : '',
    },
    {
      key: 'awayRecord',
      header: 'Away',
      align: 'center',
      className: compactMode ? 'hidden md:table-cell' : '',
    },
    {
      key: 'lastTen',
      header: 'L10',
      align: 'center',
      className: compactMode ? 'hidden lg:table-cell' : '',
    },
    {
      key: 'streak',
      header: 'Streak',
      align: 'center',
      render: (value) => {
        const isWinning = value.startsWith('W');
        return (
          <span
            className={`font-medium ${
              isWinning ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {value}
          </span>
        );
      },
      className: compactMode ? 'hidden lg:table-cell' : '',
    },
  ];

  const columnsWithDiff: Column<TeamStanding>[] = showRunDifferential
    ? [
        ...detailedColumns,
        {
          key: 'runDifferential',
          header: 'Diff',
          align: 'center',
          sortable: true,
          render: (value) => {
            if (!value) return '-';
            const formatted = value > 0 ? `+${value}` : String(value);
            return (
              <span
                className={`font-semibold ${
                  value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : ''
                }`}
              >
                {formatted}
              </span>
            );
          },
          className: compactMode ? 'hidden xl:table-cell' : '',
        },
      ]
    : detailedColumns;

  return (
    <div className="space-y-6">
      {conferences.map((conference) => {
        const isExpanded = expandedConferences.has(conference.conferenceName);

        return (
          <Card key={conference.conferenceName} className="overflow-hidden">
            <CardHeader
              className="cursor-pointer select-none hover:bg-gray-50 transition-colors"
              onClick={() => toggleConference(conference.conferenceName)}
            >
              <div className="flex items-center justify-between">
                <CardTitle>{conference.conferenceName}</CardTitle>
                <svg
                  className={`w-5 h-5 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="p-0">
                {conference.divisions ? (
                  conference.divisions.map((division) => (
                    <div key={division.divisionName} className="border-b last:border-b-0">
                      <div className="px-4 py-2 bg-gray-50 font-semibold text-sm text-gray-700">
                        {division.divisionName}
                      </div>
                      <Table
                        data={division.teams}
                        columns={columnsWithDiff}
                        compact={compactMode}
                        striped
                        hoverable
                      />
                    </div>
                  ))
                ) : conference.teams ? (
                  <Table
                    data={conference.teams}
                    columns={columnsWithDiff}
                    compact={compactMode}
                    striped
                    hoverable
                  />
                ) : null}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default Standings;
