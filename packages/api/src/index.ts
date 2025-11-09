/**
 * Blaze Sports Intel - API Layer
 * Sports: Baseball → Football → Basketball → Track & Field
 */

// Sport-specific adapters
export * from './adapters/mlb';
export * from './adapters/nfl';
export * from './adapters/nba';
export * from './adapters/ncaaFootball';
export * from './adapters/collegeBaseball';
export * from './adapters/ncaa-adapter';
export * from './adapters/d1baseball-adapter';

// League-wide orchestrator
export * from './orchestrator/league-orchestrator';

// Services
export * from './services/sportsDataService';

// Auth
export * from './auth/jwt';
export * from './auth/auth0';
