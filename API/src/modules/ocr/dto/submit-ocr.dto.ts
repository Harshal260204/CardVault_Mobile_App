import { CaptureMode } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class SubmitOcrDto {
  @IsEnum(CaptureMode)
  captureMode!: CaptureMode;

  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @IsUUID()
  clientIdempotencyKey!: string;
}
