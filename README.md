# He'loo Platform - Monorepo

A premium, high-performance social chat platform built with modern web technologies.

## 🏗️ Project Structure

```
heloo-platform/
├── client/          # React Frontend (Vite + TypeScript)
├── server/          # Node.js Backend (Express + Socket.io)
└── README.md
```

## 🚀 Tech Stack

### Frontend
- **React** with **TypeScript** (Vite)
- **Tailwind CSS** for styling
- **React Router DOM** for routing
- **Zustand** for state management
- **React Hook Form** + **Zod** for form validation
- **Supabase** for authentication and database
- **Socket.io Client** for real-time communication
- **Framer Motion** for animations
- **Lucide React** for icons

### Backend
- **Node.js** with **Express**
- **TypeScript**
- **Socket.io** for WebSocket connections
- **Supabase** (PostgreSQL + Auth + Realtime)
- **Helmet** for security
- **Morgan** for logging
- **CORS** enabled

## 📦 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase account (for database and auth)

### Installation

1. **Clone the repository**
   ```bash
   cd heloo-platform
   ```

2. **Install Client Dependencies**
   ```bash
   cd client
   npm install
   ```

3. **Install Server Dependencies**
   ```bash
   cd ../server
   npm install
   ```

### Environment Setup (Development)

See `SETUP_ENV.md` for full details. At minimum, create:

1. **Client Environment** (`client/.env`)
   ```env
   VITE_SUPABASE_URL=<your_supabase_project_url>
   VITE_SUPABASE_ANON_KEY=<your_supabase_anon_public_key>
   VITE_API_URL=http://localhost:5000
   ```

2. **Server Environment** (`server/.env`)
   ```env
   PORT=5000
   SUPABASE_URL=<your_supabase_project_url>
   SUPABASE_SERVICE_ROLE_KEY=<your_supabase_service_role_key>
   CLIENT_URL=http://localhost:3000
   NODE_ENV=development
   ```

### Running the Application

#### Development Mode

**Terminal 1 - Client:**
```bash
cd client
npm run dev
```
Client will run on `http://localhost:3000`

**Terminal 2 - Server:**
```bash
cd server
npm run dev
```
Server will run on `http://localhost:5000`

#### Production Build & Deployment

**Build artifacts**

- **Client:**
  ```bash
  cd client
  npm run build
  # Deploy contents of client/dist to your static hosting provider
  ```

- **Server:**
  ```bash
  cd server
  npm run build
  npm start   # or configure your process manager / hosting platform
  ```

**Production environment notes**

- In production, set:
  - `VITE_API_URL` to your deployed server URL (for example `https://api.yourdomain.com`)
  - `CLIENT_URL` (in `server/.env`) to your deployed frontend URL (for example `https://app.yourdomain.com`)
  - `NODE_ENV=production` on the server
- The server auto-confirm email endpoint is **disabled in production**; normal Supabase email confirmation flow will apply.

## 📁 Folder Structure

### Client (`/client/src`)
```
src/
├── components/     # Reusable UI components
│   ├── ui/        # Base UI components
│   ├── layout/    # Layout components
│   └── forms/     # Form components
├── pages/         # Page components
│   ├── auth/      # Login, Signup
│   ├── chat/      # Chat interface
│   └── profile/   # User profile
├── hooks/         # Custom React hooks
├── services/      # API service functions
├── store/         # Zustand stores
├── types/         # TypeScript interfaces
├── utils/         # Utility functions
└── lib/           # Third-party configurations
```

### Server (`/server/src`)
```
src/
└── index.ts       # Main server entry point
```

## 🎨 Features (Planned)

- ✅ Real-time messaging with Socket.io
- ✅ User authentication with Supabase
- ✅ Direct messages and group chats
- ✅ Online/offline status
- ✅ Message read receipts
- ✅ File and image sharing
- ✅ Premium UI with glassmorphism effects
- ✅ Responsive design for all devices

## 🛠️ Available Scripts

### Client
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Server
- `npm run dev` - Start development server with nodemon
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run compiled server

## 📝 License

MIT

---

**He'loo** - Where conversations come alive ✨
