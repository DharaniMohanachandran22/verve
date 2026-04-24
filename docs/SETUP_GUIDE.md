# Local Setup Guide

Follow these steps to set up the Verve development environment on your local machine.

## Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: v6.0 or higher (Local installation or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))

---

## 1. Clone the Repository
```bash
git clone https://github.com/DharaniMohanachandran22/verve.git
cd verve
```

## 2. Server Setup (Backend)

1.  **Navigate to the server directory**
    ```bash
    cd server
    ```
2.  **Install dependencies**
    ```bash
    npm install
    ```
3.  **Configure Environment Variables**
    Create a `.env` file in the `server` root and provide the following:
    ```env
    MONGODB_URI=mongodb://localhost:27017/verve
    JWT_SECRET=your_super_secret_jwt_key
    JWT_EXPIRES_IN=7d
    PORT=3001
    FRONTEND_URL=http://localhost:3000
    ```
4.  **Start the development server**
    ```bash
    npm run start:dev
    ```

## 3. Client Setup (Frontend)

1.  **Navigate to the client directory**
    ```bash
    cd ../client
    ```
2.  **Install dependencies**
    ```bash
    npm install
    ```
3.  **Configure Environment Variables**
    Create a `.env.local` file in the `client` root:
    ```env
    NEXT_PUBLIC_API_URL=http://localhost:3001
    ```
4.  **Start the development server**
    ```bash
    npm run dev
    ```

---

## 4. Verification
- Open your browser and navigate to `http://localhost:3000`.
- Verify that the login page loads correctly.
- Test the registration flow to ensure the database connection is active.

## Troubleshooting

### MongoDB Connection Issues
- Ensure the MongoDB service is running on your machine.
- Verify that the `MONGODB_URI` in the `.env` file matches your local setup.

### Port Conflicts
- If port `3000` or `3001` is already in use, you can change the `PORT` in the `.env` file and update the `NEXT_PUBLIC_API_URL` accordingly.
