import { execSync } from 'node:child_process';

const database = process.env.BSI_D1_DATABASE_ID;
if (!database) {
  console.error('Missing BSI_D1_DATABASE_ID env var.');
  process.exit(1);
}

try {
  execSync(`wrangler d1 migrations apply bsi-intel --database-id ${database}`, {
    stdio: 'inherit'
  });
} catch (error) {
  console.error('Failed to run migrations', error);
  process.exit(1);
}
