import type { Sport } from '@bsi/shared';
import { SportsDataService } from '@bsi/api';

const SPORT_PARAM_MAP: Record<string, Sport> = {
  mlb: 'MLB',
  nfl: 'NFL',
  nba: 'NBA',
  ncaa_football: 'NCAA_FOOTBALL',
  college_baseball: 'COLLEGE_BASEBALL',
};

let service: SportsDataService | null = null;

export function resolveSport(param: string): Sport | null {
  const normalized = param.toLowerCase();
  return SPORT_PARAM_MAP[normalized] ?? null;
}

export function getSportsDataService(): SportsDataService {
  if (!service) {
    service = new SportsDataService();
  }
  return service;
}
