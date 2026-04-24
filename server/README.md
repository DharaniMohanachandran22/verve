# Trello Ticket System - Backend

NestJS backend for a Trello-like ticket management system with MongoDB and JWT authentication.

## Prerequisites

- Node.js 18+ and npm
- MongoDB 7.x running locally or accessible via connection string
- Git

## Installation

1. Install dependencies:
```bash
npm install
```

2. Install additional required dependencies:
```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt cookie-parser @nestjs/config
npm install --save-dev @types/bcrypt @types/passport-jwt @types/cookie-parser
```

3. Copy the environment file and configure:
```bash
cp .env.example .env
```

Edit `.env` and update the values:
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: A secure random string for JWT signing
- `PORT`: Backend server port (default: 3001)
- `FRONTEND_URL`: Frontend URL for CORS (default: http://localhost:3000)

## Running the Application

### Development Mode
```bash
npm run start:dev
```

### Production Mode
```bash
npm run build
npm run start:prod
```

## API Documentation

Once the server is running, visit:
- API Docs: http://localhost:3001/api

## Project Structure

```
src/
├── common/              # Shared utilities
│   ├── filters/        # Exception filters
│   ├── pipes/          # Validation pipes
│   └── exceptions/     # Custom exceptions
├── auth/               # Authentication module (to be implemented)
├── users/              # Users module (to be implemented)
├── boards/             # Boards module
├── lists/              # Lists module (to be implemented)
├── cards/              # Cards module (to be implemented)
├── app.module.ts       # Root module
└── main.ts             # Application entry point
```

## Features

- ✅ NestJS 11.x with TypeScript
- ✅ MongoDB integration with Mongoose
- ✅ Global validation pipe with class-validator
- ✅ Global exception filter for consistent error handling
- ✅ CORS configuration for frontend integration
- ✅ Environment variable configuration
- ✅ Swagger/OpenAPI documentation
- ✅ Custom exception classes
- ✅ ObjectId validation pipe
- 🔄 JWT authentication (to be implemented)
- 🔄 Role-based access control (to be implemented)

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/trello |
| JWT_SECRET | Secret key for JWT signing | (required) |
| JWT_EXPIRES_IN | JWT token expiration | 7d |
| PORT | Server port | 3001 |
| FRONTEND_URL | Frontend URL for CORS | http://localhost:3000 |
| MAX_FILE_SIZE | Maximum file upload size in bytes | 10485760 (10MB) |
| UPLOAD_DIR | Directory for file uploads | ./uploads |

## Next Steps

1. Install the required dependencies listed above
2. Ensure MongoDB is running
3. Configure the `.env` file
4. Run `npm run start:dev` to start the development server
5. Visit http://localhost:3001/api to see the API documentation

## License

UNLICENSED
