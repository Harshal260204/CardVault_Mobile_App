import { PrismaClient } from '@prisma/client';
import * as request from 'supertest';

import { API_PREFIX, createTestApp } from './utils/create-test-app';

import type { INestApplication } from '@nestjs/common';

describe('Tenant Isolation (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  let tokenOrgAEmployee: string;
  let tokenOrgBEmployee: string;
  let tokenOrgBManager: string;
  let tokenPlatformAdmin: string;

  let orgAId: string;
  let orgBId: string;
  let contactAId: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = new PrismaClient();

    const orgA = await prisma.organization.findUniqueOrThrow({
      where: { slug: 'cardvault-demo' },
    });
    const orgB = await prisma.organization.findUniqueOrThrow({
      where: { slug: 'acme-demo' },
    });
    orgAId = orgA.id;
    orgBId = orgB.id;

    const contactA = await prisma.contact.findFirstOrThrow({
      where: { organizationId: orgAId },
    });
    await prisma.contact.findFirstOrThrow({
      where: { organizationId: orgBId },
    });
    contactAId = contactA.id;

    const login = async (email: string) => {
      const res = await request(app.getHttpServer())
        .post(`${API_PREFIX}/auth/login`)
        .send({ email, password: 'Password123!' })
        .expect(201);
      return res.body.data.tokens.accessToken as string;
    };

    tokenOrgAEmployee = await login('employee@cardvault.local');
    tokenOrgBEmployee = await login('employee@acme.local');
    tokenOrgBManager = await login('manager@acme.local');
    tokenPlatformAdmin = await login('admin@cardvault.local');
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('1. Read Isolation (GET /contacts/:id)', () => {
    it('should allow same-tenant employee to read their own tenant contact', async () => {
      await request(app.getHttpServer())
        .get(`${API_PREFIX}/contacts/${contactAId}`)
        .set('Authorization', `Bearer ${tokenOrgAEmployee}`)
        .expect(200);
    });

    it('should block cross-tenant employee from reading another tenant contact (returns 404)', async () => {
      await request(app.getHttpServer())
        .get(`${API_PREFIX}/contacts/${contactAId}`)
        .set('Authorization', `Bearer ${tokenOrgBEmployee}`)
        .expect(404);
    });
  });

  describe('2. Query Parameter / Routing Protection (TenantGuard)', () => {
    it('should reject non-platform user specifying another organizationId in query (returns 403)', async () => {
      const response = await request(app.getHttpServer())
        .get(`${API_PREFIX}/users?organizationId=${orgAId}`)
        .set('Authorization', `Bearer ${tokenOrgBManager}`)
        .expect(403);

      expect(response.body.error.message).toContain(
        'Cross-tenant access denied',
      );
    });

    it('should allow platform admin to query cross-tenant statistics/users (returns 200)', async () => {
      await request(app.getHttpServer())
        .get(`${API_PREFIX}/users?organizationId=${orgBId}`)
        .set('Authorization', `Bearer ${tokenPlatformAdmin}`)
        .expect(200);
    });
  });

  describe('3. Write Isolation & Creation Scope Safeguards', () => {
    it('should reject non-platform user trying to inject organizationId in body (returns 403)', async () => {
      const response = await request(app.getHttpServer())
        .post(`${API_PREFIX}/contacts`)
        .set('Authorization', `Bearer ${tokenOrgBEmployee}`)
        .send({
          fullName: 'Malicious Attacker',
          company: 'SaaS Hackers',
          organizationId: orgAId,
        })
        .expect(403);

      expect(response.body.error.message).toContain(
        'Cross-tenant access denied',
      );
    });

    it('should allow user to create contact in their own tenant', async () => {
      const response = await request(app.getHttpServer())
        .post(`${API_PREFIX}/contacts`)
        .set('Authorization', `Bearer ${tokenOrgBEmployee}`)
        .send({
          fullName: 'Valid Contact',
          company: 'Acme Partner',
        })
        .expect(201);

      expect(response.body.data.fullName).toBe('Valid Contact');

      const createdId = response.body.data.id as string;
      await prisma.contact.delete({ where: { id: createdId } });
    });
  });

  describe('4. Platform admin tenant bypass', () => {
    it('should allow platform admin to query users in another organization', async () => {
      const response = await request(app.getHttpServer())
        .get(`${API_PREFIX}/users?organizationId=${orgBId}`)
        .set('Authorization', `Bearer ${tokenPlatformAdmin}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      for (const row of response.body.data) {
        expect(row.organizationId).toBe(orgBId);
      }
    });

    it('should allow platform admin to list all organizations', async () => {
      const response = await request(app.getHttpServer())
        .get(`${API_PREFIX}/admin/organizations`)
        .set('Authorization', `Bearer ${tokenPlatformAdmin}`)
        .expect(200);

      const orgIds = response.body.data.map(
        (org: { id: string }) => org.id,
      ) as string[];
      expect(orgIds).toEqual(expect.arrayContaining([orgAId, orgBId]));
    });

    it('should not allow regular managers to trigger platform bypass on marked routes', async () => {
      await request(app.getHttpServer())
        .get(`${API_PREFIX}/users?organizationId=${orgAId}`)
        .set('Authorization', `Bearer ${tokenOrgBManager}`)
        .expect(403);

      await request(app.getHttpServer())
        .get(`${API_PREFIX}/admin/organizations`)
        .set('Authorization', `Bearer ${tokenOrgBManager}`)
        .expect(403);
    });
  });
});
