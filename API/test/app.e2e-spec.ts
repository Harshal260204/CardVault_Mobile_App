import * as request from 'supertest';

import { API_PREFIX, createTestApp } from './utils/create-test-app';

import type { INestApplication } from '@nestjs/common';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it(`${API_PREFIX}/health returns database status`, async () => {
    const response = await request(app.getHttpServer())
      .get(`${API_PREFIX}/health`)
      .expect(200);

    expect(response.body.data.services.database).toBe('up');
    expect(response.body.data.status).toMatch(/ok|degraded/);
  });
});
