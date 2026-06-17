import { OcrStatus } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListOcrQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(OcrStatus)
  status?: OcrStatus;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  needsReview?: boolean;
}
