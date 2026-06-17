import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { CommonModule } from './common/common.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TenantContextInterceptor } from './common/interceptors/tenant-context.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { QueueModule } from './queue/queue.module';
import { RedisModule } from './redis/redis.module';
import { StorageModule } from './storage/storage.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { BillingModule } from './modules/billing/billing.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { EncountersModule } from './modules/encounters/encounters.module';
import { ImagesModule } from './modules/images/images.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { RequestLogMiddleware } from './common/middleware/request-log.middleware';
import { AuthModule } from './modules/auth/auth.module';
import { AuditEventsModule } from './modules/audit/audit.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ExportsModule } from './modules/exports/exports.module';
import { OcrModule } from './modules/ocr/ocr.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { UsersModule } from './modules/users/users.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    PrismaModule,
    RedisModule,
    QueueModule,
    StorageModule,
    CommonModule,
    AuthModule,
    HealthModule,
    OrganizationsModule,
    ContactsModule,
    EncountersModule,
    SessionsModule,
    UsersModule,
    DashboardModule,
    AnalyticsModule,
    AuditEventsModule,
    ExportsModule,
    OcrModule,
    ImagesModule,
    BillingModule,
    NotificationsModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantContextInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(CorrelationIdMiddleware, RequestLogMiddleware)
      .forRoutes('*');
  }
}
