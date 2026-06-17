import { readFileSync } from 'fs';
import { resolve } from 'path';

export function useRs256(): boolean {
  return process.env.JWT_ALGORITHM === 'RS256';
}

export function accessSigningKey(): string {
  if (useRs256()) {
    const path = process.env.JWT_ACCESS_PRIVATE_KEY_PATH;
    if (path) {
      return readFileSync(resolve(path), 'utf8');
    }
    return process.env.JWT_ACCESS_PRIVATE_KEY ?? '';
  }
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_ACCESS_SECRET must be at least 32 characters');
  }
  return secret;
}

export function accessVerificationKey(): string {
  if (useRs256()) {
    const path = process.env.JWT_ACCESS_PUBLIC_KEY_PATH;
    if (path) {
      return readFileSync(resolve(path), 'utf8');
    }
    return process.env.JWT_ACCESS_PUBLIC_KEY ?? '';
  }
  return accessSigningKey();
}

export function refreshSigningKey(): string {
  if (useRs256()) {
    return process.env.JWT_REFRESH_PRIVATE_KEY ?? accessSigningKey();
  }
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_REFRESH_SECRET must be at least 32 characters');
  }
  return secret;
}

export function refreshVerificationKey(): string {
  if (useRs256()) {
    return process.env.JWT_REFRESH_PUBLIC_KEY ?? accessVerificationKey();
  }
  return refreshSigningKey();
}

export function jwtAlgorithm(): 'HS256' | 'RS256' {
  return useRs256() ? 'RS256' : 'HS256';
}
