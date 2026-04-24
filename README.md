# Verve: A Modern Full-Stack Kanban Application

Verve is a high-performance, scalable Kanban application built for teams that demand efficiency and visual excellence. Inspired by tools like Trello, Verve offers a seamless experience for managing tasks, tracking progress, and collaborating in real-time.

---

## 🏗️ Project Architecture

Verve follows a modern distributed architecture, separating the concerns of presentation and business logic.

- **Frontend (`/client`)**: A dynamic, responsive React application built with Next.js 15 and styled with Tailwind CSS.
- **Backend (`/server`)**: A robust, modular REST API powered by NestJS and MongoDB.
- **Documentation (`/docs`)**: Technical guides and architectural decisions.

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/DharaniMohanachandran22/verve.git
    cd verve
    ```

2.  **Setup Backend**
    ```bash
    cd server
    npm install
    # Configure your .env file
    npm run start:dev
    ```

3.  **Setup Frontend**
    ```bash
    cd ../client
    npm install
    # Configure your .env.local file
    npm run dev
    ```

## 📖 Documentation

Detailed documentation is available in the [`docs/`](./docs) directory:

- [**Architecture Overview**](./docs/ARCHITECTURE.md): Deep dive into the tech stack and system design.
- [**API Specification**](./docs/API_SPECIFICATION.md): Detailed API endpoint documentation.
- [**Setup Guide**](./docs/SETUP_GUIDE.md): Comprehensive environment and local setup instructions.
- [**Development Workflow**](./docs/DEVELOPMENT_WORKFLOW.md): Git standards, code style, and contribution guide.
- [**Testing Strategy**](./docs/TESTING_STRATEGY.md): Unit and E2E testing procedures.

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Forms**: React Hook Form

### Backend
- **Framework**: NestJS 11
- **Database**: MongoDB with Mongoose
- **Auth**: Passport.js & JWT
- **Email**: Nodemailer

---

## 📄 License

This project is [UNLICENSED](./LICENSE).
