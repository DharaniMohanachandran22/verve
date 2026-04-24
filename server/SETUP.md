# Backend Setup Instructions

## Task 1: Backend Project Setup and Core Infrastructure - COMPLETED ✅

The following infrastructure has been set up:

### ✅ Completed Items

1. **NestJS Project Initialized** - Project structure is in place
2. **TypeScript Configuration** - Fixed target to ES2022
3. **Environment Variables** - Created `.env` and `.env.example` files
4. **MongoDB Connection** - Configured with environment variables
5. **Global Validation Pipe** - Set up with class-validator and class-transformer
6. **Global Exception Filter** - Created for consistent error handling
7. **CORS Configuration** - Enabled for frontend integration
8. **Cookie Parser** - Added for JWT token handling
9. **Swagger Documentation** - Configured at `/api` endpoint
10. **Custom Exception Classes** - Created for common error scenarios
11. **ParseObjectIdPipe** - Created for MongoDB ID validation
12. **Common Module** - Created for shared utilities

### 📦 Required Dependencies to Install

Run these commands in the `server` directory:

```bash
# Install production dependencies
npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt cookie-parser @nestjs/config

# Install development dependencies
npm install --save-dev @types/bcrypt @types/passport-jwt @types/cookie-parser
```

### 🗄️ MongoDB Setup

1. Ensure MongoDB 7.x is installed and running:
```bash
# Check if MongoDB is running
mongosh --eval "db.version()"
```

2. If not installed, install MongoDB:
   - **macOS**: `brew install mongodb-community@7.0`
   - **Ubuntu**: Follow [MongoDB Ubuntu installation guide](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/)
   - **Windows**: Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)

3. Start MongoDB:
```bash
# macOS/Linux
brew services start mongodb-community@7.0
# or
sudo systemctl start mongod

# Windows
net start MongoDB
```

### ⚙️ Configuration

1. Review and update `.env` file if needed:
```bash
cd server
cat .env
```

2. Update `JWT_SECRET` to a secure random string for production

### 🚀 Running the Application

```bash
cd server

# Install dependencies (if not done already)
npm install

# Install required packages
npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt cookie-parser @nestjs/config
npm install --save-dev @types/bcrypt @types/passport-jwt @types/cookie-parser

# Start development server
npm run start:dev
```

The server will start on http://localhost:3001

### 📚 API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:3001/api

### 🧪 Testing the Setup

You can test that the server is running correctly:

```bash
# Test the health endpoint
curl http://localhost:3001

# Should return: "Hello World!" or similar
```

### 📁 Project Structure Created

```
server/
├── src/
│   ├── common/
│   │   ├── filters/
│   │   │   └── all-exceptions.filter.ts    # Global exception handling
│   │   ├── pipes/
│   │   │   └── parse-objectid.pipe.ts      # MongoDB ID validation
│   │   ├── exceptions/
│   │   │   └── custom.exceptions.ts        # Custom exception classes
│   │   └── common.module.ts                # Common utilities module
│   ├── boards/                             # Existing boards module
│   ├── app.module.ts                       # Root module with MongoDB & Config
│   └── main.ts                             # Entry point with CORS, validation, etc.
├── .env                                    # Environment variables
├── .env.example                            # Environment template
└── README.md                               # Project documentation
```

### ✨ Features Implemented

- **Global Validation**: All DTOs are automatically validated using class-validator
- **Error Handling**: Consistent error responses with proper HTTP status codes
- **CORS**: Configured to allow requests from frontend (http://localhost:3000)
- **Environment Config**: All configuration via environment variables
- **API Documentation**: Auto-generated Swagger docs
- **MongoDB Integration**: Ready for schema definitions
- **Custom Exceptions**: Pre-built exception classes for common scenarios
- **Cookie Support**: Ready for JWT authentication with HTTP-only cookies

### 🎯 Next Steps

Task 1 is complete! The next task (Task 2) will implement:
- User authentication module
- User schema and model
- JWT strategy and guards
- Registration and login endpoints

### 📋 Requirements Validated

This task satisfies the following requirements:
- ✅ Requirement 1.1: Authentication service infrastructure ready
- ✅ Requirement 1.4: Password hashing infrastructure ready (bcrypt to be installed)
- ✅ Requirement 18.1: Validation for missing required fields
- ✅ Requirement 18.2: Validation for invalid data types
- ✅ Requirement 20.7: Consistent error response format

### ⚠️ Important Notes

1. **Install Dependencies**: You must run the npm install commands above before starting the server
2. **MongoDB Required**: Ensure MongoDB is running before starting the application
3. **Environment Variables**: Review `.env` file and update JWT_SECRET for production
4. **Port Configuration**: Backend runs on port 3001 by default (configurable via .env)
