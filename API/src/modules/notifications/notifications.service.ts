import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  resolvePagination,
  toPaginatedResult,
} from '../../common/utils/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import type { RequestUser } from '../auth/auth.types';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';

export interface CreateNotificationInput {
  organizationId: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  entityType?: string;
  entityId?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async list(user: RequestUser, query: ListNotificationsQueryDto) {
    const { page, limit, skip, take } = resolvePagination(
      query.page,
      query.limit,
    );
    const where = {
      organizationId: user.organizationId,
      userId: user.id,
      ...(query.unreadOnly ? { isRead: false } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return toPaginatedResult(
      items.map((row) => ({
        id: row.id,
        type: row.type,
        title: row.title,
        body: row.body,
        entityType: row.entityType,
        entityId: row.entityId,
        isRead: row.isRead,
        createdAt: row.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
    );
  }

  async unreadCount(user: RequestUser) {
    const count = await this.prisma.notification.count({
      where: {
        organizationId: user.organizationId,
        userId: user.id,
        isRead: false,
      },
    });
    return { count };
  }

  async markRead(user: RequestUser, id: string) {
    const row = await this.prisma.notification.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
        userId: user.id,
      },
    });
    if (!row) {
      throw new NotFoundException('Notification not found');
    }
    await this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    return { id, isRead: true };
  }

  async markAllRead(user: RequestUser) {
    const result = await this.prisma.notification.updateMany({
      where: {
        organizationId: user.organizationId,
        userId: user.id,
        isRead: false,
      },
      data: { isRead: true },
    });
    return { updated: result.count };
  }

  async registerDevice(user: RequestUser, expoPushToken: string) {
    await this.prisma.user.update({
      where: { id: user.id },
      data: { expoPushToken },
    });
    return { registered: true };
  }

  async create(input: CreateNotificationInput) {
    const notification = await this.prisma.notification.create({
      data: {
        organization: { connect: { id: input.organizationId } },
        user: { connect: { id: input.userId } },
        type: input.type,
        title: input.title,
        body: input.body,
        entityType: input.entityType,
        entityId: input.entityId,
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: input.userId },
      select: { expoPushToken: true },
    });
    if (user?.expoPushToken) {
      void this.sendExpoPush(user.expoPushToken, input.title, input.body);
    }

    return notification;
  }

  private async sendExpoPush(token: string, title: string, body: string) {
    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          to: token,
          title,
          body,
          sound: 'default',
        }),
      });
      if (!response.ok) {
        this.logger.warn(`Expo push failed: ${response.status}`);
      }
    } catch (error) {
      this.logger.warn(
        `Expo push error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
