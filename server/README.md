# Verve Backend (Server)

The backend for Verve is a robust, modular REST API built with NestJS 11. It provides secure authentication, real-time-like data management, and integration with MongoDB.

---

## 🛠️ Technology Stack
- **Framework**: [NestJS 11](https://nestjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Auth**: [Passport.js](https://www.passportjs.org/) & [JWT](https://jwt.io/)
- **Email**: [Nodemailer](https://nodemailer.com/)

## 📁 Project Structure

```text
server/
├── src/
│   ├── auth/           # JWT strategy and auth logic
│   ├── boards/         # Kanban board management
│   ├── lists/          # Vertical list modules
│   ├── cards/          # Task card logic
│   ├── mail/           # Email service integration
│   ├── notifications/  # User notification system
│   └── users/          # User profile and account logic
├── test/               # E2E and unit tests
└── uploads/            # Local storage for file uploads
```

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB instance (Local or Atlas)

### Installation
1.  Navigate to the `server` directory:
    ```bash
    cd server
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure Environment Variables:
    Create a `.env` file from `.env.example`:
    ```env
    MONGODB_URI=mongodb://localhost:27017/verve
    JWT_SECRET=your_secret_key
    PORT=3001
    ```
4.  Run the development server:
    ```bash
    npm run start:dev
    ```

## 📜 Available Scripts
- `npm run start:dev`: Starts the server in watch mode.
- `npm run build`: Compiles the application for production.
- `npm run test`: Runs unit tests.
- `npm run test:e2e`: Runs end-to-end tests.

---

## 📖 Global Documentation
For detailed system architecture and API specifications, see the [root documentation](../README.md).
