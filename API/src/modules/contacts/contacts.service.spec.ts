import { Test } from '@nestjs/testing';

import { ContactsService } from './contacts.service';
import { DuplicateContactDetectedException } from '../../common/exceptions/domain.exceptions';
import { AuditService } from '../../common/services/audit.service';
import { PrismaService } from '../../prisma/prisma.service';

import type { RequestUser } from '../auth/auth.types';
import type { TestingModule } from '@nestjs/testing';

describe('ContactsService', () => {
  let service: ContactsService;

  const user: RequestUser = {
    id: 'user-1',
    organizationId: 'org-1',
    role: 'employee',
    email: 'employee@test.com',
    jti: 'jti-1',
  };

  const mockPrisma = {
    contact: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    eventSession: {
      findFirst: jest.fn(),
    },
  };

  const mockAudit = {
    logForUser: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get(ContactsService);
  });

  it('throws DuplicateContactDetectedException when email matches an existing contact', async () => {
    mockPrisma.contact.findMany.mockResolvedValue([
      {
        id: 'contact-existing',
        fullName: 'Jane Smith',
        company: 'Acme',
        emails: ['jane@acme.com'],
        phones: [],
      },
    ]);

    await expect(
      service.create(user, {
        fullName: 'Jane Smith',
        emails: ['jane@acme.com'],
      }),
    ).rejects.toBeInstanceOf(DuplicateContactDetectedException);

    expect(mockPrisma.contact.create).not.toHaveBeenCalled();
  });

  it('creates a contact when no duplicate signals are found', async () => {
    mockPrisma.contact.findMany.mockResolvedValue([]);
    mockPrisma.contact.create.mockResolvedValue({
      id: 'contact-new',
      organizationId: user.organizationId,
      createdById: user.id,
      fullName: 'New Contact',
      company: null,
      title: null,
      emails: [],
      phones: [],
      website: null,
      address: null,
      linkedinUrl: null,
      notes: null,
      tags: [],
      captureMode: 'legacy',
      eventSessionId: null,
      encounterType: null,
      leadQualifier: null,
      leadNote: null,
      followUpDate: null,
      isMerged: false,
      mergedIntoId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    const result = await service.create(user, {
      fullName: 'New Contact',
    });

    expect(result.fullName).toBe('New Contact');
    expect(mockPrisma.contact.create).toHaveBeenCalledTimes(1);
    expect(mockAudit.logForUser).toHaveBeenCalledWith(
      user,
      expect.objectContaining({ eventType: 'contact.created' }),
    );
  });

  it('skips duplicate lookup when no email, phone, or name+company pair is provided', async () => {
    mockPrisma.contact.create.mockResolvedValue({
      id: 'contact-minimal',
      organizationId: user.organizationId,
      createdById: user.id,
      fullName: 'Single Name Only',
      company: null,
      title: null,
      emails: [],
      phones: [],
      website: null,
      address: null,
      linkedinUrl: null,
      notes: null,
      tags: [],
      captureMode: 'legacy',
      eventSessionId: null,
      encounterType: null,
      leadQualifier: null,
      leadNote: null,
      followUpDate: null,
      isMerged: false,
      mergedIntoId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    await service.create(user, { fullName: 'Single Name Only' });

    expect(mockPrisma.contact.findMany).not.toHaveBeenCalled();
    expect(mockPrisma.contact.create).toHaveBeenCalledTimes(1);
  });
});
