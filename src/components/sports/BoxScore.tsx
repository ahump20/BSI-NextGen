import React from 'react';
import Table, { Column } from '../primitives/Table';
import Card, { CardHeader, CardTitle, CardContent } from '../primitives/Card';

export interface InningScore {
  inning: number;
  runs: number;
}

export interface TeamBoxScore {
  teamName: string;
  teamLogo?: string;
  innings: InningScore[];
  runs: number;
  hits: number;
  errors: number;
}

export interface PlayerBattingStats {
  name: string;
  position: string;
  atBats: number;
  runs: number;
  hits: number;
  rbi: number;
  walks: number;
  strikeouts: number;
  average: string;
}

export interface PlayerPitchingStats {
  name: string;
  inningsPitched: string;
  hits: number;
  runs: number;
  earnedRuns: number;
  walks: number;
  strikeouts: number;
  era: string;
}

export interface BoxScoreProps {
  homeTeam: TeamBoxScore;
  awayTeam: TeamBoxScore;
  homeBatting?: PlayerBattingStats[];
  awayBatting?: PlayerBattingStats[];
  homePitching?: PlayerPitchingStats[];
  awayPitching?: PlayerPitchingStats[];
  gameStatus?: string;
  venue?: string;
  date?: string;
}

const BoxScore: React.FC<BoxScoreProps> = ({
  homeTeam,
  awayTeam,
  homeBatting,
  awayBatting,
  homePitching,
  awayPitching,
  gameStatus,
  venue,
  date,
}) => {
  const maxInnings = Math.max(
    homeTeam.innings.length,
    awayTeam.innings.length
  );

  const lineScoreColumns: Column<TeamBoxScore>[] = [
    {
      key: 'teamName',
      header: 'Team',
      render: (value, row) => (
        <div className="flex items-center gap-2 font-semibold">
          {row.teamLogo && (
            <img src={row.teamLogo} alt={value} className="w-6 h-6 object-contain" />
          )}
          <span>{value}</span>
        </div>
      ),
    },
    ...Array.from({ length: maxInnings }, (_, i) => ({
      key: `inning-${i + 1}`,
      header: String(i + 1),
      align: 'center' as const,
      render: (_: any, row: TeamBoxScore) => {
        const inning = row.innings.find((inn) => inn.inning === i + 1);
        return inning ? inning.runs : '-';
      },
      className: 'w-8',
    })),
    {
      key: 'runs',
      header: 'R',
      align: 'center' as const,
      className: 'font-bold bg-gray-100',
    },
    {
      key: 'hits',
      header: 'H',
      align: 'center' as const,
      className: 'bg-gray-50',
    },
    {
      key: 'errors',
      header: 'E',
      align: 'center' as const,
      className: 'bg-gray-50',
    },
  ];

  const battingColumns: Column<PlayerBattingStats>[] = [
    { key: 'name', header: 'Batter', sortable: true },
    { key: 'position', header: 'Pos', align: 'center' },
    { key: 'atBats', header: 'AB', align: 'center', sortable: true },
    { key: 'runs', header: 'R', align: 'center', sortable: true },
    { key: 'hits', header: 'H', align: 'center', sortable: true },
    { key: 'rbi', header: 'RBI', align: 'center', sortable: true },
    { key: 'walks', header: 'BB', align: 'center', sortable: true },
    { key: 'strikeouts', header: 'K', align: 'center', sortable: true },
    { key: 'average', header: 'AVG', align: 'center', sortable: true },
  ];

  const pitchingColumns: Column<PlayerPitchingStats>[] = [
    { key: 'name', header: 'Pitcher', sortable: true },
    { key: 'inningsPitched', header: 'IP', align: 'center', sortable: true },
    { key: 'hits', header: 'H', align: 'center', sortable: true },
    { key: 'runs', header: 'R', align: 'center', sortable: true },
    { key: 'earnedRuns', header: 'ER', align: 'center', sortable: true },
    { key: 'walks', header: 'BB', align: 'center', sortable: true },
    { key: 'strikeouts', header: 'K', align: 'center', sortable: true },
    { key: 'era', header: 'ERA', align: 'center', sortable: true },
  ];

  return (
    <div className="space-y-6">
      {/* Game Info */}
      {(gameStatus || venue || date) && (
        <div className="text-center text-sm text-gray-600 space-y-1">
          {gameStatus && <div className="font-semibold">{gameStatus}</div>}
          {venue && <div>{venue}</div>}
          {date && <div>{date}</div>}
        </div>
      )}

      {/* Line Score */}
      <Card>
        <CardHeader>
          <CardTitle>Line Score</CardTitle>
        </CardHeader>
        <CardContent>
          <Table
            data={[awayTeam, homeTeam]}
            columns={lineScoreColumns}
            compact
            className="text-sm"
          />
        </CardContent>
      </Card>

      {/* Batting Stats */}
      {(awayBatting || homeBatting) && (
        <div className="grid md:grid-cols-2 gap-6">
          {awayBatting && (
            <Card>
              <CardHeader>
                <CardTitle>{awayTeam.teamName} Batting</CardTitle>
              </CardHeader>
              <CardContent>
                <Table
                  data={awayBatting}
                  columns={battingColumns}
                  compact
                  striped
                  mobileResponsive
                />
              </CardContent>
            </Card>
          )}
          {homeBatting && (
            <Card>
              <CardHeader>
                <CardTitle>{homeTeam.teamName} Batting</CardTitle>
              </CardHeader>
              <CardContent>
                <Table
                  data={homeBatting}
                  columns={battingColumns}
                  compact
                  striped
                  mobileResponsive
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Pitching Stats */}
      {(awayPitching || homePitching) && (
        <div className="grid md:grid-cols-2 gap-6">
          {awayPitching && (
            <Card>
              <CardHeader>
                <CardTitle>{awayTeam.teamName} Pitching</CardTitle>
              </CardHeader>
              <CardContent>
                <Table
                  data={awayPitching}
                  columns={pitchingColumns}
                  compact
                  striped
                  mobileResponsive
                />
              </CardContent>
            </Card>
          )}
          {homePitching && (
            <Card>
              <CardHeader>
                <CardTitle>{homeTeam.teamName} Pitching</CardTitle>
              </CardHeader>
              <CardContent>
                <Table
                  data={homePitching}
                  columns={pitchingColumns}
                  compact
                  striped
                  mobileResponsive
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default BoxScore;
