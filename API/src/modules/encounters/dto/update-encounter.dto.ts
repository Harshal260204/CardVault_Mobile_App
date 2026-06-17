import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { LeadQualifier } from '@prisma/client';

export class UpdateEncounterDto {
  @IsOptional()
  @IsString()
  encounterType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  encounterLabel?: string;

  @IsOptional()
  @IsEnum(LeadQualifier)
  leadQualifier?: LeadQualifier;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  leadNote?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  followUpDate?: string;
}
