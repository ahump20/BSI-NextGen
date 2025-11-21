/**
 * Championship Dashboard Component
 *
 * Displays Cardinals championship probabilities using Monte Carlo simulations
 * Integrates with Cardinals API and Monte Carlo simulation endpoint
 *
 * Features:
 * - Real-time Cardinals standings
 * - Monte Carlo win projections
 * - Playoff/Division/Championship probabilities
 * - Confidence intervals
 * - Recent form analysis
 *
 * @author Austin Humphrey - Blaze Intelligence
 */

import type { TeamInfo, StandingsRecord } from '../../lib/api/mlb-stats-adapter';
import type { SimulationResult, TeamStats, Schedule } from '../../lib/monte-carlo/simulation-engine';

interface ChampionshipDashboardConfig {
  container: HTMLElement;
  apiBaseUrl?: string;
  onError?: (error: Error) => void;
}

interface CardinalsData {
  team: TeamInfo;
  standings: StandingsRecord;
  season: number;
}

export class ChampionshipDashboard {
  private container: HTMLElement;
  private apiBaseUrl: string;
  private onError: (error: Error) => void;
  private cardinalsData: CardinalsData | null = null;
  private simulationResult: SimulationResult | null = null;

  constructor(config: ChampionshipDashboardConfig) {
    this.container = config.container;
    this.apiBaseUrl = config.apiBaseUrl || 'https://d6cc014d.sandlot-sluggers.pages.dev/api';
    this.onError = config.onError || ((error) => console.error('Championship Dashboard Error:', error));
  }

