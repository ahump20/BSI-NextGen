import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import BoxScore from '../../src/components/sports/BoxScore';
import type { TeamBoxScore, PlayerBattingStats } from '../../src/components/sports/BoxScore';

const mockHomeTeam: TeamBoxScore = {
  teamName: 'Cardinals',
  innings: [
    { inning: 1, runs: 0 },
    { inning: 2, runs: 2 },
    { inning: 3, runs: 0 },
    { inning: 4, runs: 1 },
    { inning: 5, runs: 0 },
    { inning: 6, runs: 0 },
    { inning: 7, runs: 3 },
    { inning: 8, runs: 0 },
    { inning: 9, runs: 1 },
  ],
  runs: 7,
  hits: 12,
  errors: 1,
};

const mockAwayTeam: TeamBoxScore = {
  teamName: 'Cubs',
  innings: [
    { inning: 1, runs: 1 },
    { inning: 2, runs: 0 },
    { inning: 3, runs: 0 },
    { inning: 4, runs: 0 },
    { inning: 5, runs: 2 },
    { inning: 6, runs: 0 },
    { inning: 7, runs: 0 },
    { inning: 8, runs: 1 },
    { inning: 9, runs: 0 },
  ],
  runs: 4,
  hits: 8,
  errors: 2,
};

const mockBatting: PlayerBattingStats[] = [
  {
    name: 'Paul Goldschmidt',
    position: '1B',
    atBats: 4,
    runs: 2,
    hits: 3,
    rbi: 2,
    walks: 1,
    strikeouts: 0,
    average: '.315',
  },
  {
    name: 'Nolan Arenado',
    position: '3B',
    atBats: 5,
    runs: 1,
    hits: 2,
    rbi: 3,
    walks: 0,
    strikeouts: 1,
    average: '.298',
  },
];

describe('BoxScore Component', () => {
  it('renders team names', () => {
    render(<BoxScore homeTeam={mockHomeTeam} awayTeam={mockAwayTeam} />);

    expect(screen.getByText('Cardinals')).toBeInTheDocument();
    expect(screen.getByText('Cubs')).toBeInTheDocument();
  });

  it('renders line score with inning-by-inning runs', () => {
    render(<BoxScore homeTeam={mockHomeTeam} awayTeam={mockAwayTeam} />);

    // Check first inning scores
    const table = screen.getByRole('table');
    expect(table).toHaveTextContent('0'); // Cardinals 1st inning
    expect(table).toHaveTextContent('1'); // Cubs 1st inning
  });

  it('displays total runs, hits, and errors', () => {
    render(<BoxScore homeTeam={mockHomeTeam} awayTeam={mockAwayTeam} />);

    // Cardinals totals
    expect(screen.getByText('7')).toBeInTheDocument(); // Runs
    expect(screen.getByText('12')).toBeInTheDocument(); // Hits
    expect(screen.getByText('1')).toBeInTheDocument(); // Errors

    // Cubs totals
    expect(screen.getByText('4')).toBeInTheDocument(); // Runs
    expect(screen.getByText('8')).toBeInTheDocument(); // Hits
    expect(screen.getByText('2')).toBeInTheDocument(); // Errors
  });

  it('renders batting stats when provided', () => {
    render(
      <BoxScore
        homeTeam={mockHomeTeam}
        awayTeam={mockAwayTeam}
        homeBatting={mockBatting}
      />
    );

    expect(screen.getByText('Paul Goldschmidt')).toBeInTheDocument();
    expect(screen.getByText('Nolan Arenado')).toBeInTheDocument();
    expect(screen.getByText('.315')).toBeInTheDocument();
    expect(screen.getByText('.298')).toBeInTheDocument();
  });

  it('displays game status when provided', () => {
    render(
      <BoxScore
        homeTeam={mockHomeTeam}
        awayTeam={mockAwayTeam}
        gameStatus="Final"
      />
    );

    expect(screen.getByText('Final')).toBeInTheDocument();
  });

  it('displays venue when provided', () => {
    render(
      <BoxScore
        homeTeam={mockHomeTeam}
        awayTeam={mockAwayTeam}
        venue="Busch Stadium"
      />
    );

    expect(screen.getByText('Busch Stadium')).toBeInTheDocument();
  });

  it('displays date when provided', () => {
    render(
      <BoxScore
        homeTeam={mockHomeTeam}
        awayTeam={mockAwayTeam}
        date="November 7, 2025"
      />
    );

    expect(screen.getByText('November 7, 2025')).toBeInTheDocument();
  });

  it('handles missing innings with dash', () => {
    const incompleteTeam: TeamBoxScore = {
      teamName: 'Test Team',
      innings: [
        { inning: 1, runs: 0 },
        { inning: 2, runs: 1 },
        // Missing innings 3-9
      ],
      runs: 1,
      hits: 3,
      errors: 0,
    };

    const { container } = render(
      <BoxScore homeTeam={mockHomeTeam} awayTeam={incompleteTeam} />
    );

    // Should show dashes for missing innings
    expect(container).toHaveTextContent('-');
  });
});
