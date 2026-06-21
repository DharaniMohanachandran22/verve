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

  // Enable CORS for the exact frontend origin configured via FRONTEND_URL.
  // Only that specific origin is allowed — no wildcard or preview URL matching.
  const allowedOrigin = process.env.FRONTEND_URL;
  if (!allowedOrigin) {
    throw new Error('FRONTEND_URL environment variable is not set');
  }
  app.enableCors({
    origin: allowedOrigin,
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
    .setTitle('Verve System API')
    .setDescription('REST API for ticket management system with role-based access control')
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
