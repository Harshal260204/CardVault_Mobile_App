import { CaptureMode } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListContactsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(CaptureMode)
  mode?: CaptureMode;

  @IsOptional()
  @IsUUID()
  sessionId?: string;
}
