import { CaptureMode, LeadQualifier } from '@prisma/client';
import {
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateContactDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  fullName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  company?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  emails?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  phones?: string[];

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  linkedinUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(CaptureMode)
  captureMode?: CaptureMode;

  @IsOptional()
  @IsUUID()
  eventSessionId?: string;

  @IsOptional()
  @IsString()
  encounterType?: string;

  @IsOptional()
  @IsEnum(LeadQualifier)
  leadQualifier?: LeadQualifier;

  @IsOptional()
  @IsString()
  leadNote?: string;

  @IsOptional()
  @IsDateString()
  followUpDate?: string;
}
