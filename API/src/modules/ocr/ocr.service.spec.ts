import { Test } from '@nestjs/testing';
import { Decimal } from '@prisma/client/runtime/library';

import { OcrProcessorService } from './ocr-processor.service';
import { OcrService } from './ocr.service';
import { AuditService } from '../../common/services/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JobQueueService } from '../../queue/job-queue.service';
import { StorageService } from '../../storage/storage.service';
import { NotificationsService } from '../notifications/notifications.service';

import type { RequestUser } from '../auth/auth.types';
import type { TestingModule } from '@nestjs/testing';

describe('OcrService', () => {
  let service: OcrService;

  const user: RequestUser = {
    id: 'user-1',
    email: 'employee@test.com',
    role: 'employee',
    jti: 'jti-1',
  };

  const baseJob = {
    id: 'job-1',
    contactId: null,
    cardImageId: 'card-1',
    sessionId: null,
    captureMode: 'quick_capture' as const,
    submittedById: 'user-1',
    status: 'completed' as const,
    rawText: 'Jane Doe',
    extractedFields: { fullName: 'Jane Doe', emails: ['jane@acme.com'] },
    confidenceScores: { fullName: 0.95 },
    meanConfidence: new Decimal('0.950'),
    ocrProvider: 'google',
    processingTimeMs: 120,
    retryCount: 0,
    errorMessage: null,
    clientIdempotencyKey: '00000000-0000-4000-8000-000000000001',
    processedAt: new Date('2026-06-01T12:00:00.000Z'),
    createdAt: new Date('2026-06-01T11:00:00.000Z'),
    updatedAt: new Date('2026-06-01T12:00:00.000Z'),
  };

  const mockPrisma = {
    ocrJob: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
    },
    relationshipMatch: {
      findMany: jest.fn(),
    },
    contact: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OcrService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: OcrProcessorService, useValue: {} },
        { provide: AuditService, useValue: { logForUser: jest.fn() } },
        { provide: StorageService, useValue: {} },
        { provide: JobQueueService, useValue: {} },
        { provide: NotificationsService, useValue: {} },
      ],
    }).compile();

    service = module.get(OcrService);
  });

  describe('list', () => {
    it('uses include on findMany and does not query matches/contacts separately', async () => {
      mockPrisma.ocrJob.findMany.mockResolvedValue([
        {
          ...baseJob,
          relationshipMatches: [],
        },
        {
          ...baseJob,
          id: 'job-2',
          relationshipMatches: [
            {
              id: 'match-1',
              incomingOcrJobId: 'job-2',
              matchedContactId: 'contact-1',
              matchConfidence: new Decimal('0.910'),
              matchSignals: { email: true },
              userDecision: null,
              decidedById: null,
              decidedAt: null,
              createdAt: new Date('2026-06-01T11:30:00.000Z'),
              matchedContact: {
                id: 'contact-1',
                fullName: 'John Smith',
                company: 'Acme Corp',
              },
            },
          ],
        },
        {
          ...baseJob,
          id: 'job-3',
          relationshipMatches: [
            {
              id: 'match-2',
              incomingOcrJobId: 'job-3',
              matchedContactId: 'missing-contact',
              matchConfidence: new Decimal('0.800'),
              matchSignals: {},
              userDecision: 'new',
              decidedById: 'user-1',
              decidedAt: new Date('2026-06-01T11:45:00.000Z'),
              createdAt: new Date('2026-06-01T11:40:00.000Z'),
              matchedContact: null,
            },
          ],
        },
      ]);
      mockPrisma.ocrJob.count.mockResolvedValue(3);

      const result = await service.list(user, {});

      expect(mockPrisma.ocrJob.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
          include: { cardImage: true },
        }),
      );
      expect(mockPrisma.relationshipMatch.findMany).not.toHaveBeenCalled();
      expect(mockPrisma.contact.findMany).not.toHaveBeenCalled();

      expect(result.total).toBe(3);
      expect(result.items).toHaveLength(3);

      expect(result.items[0].matches).toEqual([]);

      expect(result.items[1].matches).toEqual([
        expect.objectContaining({
          id: 'match-1',
          matchedContactId: 'contact-1',
          matchedContactName: 'John Smith',
          matchedContactCompany: 'Acme Corp',
          matchConfidence: 0.91,
          userDecision: null,
        }),
      ]);

      expect(result.items[2].matches).toEqual([
        expect.objectContaining({
          matchedContactId: 'missing-contact',
          matchedContactName: 'Unknown',
          matchedContactCompany: null,
          userDecision: 'new',
        }),
      ]);
    });

    it('preserves core job DTO fields from included rows', async () => {
      mockPrisma.ocrJob.findMany.mockResolvedValue([
        {
          ...baseJob,
          relationshipMatches: [],
        },
      ]);
      mockPrisma.ocrJob.count.mockResolvedValue(1);

      const result = await service.list(user, { page: 1, limit: 10 });

      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.items[0]).toEqual(
        expect.objectContaining({
          id: 'job-1',
          status: 'completed',
          primaryEmail: 'jane@acme.com',
          meanConfidence: 0.95,
          processedAt: '2026-06-01T12:00:00.000Z',
          createdAt: '2026-06-01T11:00:00.000Z',
          matches: [],
        }),
      );
    });
  });

  describe('getById', () => {
    it('loads matches via include and maps to the same DTO shape', async () => {
      mockPrisma.ocrJob.findFirst.mockResolvedValue({
        ...baseJob,
        relationshipMatches: [
          {
            id: 'match-1',
            incomingOcrJobId: 'job-1',
            matchedContactId: 'contact-1',
            matchConfidence: new Decimal('0.880'),
            matchSignals: { phone: true },
            userDecision: null,
            decidedById: null,
            decidedAt: null,
            createdAt: new Date('2026-06-01T11:30:00.000Z'),
            matchedContact: {
              id: 'contact-1',
              fullName: 'Jane Existing',
              company: null,
            },
          },
        ],
      });

      const job = await service.getById(user, 'job-1');

      expect(mockPrisma.ocrJob.findFirst).toHaveBeenCalledWith({
        include: { cardImage: true },
      });
      expect(mockPrisma.relationshipMatch.findMany).not.toHaveBeenCalled();
      expect(job.matches).toEqual([
        expect.objectContaining({
          matchedContactName: 'Jane Existing',
          matchedContactCompany: null,
          matchConfidence: 0.88,
        }),
      ]);
    });
  });
});
