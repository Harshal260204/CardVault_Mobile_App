import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(64)
  slug!: string;

  @IsOptional()
  @IsString()
  plan?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsers?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  storageQuotaGb?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsEmail()
  managerEmail!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  managerPassword!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  managerName?: string;
}
