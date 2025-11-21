/**
 * Tests for GameCard Component
 * Core UI component for displaying game information
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { GameCard } from '../GameCard';
import type { Game } from '@bsi/shared';

// Mock base game data
const createMockGame = (overrides?: Partial<Game>): Game => ({
  id: '12345',
  sport: 'MLB',
  date: '2025-01-13T19:00:00Z',
  status: 'scheduled',
  homeTeam: {
    id: '1',
    name: 'Los Angeles Dodgers',
    abbreviation: 'LAD',
    city: 'Los Angeles',
  },
  awayTeam: {
    id: '2',
    name: 'New York Yankees',
    abbreviation: 'NYY',
    city: 'New York',
  },
  homeScore: 0,
  awayScore: 0,
  ...overrides,
});

describe('GameCard', () => {
  describe('Rendering', () => {
    it('should render team abbreviations', () => {
      const game = createMockGame();
      render(<GameCard game={game} />);

      expect(screen.getByText('LAD')).toBeInTheDocument();
      expect(screen.getByText('NYY')).toBeInTheDocument();
    });

    it('should render team names when abbreviations are missing', () => {
      const game = createMockGame({
        homeTeam: {
          id: '1',
          name: 'Los Angeles Dodgers',
          abbreviation: '',
          city: 'Los Angeles',
        },
        awayTeam: {
          id: '2',
          name: 'New York Yankees',
          abbreviation: '',
          city: 'New York',
        },
      });
      render(<GameCard game={game} />);

      expect(screen.getByText('Los Angeles Dodgers')).toBeInTheDocument();
      expect(screen.getByText('New York Yankees')).toBeInTheDocument();
    });

    it('should render scores', () => {
      const game = createMockGame({
        homeScore: 5,
        awayScore: 3,
      });
      render(<GameCard game={game} />);

      const scores = screen.getAllByText(/[0-9]+/);
      expect(scores.some(el => el.textContent === '5')).toBe(true);
      expect(scores.some(el => el.textContent === '3')).toBe(true);
    });

    it('should render venue when provided', () => {
      const game = createMockGame({
        venue: 'Dodger Stadium',
      });
      render(<GameCard game={game} />);

      expect(screen.getByText('Dodger Stadium')).toBeInTheDocument();
    });

    it('should not render venue when not provided', () => {
      const game = createMockGame({
        venue: undefined,
      });
      const { container } = render(<GameCard game={game} />);

      expect(container.textContent).not.toContain('Stadium');
    });

    it('should render game date in Chicago timezone', () => {
      const game = createMockGame({
        date: '2025-01-13T19:00:00Z',
      });
      render(<GameCard game={game} />);

      // Date should be formatted as "Jan 13, 1:00 PM" (or similar based on CST)
      expect(screen.getByText(/Jan 13/)).toBeInTheDocument();
    });
  });

  describe('Game Status - Scheduled', () => {
    it('should display SCHEDULED status', () => {
      const game = createMockGame({
        status: 'scheduled',
      });
      render(<GameCard game={game} />);

      expect(screen.getByText('SCHEDULED')).toBeInTheDocument();
    });

    it('should apply correct styling for scheduled games', () => {
      const game = createMockGame({
        status: 'scheduled',
      });
      const { container } = render(<GameCard game={game} />);

      const statusElement = screen.getByText('SCHEDULED');
      expect(statusElement).toHaveClass('text-blue-400');
    });

    it('should not show live indicator for scheduled games', () => {
      const game = createMockGame({
        status: 'scheduled',
      });
      const { container } = render(<GameCard game={game} />);

      const liveIndicator = container.querySelector('.live-indicator');
      expect(liveIndicator).not.toBeInTheDocument();
    });
  });

  describe('Game Status - Live', () => {
    it('should display LIVE status', () => {
      const game = createMockGame({
        status: 'live',
        homeScore: 3,
        awayScore: 2,
      });
      render(<GameCard game={game} />);

      expect(screen.getByText('LIVE')).toBeInTheDocument();
    });

    it('should show live indicator for live games', () => {
      const game = createMockGame({
        status: 'live',
      });
      const { container } = render(<GameCard game={game} />);

      const liveIndicator = container.querySelector('.live-indicator');
      expect(liveIndicator).toBeInTheDocument();
    });

    it('should apply correct styling for live games', () => {
      const game = createMockGame({
        status: 'live',
      });
      render(<GameCard game={game} />);

      const statusElement = screen.getByText('LIVE');
      expect(statusElement).toHaveClass('text-red-500');
    });

    it('should display game period for live games', () => {
      const game = createMockGame({
        status: 'live',
        period: 'Top 5th',
      });
      render(<GameCard game={game} />);

      expect(screen.getByText('Top 5th')).toBeInTheDocument();
    });

    it('should not highlight scores for live games', () => {
      const game = createMockGame({
        status: 'live',
        homeScore: 5,
        awayScore: 3,
      });
      const { container } = render(<GameCard game={game} />);

      const scores = container.querySelectorAll('.text-xl.font-bold');
      scores.forEach(score => {
        expect(score).not.toHaveClass('text-green-400');
      });
    });
  });

  describe('Game Status - Final', () => {
    it('should display FINAL status', () => {
      const game = createMockGame({
        status: 'final',
        homeScore: 5,
        awayScore: 3,
      });
      render(<GameCard game={game} />);

      expect(screen.getByText('FINAL')).toBeInTheDocument();
    });

    it('should apply correct styling for final games', () => {
      const game = createMockGame({
        status: 'final',
      });
      render(<GameCard game={game} />);

      const statusElement = screen.getByText('FINAL');
      expect(statusElement).toHaveClass('text-gray-400');
    });

    it('should highlight winning score when home team wins', () => {
      const game = createMockGame({
        status: 'final',
        homeScore: 5,
        awayScore: 3,
      });
      const { container } = render(<GameCard game={game} />);

      const scores = Array.from(container.querySelectorAll('.text-xl.font-bold'));
      const homeScoreElement = scores.find(el => el.textContent === '5');

      expect(homeScoreElement).toHaveClass('text-green-400');
    });

    it('should highlight winning score when away team wins', () => {
      const game = createMockGame({
        status: 'final',
        homeScore: 3,
        awayScore: 5,
      });
      const { container } = render(<GameCard game={game} />);

      const scores = Array.from(container.querySelectorAll('.text-xl.font-bold'));
      const awayScoreElement = scores.find(el => el.textContent === '5');

      expect(awayScoreElement).toHaveClass('text-green-400');
    });

    it('should not highlight scores for tie games', () => {
      const game = createMockGame({
        status: 'final',
        homeScore: 3,
        awayScore: 3,
      });
      const { container } = render(<GameCard game={game} />);

      const scores = container.querySelectorAll('.text-green-400');
      expect(scores.length).toBe(0);
    });

    it('should display period for final games if provided', () => {
      const game = createMockGame({
        status: 'final',
        period: 'F/OT',
      });
      render(<GameCard game={game} />);

      expect(screen.getByText('F/OT')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero scores', () => {
      const game = createMockGame({
        homeScore: 0,
        awayScore: 0,
      });
      render(<GameCard game={game} />);

      const scores = screen.getAllByText('0');
      expect(scores.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle high scores', () => {
      const game = createMockGame({
        homeScore: 99,
        awayScore: 100,
        status: 'final',
      });
      render(<GameCard game={game} />);

      expect(screen.getByText('99')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('should handle missing period gracefully', () => {
      const game = createMockGame({
        status: 'live',
        period: undefined,
      });
      const { container } = render(<GameCard game={game} />);

      // Should not crash and should render game without period
      expect(screen.getByText('LIVE')).toBeInTheDocument();
    });

    it('should handle postponed status', () => {
      const game = createMockGame({
        status: 'postponed',
      });
      render(<GameCard game={game} />);

      // Status will be mapped to SCHEDULED in the component logic
      expect(screen.getByText(/SCHEDULED/i)).toBeInTheDocument();
    });

    it('should handle cancelled status', () => {
      const game = createMockGame({
        status: 'cancelled',
      });
      render(<GameCard game={game} />);

      // Status will be mapped to SCHEDULED in the component logic
      expect(screen.getByText(/SCHEDULED/i)).toBeInTheDocument();
    });

    it('should handle long team names gracefully', () => {
      const game = createMockGame({
        homeTeam: {
          id: '1',
          name: 'University of Southern California Trojans',
          abbreviation: '',
          city: 'Los Angeles',
        },
        awayTeam: {
          id: '2',
          name: 'University of California Los Angeles Bruins',
          abbreviation: '',
          city: 'Los Angeles',
        },
      });
      render(<GameCard game={game} />);

      expect(screen.getByText('University of Southern California Trojans')).toBeInTheDocument();
      expect(screen.getByText('University of California Los Angeles Bruins')).toBeInTheDocument();
    });

    it('should handle long venue names', () => {
      const game = createMockGame({
        venue: 'Hubert H. Humphrey Metrodome Stadium Complex',
      });
      render(<GameCard game={game} />);

      expect(screen.getByText('Hubert H. Humphrey Metrodome Stadium Complex')).toBeInTheDocument();
    });
  });

  describe('Different Sports', () => {
    it('should render NBA game', () => {
      const game = createMockGame({
        sport: 'NBA',
        period: 'Q3',
        status: 'live',
      });
      render(<GameCard game={game} />);

      expect(screen.getByText('Q3')).toBeInTheDocument();
      expect(screen.getByText('LIVE')).toBeInTheDocument();
    });

    it('should render NFL game', () => {
      const game = createMockGame({
        sport: 'NFL',
        period: '4th Quarter',
        status: 'live',
      });
      render(<GameCard game={game} />);

      expect(screen.getByText('4th Quarter')).toBeInTheDocument();
    });

    it('should render College Baseball game', () => {
      const game = createMockGame({
        sport: 'COLLEGE_BASEBALL',
        period: 'Inning 7',
        status: 'live',
      });
      render(<GameCard game={game} />);

      expect(screen.getByText('Inning 7')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      const game = createMockGame();
      const { container } = render(<GameCard game={game} />);

      expect(container.querySelector('.game-card')).toBeInTheDocument();
    });

    it('should render all text content as readable', () => {
      const game = createMockGame({
        status: 'live',
        homeScore: 5,
        awayScore: 3,
        period: 'Q3',
        venue: 'Test Arena',
      });
      const { container } = render(<GameCard game={game} />);

      // All text should be in the document
      expect(container.textContent).toContain('LIVE');
      expect(container.textContent).toContain('Q3');
      expect(container.textContent).toContain('LAD');
      expect(container.textContent).toContain('NYY');
      expect(container.textContent).toContain('5');
      expect(container.textContent).toContain('3');
      expect(container.textContent).toContain('Test Arena');
    });
  });

  describe('CSS Classes', () => {
    it('should apply base game-card class', () => {
      const game = createMockGame();
      const { container } = render(<GameCard game={game} />);

      expect(container.querySelector('.game-card')).toBeInTheDocument();
    });

    it('should apply responsive layout classes', () => {
      const game = createMockGame();
      const { container } = render(<GameCard game={game} />);

      expect(container.querySelector('.flex')).toBeInTheDocument();
      expect(container.querySelector('.space-y-2')).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('should format date in America/Chicago timezone', () => {
      const game = createMockGame({
        date: '2025-06-15T20:00:00Z',
      });
      render(<GameCard game={game} />);

      // Should show June date
      expect(screen.getByText(/Jun 15/)).toBeInTheDocument();
    });

    it('should include time in formatted date', () => {
      const game = createMockGame({
        date: '2025-06-15T20:00:00Z',
      });
      const { container } = render(<GameCard game={game} />);

      // Should include hour and minute
      expect(container.textContent).toMatch(/\d{1,2}:\d{2}/);
    });
  });
});
