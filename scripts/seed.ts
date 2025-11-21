#!/usr/bin/env tsx
/**
 * Database Seeding Script
 * Populates local D1 database with test data for development
 */

import { nanoid } from 'nanoid';

interface D1Database {
  prepare: (query: string) => D1PreparedStatement;
  batch: <T>(statements: D1PreparedStatement[]) => Promise<T[]>;
  exec: (query: string) => Promise<D1ExecResult>;
}

interface D1PreparedStatement {
  bind: (...values: unknown[]) => D1PreparedStatement;
  run: () => Promise<D1Result>;
  all: <T>() => Promise<D1Result<T>>;
}

interface D1Result<T = unknown> {
  success: boolean;
  results?: T[];
  error?: string;
}

interface D1ExecResult {
  count: number;
  duration: number;
}

// Mock D1 for local development
const getDb = async (): Promise<D1Database> => {
  // In production, this would use wrangler's D1 binding
  // For now, we'll use a simple mock
  throw new Error('Use wrangler d1 execute for seeding. This is a template.');
};

const seedUsers = async (db: D1Database) => {
  console.log('Seeding users...');

  const users = [
    {
      id: nanoid(),
      email: 'admin@blazesportsintel.com',
      username: 'admin',
      display_name: 'Admin User',
      auth_provider: 'auth0',
      auth_provider_id: 'auth0|admin',
      role: 'admin',
    },
    {
      id: nanoid(),
      email: 'user@example.com',
      username: 'testuser',
      display_name: 'Test User',
      auth_provider: 'auth0',
      auth_provider_id: 'auth0|testuser',
      role: 'user',
    },
  ];

  for (const user of users) {
    await db
      .prepare(
        `INSERT INTO users (id, email, username, display_name, auth_provider, auth_provider_id, role)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        user.id,
        user.email,
        user.username,
        user.display_name,
        user.auth_provider,
        user.auth_provider_id,
        user.role
      )
      .run();
  }

  console.log(`✓ Seeded ${users.length} users`);
};

const seedTeams = async (db: D1Database) => {
  console.log('Seeding college baseball teams...');

  const teams = [
    {
      id: 'texas',
      name: 'Texas Longhorns',
      school: 'University of Texas',
      conference: 'SEC',
      division: 'D1',
      colors: JSON.stringify(['#BF5700', '#FFFFFF']),
      venue_name: 'UFCU Disch-Falk Field',
      venue_capacity: 7373,
    },
    {
      id: 'lsu',
      name: 'LSU Tigers',
      school: 'Louisiana State University',
      conference: 'SEC',
      division: 'D1',
      colors: JSON.stringify(['#461D7C', '#FDD023']),
      venue_name: 'Alex Box Stadium',
      venue_capacity: 10326,
    },
    {
      id: 'arkansas',
      name: 'Arkansas Razorbacks',
      school: 'University of Arkansas',
      conference: 'SEC',
      division: 'D1',
      colors: JSON.stringify(['#9D2235', '#FFFFFF']),
      venue_name: 'Baum-Walker Stadium',
      venue_capacity: 11084,
    },
  ];

  for (const team of teams) {
    await db
      .prepare(
        `INSERT INTO teams (id, name, school, conference, division, colors, venue_name, venue_capacity)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        team.id,
        team.name,
        team.school,
        team.conference,
        team.division,
        team.colors,
        team.venue_name,
        team.venue_capacity
      )
      .run();
  }

  console.log(`✓ Seeded ${teams.length} teams`);
};

const seedMLBTeams = async (db: D1Database) => {
  console.log('Seeding MLB teams...');

  const mlbTeams = [
    { id: 138, name: 'St. Louis Cardinals', abbreviation: 'STL', league: 'NL', division: 'Central' },
    { id: 117, name: 'Houston Astros', abbreviation: 'HOU', league: 'AL', division: 'West' },
    { id: 119, name: 'Los Angeles Dodgers', abbreviation: 'LAD', league: 'NL', division: 'West' },
    { id: 147, name: 'New York Yankees', abbreviation: 'NYY', league: 'AL', division: 'East' },
  ];

  for (const team of mlbTeams) {
    await db
      .prepare(
        `INSERT INTO mlb_teams (id, name, abbreviation, league, division)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(team.id, team.name, team.abbreviation, team.league, team.division)
      .run();
  }

  console.log(`✓ Seeded ${mlbTeams.length} MLB teams`);
};

const main = async () => {
  console.log('🌱 Starting database seed...\n');

  try {
    const db = await getDb();

    await seedUsers(db);
    await seedTeams(db);
    await seedMLBTeams(db);

    console.log('\n✅ Database seeding complete!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { seedUsers, seedTeams, seedMLBTeams };
