/**
 * Loads .env, builds DATABASE_URL from DB_* vars, runs Prisma CLI.
 * Usage: node scripts/with-database-url.cjs db push
 */
const path = require('path');
const { spawnSync } = require('child_process');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

function buildDatabaseUrl() {
  if (process.env.DATABASE_URL?.trim()) {
    return process.env.DATABASE_URL;
  }

  const keys = ['DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_PORT', 'DB_NAME'];
  const missing = keys.filter((k) => !process.env[k]?.trim());
  if (missing.length) {
    console.error(`Missing env: ${missing.join(', ')}`);
    process.exit(1);
  }

  const user = encodeURIComponent(process.env.DB_USER);
  const password = encodeURIComponent(process.env.DB_PASSWORD);
  return `postgresql://${user}:${password}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?schema=public`;
}

process.env.DATABASE_URL = buildDatabaseUrl();

const prismaArgs = process.argv.slice(2);
if (prismaArgs.length === 0) {
  console.error('Usage: node scripts/with-database-url.cjs <prisma-command> [args...]');
  process.exit(1);
}

const result = spawnSync('npx', ['prisma', ...prismaArgs], {
  stdio: 'inherit',
  env: process.env,
  shell: true,
  cwd: path.resolve(__dirname, '..'),
});

process.exit(result.status ?? 1);
