import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { DuplicateContactDetectedException } from '../../common/exceptions/domain.exceptions';
import { AuditService } from '../../common/services/audit.service';
import {
  resolvePagination,
  toPaginatedResult,
} from '../../common/utils/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import type { RequestUser } from '../auth/auth.types';
import {
  buildContactCreateData,
  toContactDto,
  type ContactDto,
} from './contacts.mapper';
import {
  detectStrongContactDuplicate,
  normalizeDuplicateEmails,
  normalizeDuplicatePhones,
} from './contact-duplicate.util';
import { CreateContactDto } from './dto/create-contact.dto';
import { ListContactsQueryDto } from './dto/list-contacts-query.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private orgWhere(user: RequestUser): Prisma.ContactWhereInput {
    return {
      organizationId: user.organizationId,
      deletedAt: null,
      isMerged: false,
    };
  }

  async search(user: RequestUser, q: string) {
    const term = q.trim();
    if (!term) {
      return [];
    }
    try {
      const rows = await this.prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM contacts
        WHERE organization_id = ${user.organizationId}::uuid
          AND deleted_at IS NULL
          AND is_merged = false
          AND to_tsvector(
            'english',
            coalesce(full_name, '') || ' ' ||
            coalesce(company, '') || ' ' ||
            coalesce(array_to_string(emails, ' '), '')
          ) @@ plainto_tsquery('english', ${term})
        LIMIT 50
      `;
      if (!rows.length) {
        return [];
      }
      const items = await this.prisma.contact.findMany({
        where: { id: { in: rows.map((r) => r.id) } },
      });
      return items.map(toContactDto);
    } catch {
      return this.list(user, {
        q: term,
        page: 1,
        limit: 50,
      } as ListContactsQueryDto).then((r) => r.items);
    }
  }

  async list(user: RequestUser, query: ListContactsQueryDto) {
    const { page, limit, skip, take } = resolvePagination(
      query.page,
      query.limit,
    );
    const where: Prisma.ContactWhereInput = this.orgWhere(user);

    if (query.mode) {
      where.captureMode = query.mode;
    }
    if (query.sessionId) {
      where.eventSessionId = query.sessionId;
    }
    if (query.q?.trim()) {
      const term = query.q.trim();
      where.OR = [
        { fullName: { contains: term, mode: 'insensitive' } },
        { company: { contains: term, mode: 'insensitive' } },
        { emails: { has: term } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: query.sortOrder ?? 'desc' },
      }),
      this.prisma.contact.count({ where }),
    ]);

    return toPaginatedResult(items.map(toContactDto), total, page, limit);
  }

  async getById(user: RequestUser, id: string): Promise<ContactDto> {
    const contact = await this.prisma.contact.findFirst({
      where: { ...this.orgWhere(user), id },
    });
    if (!contact) {
      throw new NotFoundException('Contact not found');
    }
    return toContactDto(contact);
  }

  async create(user: RequestUser, dto: CreateContactDto): Promise<ContactDto> {
    if (dto.eventSessionId) {
      await this.assertSessionInOrg(user, dto.eventSessionId);
    }
    await this.assertNoDuplicate(user, {
      fullName: dto.fullName,
      company: dto.company,
      emails: dto.emails,
      phones: dto.phones,
    });

    const contact = await this.prisma.contact.create({
      data: buildContactCreateData(dto, user.organizationId, user.id),
    });

    await this.audit.logForUser(user, {
      eventType: 'contact.created',
      entityType: 'contact',
      entityId: contact.id,
      eventData: { fullName: contact.fullName },
    });

    return toContactDto(contact);
  }

  async update(
    user: RequestUser,
    id: string,
    dto: UpdateContactDto,
  ): Promise<ContactDto> {
    const current = await this.prisma.contact.findFirst({
      where: { ...this.orgWhere(user), id },
    });
    if (!current) {
      throw new NotFoundException('Contact not found');
    }

    if (dto.eventSessionId) {
      await this.assertSessionInOrg(user, dto.eventSessionId);
    }
    if (
      dto.fullName !== undefined ||
      dto.company !== undefined ||
      dto.emails !== undefined ||
      dto.phones !== undefined
    ) {
      await this.assertNoDuplicate(
        user,
        {
          fullName: dto.fullName ?? current.fullName,
          company: dto.company !== undefined ? dto.company : current.company,
          emails: dto.emails ?? current.emails,
          phones: dto.phones ?? current.phones,
        },
        id,
      );
    }

    const data: Prisma.ContactUpdateInput = {};
    if (dto.fullName !== undefined) data.fullName = dto.fullName.trim();
    if (dto.company !== undefined) data.company = dto.company?.trim() || null;
    if (dto.title !== undefined) data.title = dto.title?.trim() || null;
    if (dto.emails !== undefined)
      data.emails = normalizeDuplicateEmails(dto.emails);
    if (dto.phones !== undefined)
      data.phones = normalizeDuplicatePhones(dto.phones);
    if (dto.website !== undefined) data.website = dto.website?.trim() || null;
    if (dto.address !== undefined) data.address = dto.address?.trim() || null;
    if (dto.linkedinUrl !== undefined) data.linkedinUrl = dto.linkedinUrl?.trim() || null;
    if (dto.notes !== undefined) data.notes = dto.notes?.trim() || null;
    if (dto.tags !== undefined) data.tags = dto.tags;
    if (dto.captureMode !== undefined) data.captureMode = dto.captureMode;
    if (dto.eventSessionId !== undefined) {
      data.eventSession = dto.eventSessionId
        ? { connect: { id: dto.eventSessionId } }
        : { disconnect: true };
    }
    if (dto.encounterType !== undefined) data.encounterType = dto.encounterType;
    if (dto.leadQualifier !== undefined) data.leadQualifier = dto.leadQualifier;
    if (dto.leadNote !== undefined) data.leadNote = dto.leadNote;
    if (dto.followUpDate !== undefined) {
      data.followUpDate = dto.followUpDate ? new Date(dto.followUpDate) : null;
    }

    const contact = await this.prisma.contact.update({
      where: { id },
      data,
    });

    await this.audit.logForUser(user, {
      eventType: 'contact.updated',
      entityType: 'contact',
      entityId: contact.id,
    });

    return toContactDto(contact);
  }

  async remove(
    user: RequestUser,
    id: string,
  ): Promise<{ id: string; deleted: true }> {
    await this.getById(user, id);
    await this.prisma.contact.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.audit.logForUser(user, {
      eventType: 'contact.deleted',
      entityType: 'contact',
      entityId: id,
    });

    return { id, deleted: true };
  }

  async merge(
    user: RequestUser,
    targetId: string,
    sourceContactId: string,
  ): Promise<ContactDto> {
    if (targetId === sourceContactId) {
      throw new BadRequestException('Cannot merge a contact into itself');
    }

    const [target, source] = await Promise.all([
      this.prisma.contact.findFirst({
        where: { ...this.orgWhere(user), id: targetId },
      }),
      this.prisma.contact.findFirst({
        where: { ...this.orgWhere(user), id: sourceContactId },
      }),
    ]);

    if (!target || !source) {
      throw new NotFoundException('Contact not found');
    }

    const merged = await this.prisma.$transaction(async (tx) => {
      await tx.contactMergeHistory.create({
        data: {
          organization: { connect: { id: user.organizationId } },
          sourceContactId: source.id,
          targetContactId: target.id,
          sourceSnapshot: source as object,
          mergedBy: { connect: { id: user.id } },
          mergeReason: 'duplicate_resolution',
        },
      });

      const updated = await tx.contact.update({
        where: { id: target.id },
        data: {
          emails: [...new Set([...target.emails, ...source.emails])],
          phones: [...new Set([...target.phones, ...source.phones])],
          tags: [...new Set([...target.tags, ...source.tags])],
          notes:
            [target.notes, source.notes].filter(Boolean).join('\n---\n') ||
            target.notes,
        },
      });

      await tx.contact.update({
        where: { id: source.id },
        data: {
          isMerged: true,
          mergedIntoId: target.id,
          deletedAt: new Date(),
        },
      });

      return updated;
    });

    await this.audit.logForUser(user, {
      eventType: 'contact.merged',
      entityType: 'contact',
      entityId: target.id,
      eventData: { sourceContactId: source.id },
    });

    return toContactDto(merged);
  }

  private async assertSessionInOrg(
    user: RequestUser,
    sessionId: string,
  ): Promise<void> {
    const session = await this.prisma.eventSession.findFirst({
      where: {
        id: sessionId,
        organizationId: user.organizationId,
        deletedAt: null,
      },
    });
    if (!session) {
      throw new NotFoundException('Event session not found');
    }
  }

  private async assertNoDuplicate(
    user: RequestUser,
    input: {
      fullName?: string | null;
      company?: string | null;
      emails?: string[];
      phones?: string[];
    },
    ignoreId?: string,
  ): Promise<void> {
    const normalizedEmails = normalizeDuplicateEmails(input.emails);
    const normalizedPhones = normalizeDuplicatePhones(input.phones);
    const trimmedFullName = input.fullName?.trim();
    const trimmedCompany = input.company?.trim();
    const or: Prisma.ContactWhereInput[] = [];

    if (normalizedEmails.length) {
      or.push({ emails: { hasSome: normalizedEmails } });
    }
    if (normalizedPhones.length) {
      or.push({ phones: { hasSome: normalizedPhones } });
    }
    if (trimmedFullName && trimmedCompany) {
      or.push({
        AND: [
          { fullName: { equals: trimmedFullName, mode: 'insensitive' } },
          { company: { equals: trimmedCompany, mode: 'insensitive' } },
        ],
      });
    }

    if (!or.length) {
      return;
    }

    const candidates = await this.prisma.contact.findMany({
      where: {
        ...this.orgWhere(user),
        id: ignoreId ? { not: ignoreId } : undefined,
        OR: or,
      },
      take: 10,
    });

    const duplicate = candidates.find((candidate) =>
      detectStrongContactDuplicate(candidate, {
        fullName: trimmedFullName,
        company: trimmedCompany,
        emails: normalizedEmails,
        phones: normalizedPhones,
      }),
    );

    if (!duplicate) {
      return;
    }

    const signal = detectStrongContactDuplicate(duplicate, {
      fullName: trimmedFullName,
      company: trimmedCompany,
      emails: normalizedEmails,
      phones: normalizedPhones,
    });

    if (signal?.type === 'email') {
      throw new DuplicateContactDetectedException(
        `A contact with email "${signal.value}" already exists as ${duplicate.fullName}.`,
      );
    }
    if (signal?.type === 'phone') {
      throw new DuplicateContactDetectedException(
        `A contact with phone "${signal.value}" already exists as ${duplicate.fullName}.`,
      );
    }

    throw new DuplicateContactDetectedException(
      `A contact named "${duplicate.fullName}" already exists for "${duplicate.company ?? 'this company'}".`,
    );
  }
}
