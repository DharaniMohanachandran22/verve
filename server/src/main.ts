import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import dns from 'node:dns';

dns.setDefaultResultOrder('ipv4first');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend integration.
  // The origin function allows the configured FRONTEND_URL plus any Vercel preview
  // deployment for the same project, so all preview and production URLs work.
  const allowedOrigin = process.env.FRONTEND_URL || '';
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isConfigured = allowedOrigin && origin === allowedOrigin;
      const isVercelPreview = /^https:\/\/verve(-[a-z0-9]+-dharanimohanachandran22s-projects)?\.vercel\.app$/.test(origin);
      if (isConfigured || isVercelPreview) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Cookie parser for JWT tokens
  app.use(cookieParser());

  // Global prefix for all API routes
  app.setGlobalPrefix('api');

  // Global exception filter for consistent error handling
  app.useGlobalFilters(new AllExceptionsFilter());


  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('Trello Ticket System API')
    .setDescription('REST API for Trello-like ticket management system with role-based access control')
    .setVersion('1.0')
    .addCookieAuth('auth_token')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`API Documentation: http://localhost:${port}/api`);
}
bootstrap();
