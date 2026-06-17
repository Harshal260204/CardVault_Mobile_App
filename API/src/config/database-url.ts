/**
 * Builds DATABASE_URL for Prisma from DB_* parts.
 * Set DATABASE_URL directly in .env to override.
 */

const DB_KEYS = [
  'DB_USER',
  'DB_PASSWORD',
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
] as const;

export function buildDatabaseUrl(): string {
  const missing = DB_KEYS.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(
      `Missing database env: ${missing.join(', ')}. Set PORT, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME in .env`,
    );
  }

  const user = encodeURIComponent(process.env.DB_USER!);
  const password = encodeURIComponent(process.env.DB_PASSWORD!);
  const host = process.env.DB_HOST!.trim();
  const port = process.env.DB_PORT!.trim();
  const name = process.env.DB_NAME!.trim();

  return `postgresql://${user}:${password}@${host}:${port}/${name}?schema=public`;
}

/** Sets process.env.DATABASE_URL before Prisma / NestJS connect. */
export function applyDatabaseUrlFromParts(): void {
  if (process.env.DATABASE_URL?.trim()) {
    return;
  }
  process.env.DATABASE_URL = buildDatabaseUrl();
}

/** HTTP server port (PORT in .env). */
export function getApiPort(): number {
  const raw = process.env.PORT ?? process.env.API_PORT ?? '4000';
  const port = Number.parseInt(raw, 10);
  if (Number.isNaN(port)) {
    throw new Error(`Invalid PORT: ${raw}`);
  }
  return port;
}
