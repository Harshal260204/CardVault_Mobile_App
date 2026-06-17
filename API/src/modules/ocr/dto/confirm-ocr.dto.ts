import { LeadQualifier } from '@prisma/client';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class ConfirmOcrDto {
  @IsString()
  @MinLength(1)
  fullName!: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
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
  @IsEnum(LeadQualifier)
  leadQualifier?: LeadQualifier;

  @IsOptional()
  @IsIn(['new', 'link'])
  duplicateAction?: 'new' | 'link';

  @IsOptional()
  @IsUUID()
  linkToContactId?: string;

  @IsOptional()
  @IsString()
  encounterType?: string;
}
