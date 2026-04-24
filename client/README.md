# Verve Frontend (Client)

The frontend for Verve is a high-performance, responsive React application built with Next.js 15. It follows the App Router architecture and utilizes modern styling and state management patterns.

---

## 🛠️ Technology Stack
- **Framework**: [Next.js 15](https://nextjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: React Context API & Hooks
- **Forms**: [React Hook Form](https://react-hook-form.com/)

## 📁 Project Structure

```text
client/
├── app/              # App Router routes and pages
│   ├── (auth)/       # Authentication routes (Login, Register)
│   ├── dashboard/    # User dashboard
│   ├── boards/       # Kanban board workspaces
│   └── layout.tsx    # Root layout with providers
├── components/       # Reusable UI components
├── contexts/         # React Context providers (Auth, Notifications)
├── lib/              # API clients and utility functions
└── public/           # Static assets
```

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- npm v9+

### Installation
1.  Navigate to the `client` directory:
    ```bash
    cd client
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure Environment Variables:
    Create a `.env.local` file:
    ```env
    NEXT_PUBLIC_API_URL=http://localhost:3001
    ```
4.  Run the development server:
    ```bash
    npm run dev
    ```

## 📜 Available Scripts
- `npm run dev`: Starts the Next.js development server.
- `npm run build`: Compiles the application for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs ESLint to check for code quality issues.

---

## 📖 Global Documentation
For detailed system architecture and API specifications, see the [root documentation](../README.md).
