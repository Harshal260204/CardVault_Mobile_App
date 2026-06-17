import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CaptureMode, type Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { basename, extname, join } from 'path';
import { orgUploadDir } from '../../config/upload';
import { AuditService } from '../../common/services/audit.service';
import {
  resolvePagination,
  toPaginatedResult,
} from '../../common/utils/pagination';
import {
  DuplicateContactDetectedException,
  SessionClosedException,
} from '../../common/exceptions/domain.exceptions';
import { JobQueueService } from '../../queue/job-queue.service';
import { StorageService } from '../../storage/storage.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { RequestUser } from '../auth/auth.types';
import {
  buildContactCreateData,
  toContactDto,
} from '../contacts/contacts.mapper';
import { detectStrongContactDuplicate } from '../contacts/contact-duplicate.util';
import { ConfirmOcrDto } from './dto/confirm-ocr.dto';
import { ListOcrQueryDto } from './dto/list-ocr-query.dto';
import { SubmitOcrDto } from './dto/submit-ocr.dto';
import { toOcrJobDto, type OcrJobDto } from './ocr.mapper';
import { OcrProcessorService } from './ocr-processor.service';
import { NotificationsService } from '../notifications/notifications.service';

const REVIEW_THRESHOLD = 0.85;

@Injectable()
export class OcrService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly processor: OcrProcessorService,
    private readonly audit: AuditService,
    private readonly storage: StorageService,
    private readonly jobQueue: JobQueueService,
    private readonly notifications: NotificationsService,
  ) {}

  async submit(
    user: RequestUser,
    file: Express.Multer.File,
    dto: SubmitOcrDto,
  ): Promise<OcrJobDto> {
    if (!file?.buffer?.length && !file?.path) {
      throw new BadRequestException('Image file is required');
    }

    const existing = await this.prisma.ocrJob.findUnique({
      where: { clientIdempotencyKey: dto.clientIdempotencyKey },
    });
    if (existing) {
      return this.getById(user, existing.id);
    }

    if (dto.sessionId) {
      const session = await this.prisma.eventSession.findFirst({
        where: {
          id: dto.sessionId,
          organizationId: user.organizationId,
          deletedAt: null,
        },
      });
      if (!session) {
        throw new NotFoundException('Event session not found');
      }
      if (session.status === 'closed' || session.status === 'archived') {
        throw new SessionClosedException();
      }
    }

    const ext = extname(file.originalname) || '.jpg';
    const filename = `${randomUUID()}${ext}`;

    const buffer = file.buffer;
    if (!buffer?.length) {
      throw new BadRequestException('Empty image file');
    }

    const uploaded = await this.storage.upload({
      organizationId: user.organizationId,
      sessionId: dto.sessionId,
      filename,
      buffer,
      contentType: file.mimetype || 'image/jpeg',
    });
    const storagePath = uploaded.storagePath;
    if (!uploaded.absolutePath) {
      throw new BadRequestException(
        'Server-side OCR requires STORAGE_DRIVER=local or a temp file from storage',
      );
    }
    const absolutePath = uploaded.absolutePath;

    const cardImage = await this.prisma.cardImage.create({
      data: {
        organization: { connect: { id: user.organizationId } },
        uploadedBy: { connect: { id: user.id } },
        storagePath,
        fileSizeBytes: buffer.length,
        mimeType: file.mimetype || 'image/jpeg',
        status: 'pending',
      },
    });

    const job = await this.prisma.ocrJob.create({
      data: {
        organization: { connect: { id: user.organizationId } },
        cardImage: { connect: { id: cardImage.id } },
        submittedBy: { connect: { id: user.id } },
        session: dto.sessionId ? { connect: { id: dto.sessionId } } : undefined,
        captureMode: dto.captureMode,
        clientIdempotencyKey: dto.clientIdempotencyKey,
        status: 'pending',
      },
    });

    await this.audit.logForUser(user, {
      eventType: 'ocr.submitted',
      entityType: 'ocr_job',
      entityId: job.id,
    });

    const processPath = uploaded.absolutePath ?? absolutePath;
    const queued = await this.jobQueue.enqueueOcr({
      jobId: job.id,
      filePath: processPath,
      originalName: file.originalname,
    });
    if (!queued) {
      this.processor.schedule(job.id, processPath, file.originalname);
    }

    return this.getById(user, job.id);
  }

  async reprocess(user: RequestUser, jobId: string): Promise<OcrJobDto> {
    const job = await this.prisma.ocrJob.findFirst({
      where: { id: jobId, organizationId: user.organizationId },
      include: { cardImage: true },
    });
    if (!job) {
      throw new NotFoundException('OCR job not found');
    }
    await this.prisma.ocrJob.update({
      where: { id: jobId },
      data: {
        status: 'pending',
        errorMessage: null,
        retryCount: { increment: 1 },
      },
    });
    const processPath = join(
      orgUploadDir(job.organizationId),
      basename(job.cardImage.storagePath),
    );
    const queued = await this.jobQueue.enqueueOcr({
      jobId,
      filePath: processPath,
      originalName: 'card.jpg',
    });
    if (!queued) {
      this.processor.schedule(jobId, processPath, 'card.jpg');
    }
    return this.getById(user, jobId);
  }

  async list(user: RequestUser, query: ListOcrQueryDto) {
    const { page, limit, skip, take } = resolvePagination(
      query.page,
      query.limit,
    );
    const where: Prisma.OcrJobWhereInput = {
      organizationId: user.organizationId,
    };

    if (query.status) {
      where.status = query.status;
    }
    if (query.needsReview) {
      where.OR = [
        { status: 'manual_fallback' },
        { meanConfidence: { lt: REVIEW_THRESHOLD } },
        { status: 'completed', meanConfidence: { lt: REVIEW_THRESHOLD } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.ocrJob.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.ocrJob.count({ where }),
    ]);

    const enriched = await Promise.all(items.map((job) => this.enrichJob(job)));

    return toPaginatedResult(enriched, total, page, limit);
  }

  async getById(user: RequestUser, id: string): Promise<OcrJobDto> {
    const job = await this.prisma.ocrJob.findFirst({
      where: { id, organizationId: user.organizationId },
    });
    if (!job) {
      throw new NotFoundException('OCR job not found');
    }
    return this.enrichJob(job);
  }

  async confirm(user: RequestUser, jobId: string, dto: ConfirmOcrDto) {
    const job = await this.prisma.ocrJob.findFirst({
      where: { id: jobId, organizationId: user.organizationId },
    });
    if (!job) {
      throw new NotFoundException('OCR job not found');
    }
    if (!['completed', 'manual_fallback'].includes(job.status)) {
      throw new BadRequestException('OCR job is not ready for confirmation');
    }

    const matches = await this.prisma.relationshipMatch.findMany({
      where: { incomingOcrJobId: jobId },
    });

    let contactId = job.contactId;

    if (dto.duplicateAction === 'link' && dto.linkToContactId) {
      const target = await this.prisma.contact.findFirst({
        where: {
          id: dto.linkToContactId,
          organizationId: user.organizationId,
          deletedAt: null,
        },
      });
      if (!target) {
        throw new NotFoundException('Contact to link not found');
      }

      await this.prisma.contact.update({
        where: { id: target.id },
        data: {
          emails: dto.emails?.length
            ? [...new Set([...target.emails, ...dto.emails])]
            : target.emails,
          phones: dto.phones?.length
            ? [...new Set([...target.phones, ...dto.phones])]
            : target.phones,
          ocrConfidence: job.meanConfidence,
          encounterType: dto.encounterType ?? target.encounterType,
          cardImage: { connect: { id: job.cardImageId } },
        },
      });

      await this.createEncounter(user, target.id, job, dto.encounterType);
      contactId = target.id;

      await this.prisma.relationshipMatch.updateMany({
        where: { incomingOcrJobId: jobId, matchedContactId: target.id },
        data: {
          userDecision: 'link',
          decidedById: user.id,
          decidedAt: new Date(),
        },
      });
    } else {
      const duplicate = await this.findStrongDuplicate(user, {
        fullName: dto.fullName,
        company: dto.company,
        emails: dto.emails,
        phones: dto.phones,
      });
      if (duplicate) {
        throw new DuplicateContactDetectedException(
          `Possible duplicate found: ${duplicate.fullName}${duplicate.company ? ` at ${duplicate.company}` : ''}. Link to the existing contact instead of creating a new one.`,
        );
      }

      const created = await this.prisma.contact.create({
        data: {
          ...buildContactCreateData(
            {
              fullName: dto.fullName,
              company: dto.company,
              title: dto.title,
              emails: dto.emails,
              phones: dto.phones,
              captureMode: (job.captureMode as CaptureMode) ?? 'legacy',
              eventSessionId: job.sessionId ?? undefined,
              encounterType: dto.encounterType,
              leadQualifier: dto.leadQualifier,
            },
            user.organizationId,
            user.id,
          ),
          ocrConfidence: job.meanConfidence ?? undefined,
          cardImage: { connect: { id: job.cardImageId } },
        },
      });
      contactId = created.id;
      await this.createEncounter(user, created.id, job, dto.encounterType);

      if (matches.length) {
        await this.prisma.relationshipMatch.updateMany({
          where: { incomingOcrJobId: jobId },
          data: {
            userDecision: 'new',
            decidedById: user.id,
            decidedAt: new Date(),
          },
        });
      }
    }

    await this.prisma.ocrJob.update({
      where: { id: jobId },
      data: { contactId, status: 'completed' },
    });

    await this.prisma.cardImage.update({
      where: { id: job.cardImageId },
      data: { contactId, status: 'confirmed' },
    });

    if (job.sessionId) {
      await this.bumpSessionCounts(job.sessionId, dto.leadQualifier);
    }

    await this.audit.logForUser(user, {
      eventType: 'ocr.confirmed',
      entityType: 'ocr_job',
      entityId: jobId,
      eventData: { contactId },
    });

    const contact = await this.prisma.contact.findUnique({
      where: { id: contactId! },
    });

    void this.notifications.create({
      organizationId: user.organizationId,
      userId: user.id,
      type: 'ocr.confirmed',
      title: 'Contact saved',
      body: `${dto.fullName} was added from your card scan.`,
      entityType: 'contact',
      entityId: contactId!,
    });

    return {
      job: await this.getById(user, jobId),
      contact: toContactDto(contact!),
    };
  }

  private async enrichJob(
    job: Prisma.OcrJobGetPayload<object>,
  ): Promise<OcrJobDto> {
    const matches = await this.prisma.relationshipMatch.findMany({
      where: { incomingOcrJobId: job.id },
    });
    const contactIds = matches.map((m) => m.matchedContactId);
    const contacts = contactIds.length
      ? await this.prisma.contact.findMany({
          where: { id: { in: contactIds } },
          select: { id: true, fullName: true, company: true },
        })
      : [];
    const contactMap = new Map(contacts.map((c) => [c.id, c]));

    return toOcrJobDto({
      ...job,
      matches: matches.map((m) => ({
        ...m,
        matchedContact: contactMap.get(m.matchedContactId) ?? null,
      })),
    });
  }

  private async createEncounter(
    user: RequestUser,
    contactId: string,
    job: {
      id: string;
      organizationId: string;
      sessionId: string | null;
      captureMode: CaptureMode | null;
      cardImageId: string;
    },
    encounterType?: string,
  ): Promise<void> {
    await this.prisma.contactEncounter.create({
      data: {
        contact: { connect: { id: contactId } },
        organization: { connect: { id: job.organizationId } },
        capturedBy: { connect: { id: user.id } },
        session: job.sessionId ? { connect: { id: job.sessionId } } : undefined,
        captureMode: job.captureMode ?? 'legacy',
        encounterType: encounterType ?? null,
        cardImage: { connect: { id: job.cardImageId } },
        ocrJob: { connect: { id: job.id } },
      },
    });
  }

  private async bumpSessionCounts(
    sessionId: string,
    lead?: string | null,
  ): Promise<void> {
    const data: Prisma.EventSessionUpdateInput = {
      scanCount: { increment: 1 },
    };
    if (lead === 'hot') data.hotCount = { increment: 1 };
    if (lead === 'warm') data.warmCount = { increment: 1 };
    if (lead === 'cold') data.coldCount = { increment: 1 };
    await this.prisma.eventSession.update({ where: { id: sessionId }, data });
  }

  private async findStrongDuplicate(
    user: RequestUser,
    input: {
      fullName?: string;
      company?: string;
      emails?: string[];
      phones?: string[];
    },
  ) {
    const or: Prisma.ContactWhereInput[] = [];
    const normalizedEmails =
      input.emails
        ?.map((value) => value.trim().toLowerCase())
        .filter(Boolean) ?? [];
    const normalizedPhones =
      input.phones
        ?.map((value) => value.replace(/[^\d]/g, ''))
        .filter(Boolean) ?? [];

    if (normalizedEmails.length) {
      or.push({ emails: { hasSome: normalizedEmails } });
    }
    if (normalizedPhones.length) {
      or.push({ phones: { hasSome: normalizedPhones } });
    }
    if (input.fullName?.trim() && input.company?.trim()) {
      or.push({
        AND: [
          { fullName: { equals: input.fullName.trim(), mode: 'insensitive' } },
          { company: { equals: input.company.trim(), mode: 'insensitive' } },
        ],
      });
    }

    if (!or.length) {
      return null;
    }

    const candidates = await this.prisma.contact.findMany({
      where: {
        organizationId: user.organizationId,
        deletedAt: null,
        isMerged: false,
        OR: or,
      },
      take: 10,
    });

    return (
      candidates.find((candidate) =>
        detectStrongContactDuplicate(candidate, {
          fullName: input.fullName,
          company: input.company,
          emails: normalizedEmails,
          phones: normalizedPhones,
        }),
      ) ?? null
    );
  }
}
