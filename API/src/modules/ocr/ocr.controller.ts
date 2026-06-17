import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Query,
  ParseUUIDPipe,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  RateLimit,
  RateLimitGuard,
} from '../../common/guards/rate-limit.guard';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../auth/auth.types';
import { ConfirmOcrDto } from './dto/confirm-ocr.dto';
import { ListOcrQueryDto } from './dto/list-ocr-query.dto';
import { SubmitOcrDto } from './dto/submit-ocr.dto';
import { OcrService } from './ocr.service';

@Controller('ocr')
@UseGuards(RateLimitGuard)
export class OcrController {
  private readonly logger = new Logger(OcrController.name);

  constructor(private readonly ocrService: OcrService) {}

  @Post('submit')
  @RateLimit({ keyPrefix: 'ocr:submit', limit: 30, windowSeconds: 60 })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async submitAlias(
    @CurrentUser() user: RequestUser,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: SubmitOcrDto,
    @Req() req: Request,
  ) {
    return this.submit(user, file, dto, req);
  }

  @Post('jobs')
  @RateLimit({ keyPrefix: 'ocr:submit', limit: 30, windowSeconds: 60 })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async submit(
    @CurrentUser() user: RequestUser,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: SubmitOcrDto,
    @Req() req: Request,
  ) {
    const correlationId = req.headers['x-correlation-id'];
    this.logger.log(
      `[ocr/jobs] upload userId=${user.id} captureMode=${dto.captureMode} ` +
        `file=${file?.originalname ?? 'missing'} size=${file?.size ?? 0} correlationId=${correlationId}`,
    );
    const job = await this.ocrService.submit(user, file, dto);
    this.logger.log(`[ocr/jobs] created jobId=${job.id} status=${job.status}`);
    return { data: job };
  }

  @Get('jobs')
  async list(
    @CurrentUser() user: RequestUser,
    @Query() query: ListOcrQueryDto,
  ) {
    const result = await this.ocrService.list(user, query);
    return {
      data: result.items,
      meta: { page: result.page, limit: result.limit, total: result.total },
    };
  }

  @Get('jobs/:id')
  async getOne(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const job = await this.ocrService.getById(user, id);
    return { data: job };
  }

  @Post('reprocess/:id')
  @Roles(
    UserRole.manager,
    UserRole.tenant_admin,
    UserRole.platform_super_admin,
    UserRole.platform_support,
  )
  async reprocess(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const job = await this.ocrService.reprocess(user, id);
    return { data: job };
  }

  @Post('jobs/:id/confirm')
  async confirm(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfirmOcrDto,
  ) {
    const result = await this.ocrService.confirm(user, id, dto);
    return { data: result };
  }
}
