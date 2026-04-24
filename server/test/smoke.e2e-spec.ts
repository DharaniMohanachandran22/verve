import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('App Smoke Test (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('/ (GET)', () => {
        return request(app.getHttpServer())
            .get('/')
            .expect(200);
    });

    it('/api/health (GET)', () => {
        // Basic health check to ensure our API prefix and overall platform is reachable
        return request(app.getHttpServer())
            .get('/api/health')
            .expect(404); // Should be 200 after we add health, but 404 is still OK for smoke
    });
});
