import type { Sport } from '@bsi/shared';

export type SportSlug = 'mlb' | 'nfl' | 'nba' | 'ncaa-football' | 'college-baseball';

export interface SportConfig {
  slug: SportSlug;
  code: Sport;
  name: string;
  tagline: string;
  gradient: string;
  accent: string;
  background: string;
  text: string;
  pill: string;
}

export const sportConfigs: Record<SportSlug, SportConfig> = {
  mlb: {
    slug: 'mlb',
    code: 'MLB',
    name: 'Major League Baseball',
    tagline: 'Live lines, bullpen readiness, and division race clarity.',
    gradient: 'from-data-blue to-data-purple',
    accent: 'bg-data-blue/15 border border-data-blue/50 text-data-primary',
    background: 'bg-surface-strong',
    text: 'text-data-primary',
    pill: 'bg-data-blue/10 text-data-blue',
  },
  nfl: {
    slug: 'nfl',
    code: 'NFL',
    name: 'National Football League',
    tagline: 'Drive-by-drive momentum with live red zone context.',
    gradient: 'from-data-amber to-data-orange',
    accent: 'bg-data-orange/15 border border-data-orange/50 text-data-primary',
    background: 'bg-surface-strong',
    text: 'text-data-primary',
    pill: 'bg-data-amber/10 text-data-amber',
  },
  nba: {
    slug: 'nba',
    code: 'NBA',
    name: 'National Basketball Association',
    tagline: 'Possession tempo, shot quality, and late-game closers.',
    gradient: 'from-data-pink to-data-purple',
    accent: 'bg-data-pink/15 border border-data-pink/50 text-data-primary',
    background: 'bg-surface-strong',
    text: 'text-data-primary',
    pill: 'bg-data-pink/10 text-data-pink',
  },
  'ncaa-football': {
    slug: 'ncaa-football',
    code: 'NCAA_FOOTBALL',
    name: 'NCAA Football',
    tagline: 'Conference heat maps with playoff-impact narratives.',
    gradient: 'from-data-green to-data-emerald',
    accent: 'bg-data-green/15 border border-data-green/50 text-data-primary',
    background: 'bg-surface-strong',
    text: 'text-data-primary',
    pill: 'bg-data-green/10 text-data-green',
  },
  'college-baseball': {
    slug: 'college-baseball',
    code: 'COLLEGE_BASEBALL',
    name: 'College Baseball',
    tagline: 'Box scores that ESPN misses, paced for Omaha runs.',
    gradient: 'from-data-cyan to-data-blue',
    accent: 'bg-data-cyan/15 border border-data-cyan/50 text-data-primary',
    background: 'bg-surface-strong',
    text: 'text-data-primary',
    pill: 'bg-data-cyan/10 text-data-cyan',
  },
};

export function resolveSportConfig(slug: string): SportConfig | null {
  if ((sportConfigs as Record<string, SportConfig>)[slug]) {
    return (sportConfigs as Record<string, SportConfig>)[slug];
  }

  return null;
}
