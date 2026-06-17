import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export function getExportRoot(): string {
  const root = process.env.EXPORT_DIR?.trim() || join(process.cwd(), 'exports');
  if (!existsSync(root)) {
    mkdirSync(root, { recursive: true });
  }
  return root;
}

export function orgExportDir(organizationId: string): string {
  const dir = join(getExportRoot(), organizationId);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function getApiPublicBaseUrl(): string {
  const configured = process.env.API_PUBLIC_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }
  const port = process.env.PORT ?? '8000';
  return `http://localhost:${port}`;
}
