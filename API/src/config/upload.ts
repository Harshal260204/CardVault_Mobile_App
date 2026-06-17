import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export function getUploadRoot(): string {
  const root = process.env.UPLOAD_DIR?.trim() || join(process.cwd(), 'uploads');
  if (!existsSync(root)) {
    mkdirSync(root, { recursive: true });
  }
  return root;
}

export function orgUploadDir(organizationId: string): string {
  const dir = join(getUploadRoot(), organizationId);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}
