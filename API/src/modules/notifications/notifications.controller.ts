import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../auth/auth.types';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  async list(
    @CurrentUser() user: RequestUser,
    @Query() query: ListNotificationsQueryDto,
  ) {
    const result = await this.notifications.list(user, query);
    return {
      data: result.items,
      meta: { page: result.page, limit: result.limit, total: result.total },
    };
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser() user: RequestUser) {
    return { data: await this.notifications.unreadCount(user) };
  }

  @Patch(':id/read')
  async markRead(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return { data: await this.notifications.markRead(user, id) };
  }

  @Post('read-all')
  async markAllRead(@CurrentUser() user: RequestUser) {
    return { data: await this.notifications.markAllRead(user) };
  }

  @Post('register-device')
  async registerDevice(
    @CurrentUser() user: RequestUser,
    @Body() dto: RegisterDeviceDto,
  ) {
    return {
      data: await this.notifications.registerDevice(user, dto.expoPushToken),
    };
  }
}
