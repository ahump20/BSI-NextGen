import { z } from 'zod';
import { BaseState } from './mmi';

export const TeamSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  abbreviation: z.string().min(1),
  city: z.string().min(1),
  logo: z.string().url().optional(),
  conference: z.string().optional(),
  division: z.string().optional(),
});

export const DataSourceSchema = z.object({
  provider: z.string(),
  timestamp: z.string(),
  confidence: z.number().min(0).max(1),
});

export const PitcherInfoSchema = z.object({
  name: z.string(),
  throws: z.string().optional(),
  wins: z.number().optional(),
  losses: z.number().optional(),
  era: z.number().optional(),
});

export const LinescoreSummarySchema = z.object({
  currentInning: z.number().optional(),
  inningState: z.string().optional(),
  innings: z
    .array(
      z.object({
        number: z.number(),
        home: z.number().nullable(),
        away: z.number().nullable(),
      })
    )
    .default([]),
  totals: z.object({
    home: z.object({
      runs: z.number(),
      hits: z.number(),
      errors: z.number(),
    }),
    away: z.object({
      runs: z.number(),
      hits: z.number(),
      errors: z.number(),
    }),
  }),
});

export const GameSchema = z.object({
  id: z.string(),
  sport: z.union([
    z.literal('MLB'),
    z.literal('NFL'),
    z.literal('NBA'),
    z.literal('NCAA_FOOTBALL'),
    z.literal('COLLEGE_BASEBALL'),
    z.literal('TRACK_FIELD'),
  ]),
  date: z.string(),
  status: z.enum(['scheduled', 'live', 'final', 'postponed', 'cancelled']),
  homeTeam: TeamSchema,
  awayTeam: TeamSchema,
  homeScore: z.number(),
  awayScore: z.number(),
  period: z.string().optional(),
  venue: z.string().optional(),
  broadcasters: z.array(z.string()).optional(),
  probablePitchers: z
    .object({
      home: PitcherInfoSchema.optional(),
      away: PitcherInfoSchema.optional(),
    })
    .optional(),
  linescore: LinescoreSummarySchema.optional(),
});

export const StandingSchema = z.object({
  team: TeamSchema,
  wins: z.number(),
  losses: z.number(),
  winPercentage: z.number().min(0).max(1),
  gamesBack: z.number().optional(),
  streak: z.string().optional(),
  lastTen: z.string().optional(),
});

export const ApiResponseSchema = z.object({
  source: DataSourceSchema,
  error: z.string().optional(),
});

export function createApiResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return ApiResponseSchema.extend({
    data: dataSchema,
  });
}

export const ProviderHealthSchema = z.object({
  provider: z.string(),
  status: z.enum(['healthy', 'degraded', 'circuit_open']),
  lastFailure: z.string().optional(),
  cooldownExpiresAt: z.string().optional(),
  consecutiveFailures: z.number().int().nonnegative(),
});

export const BaseStateSchema = z.nativeEnum(BaseState);
