import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { mkdir, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { orgUploadDir } from '../config/upload';
import { OrganizationQuotaExceededException } from '../common/exceptions/domain.exceptions';
import { PrismaService } from '../prisma/prisma.service';

export interface StorageUploadResult {
  storagePath: string;
  absolutePath?: string;
}

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private supabase: SupabaseClient | null = null;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    if (process.env.NODE_ENV === 'production' && this.driver === 'local') {
      throw new Error(
        'CRITICAL CONFIGURATION ERROR: Local storage driver is prohibited in production. ' +
        'You must set STORAGE_DRIVER=supabase, SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY.'
      );
    }
  }

  get driver(): 'supabase' | 'local' {
    return process.env.STORAGE_DRIVER === 'supabase' &&
      process.env.SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
      ? 'supabase'
      : 'local';
  }

  private getSupabase(): SupabaseClient {
    if (!this.supabase) {
      this.supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      );
    }
    return this.supabase;
  }

  async assertStorageQuota(
    fileSizeBytes: number,
  ): Promise<void> {
    // Storage quota logic removed for single tenant consumer app
    return;
  }

  buildPath(opts: {
    sessionId?: string | null;
    contactId?: string | null;
    filename: string;
  }): string {
    const parts = ['global'];
    if (opts.sessionId) {
      parts.push('sessions', opts.sessionId);
    }
    if (opts.contactId) {
      parts.push('contacts', opts.contactId);
    }
    parts.push(opts.filename);
    return parts.join('/');
  }

  async upload(opts: {
    sessionId?: string | null;
    contactId?: string | null;
    filename: string;
    buffer: Buffer;
    contentType: string;
  }): Promise<StorageUploadResult> {
    await this.assertStorageQuota(opts.buffer.length);
    const storagePath = this.buildPath(opts);

    if (this.driver === 'supabase') {
      const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? 'card-images';
      const { error } = await this.getSupabase()
        .storage.from(bucket)
        .upload(storagePath, opts.buffer, {
          contentType: opts.contentType,
          upsert: false,
        });
      if (error) {
        this.logger.error(`Supabase upload failed: ${error.message}`);
        throw error;
      }
      return { storagePath };
    }

    const dir = orgUploadDir();
    const absolutePath = join(dir, opts.filename);
    await mkdir(dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, opts.buffer);
    return { storagePath, absolutePath };
  }

  async getSignedUrl(
    storagePath: string,
    expiresInSeconds = 3600,
  ): Promise<string | null> {
    if (this.driver === 'supabase') {
      const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? 'card-images';
      const { data, error } = await this.getSupabase()
        .storage.from(bucket)
        .createSignedUrl(storagePath, expiresInSeconds);
      if (error) {
        this.logger.warn(`Signed URL failed: ${error.message}`);
        return null;
      }
      return data.signedUrl;
    }
    const base = process.env.API_PUBLIC_URL ?? 'http://localhost:8000';
    return `${base}/api/v1/images/file?path=${encodeURIComponent(storagePath)}`;
  }
}