  /**
   * Initialize and render the dashboard
   */
  async show(): Promise<void> {
    try {
      // Fetch Cardinals data
      await this.fetchCardinalsData();

      // Run Monte Carlo simulation
      await this.runSimulation();

      // Render the dashboard
      this.render();
    } catch (error) {
      this.onError(error instanceof Error ? error : new Error('Failed to load dashboard'));
      this.renderError(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Fetch Cardinals standings and team data
   */
  private async fetchCardinalsData(): Promise<void> {
    const response = await fetch(`${this.apiBaseUrl}/mlb/cardinals`);

    if (!response.ok) {
      throw new Error(`Failed to fetch Cardinals data: ${response.statusText}`);
    }

    this.cardinalsData = await response.json();
  }

  /**
   * Run Monte Carlo simulation for Cardinals
   */
  private async runSimulation(): Promise<void> {
    if (!this.cardinalsData) {
      throw new Error('Cardinals data not loaded');
    }

    const standings = this.cardinalsData.standings;

    // Build team stats from standings
    const teamStats: TeamStats = {
      teamId: '138',
      teamName: 'St. Louis Cardinals',
      sport: 'MLB',
      wins: standings.wins,
      losses: standings.losses,
      pointsFor: standings.runsScored,
      pointsAgainst: standings.runsAllowed,
      recentForm: this.parseRecentForm(standings.streak),
      strengthOfSchedule: 0.50, // TODO: Calculate from schedule
      injuryImpact: 1.0 // No injury data available
    };

    // Empty schedule (season completed)
    const schedule: Schedule[] = [];

    // Run simulation
    const response = await fetch(`${this.apiBaseUrl}/simulations/monte-carlo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        teamStats,
        schedule,
        simulations: 10000
      })
    });

    if (!response.ok) {
      throw new Error(`Simulation failed: ${response.statusText}`);
    }

    this.simulationResult = await response.json();
  }

  /**
   * Parse recent form from streak data
   */
  private parseRecentForm(streak: StandingsRecord['streak']): number[] {
    // Convert streak to recent form array
    const isWin = streak.streakType === 'wins' ? 1 : 0;
    const form: number[] = [];

    for (let i = 0; i < Math.min(5, streak.streakNumber); i++) {
      form.push(isWin);
    }

    // Fill remaining with opposite
    while (form.length < 5) {
      form.push(isWin === 1 ? 0 : 1);
    }

    return form.reverse(); // Most recent last
  }

  /**
   * Render the dashboard
   */
  private render(): void {
    if (!this.cardinalsData || !this.simulationResult) {
      return;
    }

    const { standings } = this.cardinalsData;
    const { projectedWins, playoffProbability, divisionWinProbability, championshipProbability, confidenceInterval, metadata } = this.simulationResult;

    this.container.innerHTML = `
      <div class="championship-dashboard" style="
        font-family: 'Inter', system-ui, sans-serif;
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        color: white;
        padding: 2rem;
        border-radius: 1rem;
        max-width: 1200px;
        margin: 0 auto;
      ">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 2rem;">
          <h1 style="
            font-size: 2.5rem;
            font-weight: 800;
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 0.5rem;
          ">
            St. Louis Cardinals
          </h1>
          <p style="
            font-size: 1.25rem;
            color: rgba(255, 255, 255, 0.7);
            margin: 0;
          ">
            Championship Projections
          </p>
        </div>

        <!-- Current Record -->
        <div style="
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.75rem;
          padding: 1.5rem;
          margin-bottom: 2rem;
        ">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
            <div>
              <div style="font-size: 0.875rem; color: rgba(255, 255, 255, 0.6); margin-bottom: 0.5rem;">
                Record
              </div>
              <div style="font-size: 2rem; font-weight: 700;">
                ${standings.wins}-${standings.losses}
              </div>
              <div style="font-size: 0.875rem; color: rgba(255, 255, 255, 0.6);">
                ${standings.winningPercentage} Win %
              </div>
            </div>

            <div>
              <div style="font-size: 0.875rem; color: rgba(255, 255, 255, 0.6); margin-bottom: 0.5rem;">
                Division
              </div>
              <div style="font-size: 2rem; font-weight: 700;">
                ${standings.divisionRank}${this.getOrdinalSuffix(parseInt(standings.divisionRank))}
              </div>
              <div style="font-size: 0.875rem; color: rgba(255, 255, 255, 0.6);">
                ${standings.gamesBack} GB
              </div>
            </div>

            <div>
              <div style="font-size: 0.875rem; color: rgba(255, 255, 255, 0.6); margin-bottom: 0.5rem;">
                Run Differential
              </div>
              <div style="font-size: 2rem; font-weight: 700; color: ${standings.runDifferential >= 0 ? '#10b981' : '#ef4444'}">
                ${standings.runDifferential >= 0 ? '+' : ''}${standings.runDifferential}
              </div>
              <div style="font-size: 0.875rem; color: rgba(255, 255, 255, 0.6);">
                ${standings.runsScored} Scored / ${standings.runsAllowed} Allowed
              </div>
            </div>

            <div>
              <div style="font-size: 0.875rem; color: rgba(255, 255, 255, 0.6); margin-bottom: 0.5rem;">
                Recent Form
              </div>
              <div style="font-size: 2rem; font-weight: 700;">
                ${standings.streak.streakCode}
              </div>
              <div style="font-size: 0.875rem; color: rgba(255, 255, 255, 0.6);">
                ${standings.streak.streakNumber} ${standings.streak.streakType}
              </div>
            </div>
          </div>
        </div>

        <!-- Projections -->
        <div style="
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.75rem;
          padding: 1.5rem;
          margin-bottom: 2rem;
        ">
          <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem;">
            Monte Carlo Projections
            <span style="font-size: 0.875rem; font-weight: 400; color: rgba(255, 255, 255, 0.6);">
              (10,000 simulations)
            </span>
          </h2>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
            <!-- Projected Wins -->
            <div>
              <div style="font-size: 0.875rem; color: rgba(255, 255, 255, 0.6); margin-bottom: 0.5rem;">
                Projected Final Record
              </div>
              <div style="font-size: 2.5rem; font-weight: 700;">
                ${projectedWins.toFixed(1)}-${(162 - projectedWins).toFixed(1)}
              </div>
              <div style="font-size: 0.875rem; color: rgba(255, 255, 255, 0.6);">
                95% CI: ${confidenceInterval.lower}-${confidenceInterval.upper} wins
              </div>
            </div>

            <!-- Pythagorean -->
            <div>
              <div style="font-size: 0.875rem; color: rgba(255, 255, 255, 0.6); margin-bottom: 0.5rem;">
                Pythagorean Win %
              </div>
              <div style="font-size: 2.5rem; font-weight: 700;">
                ${metadata.pythagoreanExpectation.toFixed(1)}%
              </div>
              <div style="font-size: 0.875rem; color: rgba(255, 255, 255, 0.6);">
                Expected: ${((metadata.pythagoreanExpectation / 100) * 162).toFixed(1)} wins
              </div>
            </div>
          </div>
        </div>

        <!-- Probabilities -->
        <div style="
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.75rem;
          padding: 1.5rem;
        ">
          <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem;">
            Championship Probabilities
          </h2>

          <div style="display: grid; gap: 1.5rem;">
            <!-- Playoff Probability -->
            ${this.renderProbabilityBar('Playoff Probability', playoffProbability, '#3b82f6')}

            <!-- Division Win Probability -->
            ${this.renderProbabilityBar('Division Win Probability', divisionWinProbability, '#8b5cf6')}

            <!-- Championship Probability -->
            ${this.renderProbabilityBar('World Series Probability', championshipProbability, '#ef4444')}
          </div>
        </div>

        <!-- Footer -->
        <div style="
          margin-top: 2rem;
          text-align: center;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.5);
        ">
          <p style="margin: 0;">
            Data from MLB Stats API • Simulation powered by Monte Carlo engine
          </p>
          <p style="margin: 0.5rem 0 0 0;">
            Last updated: ${new Date(metadata.timestamp).toLocaleString('en-US', {
              timeZone: 'America/Chicago',
              dateStyle: 'medium',
              timeStyle: 'short'
            })} CST
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Render a probability bar
   */
  private renderProbabilityBar(label: string, probability: number, color: string): string {
    return `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <span style="font-weight: 600;">${label}</span>
          <span style="font-size: 1.5rem; font-weight: 700; color: ${color};">
            ${probability.toFixed(1)}%
          </span>
        </div>
        <div style="
          background: rgba(255, 255, 255, 0.1);
          border-radius: 9999px;
          overflow: hidden;
          height: 1.5rem;
        ">
          <div style="
            background: linear-gradient(90deg, ${color} 0%, ${this.adjustColor(color, -20)} 100%);
            height: 100%;
            width: ${Math.min(100, probability)}%;
            border-radius: 9999px;
            transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 0 20px ${color}80;
          "></div>
        </div>
      </div>
    `;
  }

  /**
   * Get ordinal suffix (1st, 2nd, 3rd, 4th)
   */
  private getOrdinalSuffix(num: number): string {
    const j = num % 10;
    const k = num % 100;

    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  }

  /**
   * Adjust color brightness
   */
  private adjustColor(color: string, amount: number): string {
    // Simple color adjustment (for gradients)
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }

  /**
   * Render error state
   */
  private renderError(message: string): void {
    this.container.innerHTML = `
      <div style="
        font-family: 'Inter', system-ui, sans-serif;
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        color: white;
        padding: 2rem;
        border-radius: 1rem;
        max-width: 1200px;
        margin: 0 auto;
        text-align: center;
      ">
        <div style="
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 0.75rem;
          padding: 2rem;
        ">
          <h2 style="font-size: 1.5rem; font-weight: 700; color: #ef4444; margin-bottom: 1rem;">
            Failed to Load Championship Dashboard
          </h2>
          <p style="color: rgba(255, 255, 255, 0.7); margin: 0;">
            ${message}
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Destroy the dashboard and clean up
   */
  destroy(): void {
    this.container.innerHTML = '';
  }
}
