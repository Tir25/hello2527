# PROJECT: He'loo - Premium Social Messaging Platform
# ROLE: Senior Full-Stack Architect & UI/UX Designer

**OBJECTIVE:**
You are to build "He'loo," a next-generation real-time messaging application. This is not a clone; it is an evolution of the WhatsApp model with a focus on "Liquid Glass" aesthetics, seamless UX, and high-performance real-time capabilities.

---

## 1. TECH STACK (IMPLEMENTED)
**Architecture:** Monorepo (Client + Server)

**Frontend (Client):**
- **Build Tool:** Vite 7
- **Framework:** React 19
- **Language:** TypeScript (Strict Mode)
- **State Management:** Zustand
- **Forms:** React Hook Form + Zod (Validation)
- **Routing:** React Router DOM
- **HTTP Client:** Axios

**Styling & UI:**
- **CSS Framework:** Tailwind CSS v4 (using `@import "tailwindcss"`)
- **Animation:** Framer Motion
- **Icons:** Lucide-React
- **Utilities:** clsx, tailwind-merge
- **Font:** Inter
- **Theme:** Glassmorphism support with custom utilities

**Backend (Server):**
- **Runtime:** Node.js
- **Framework:** Express 5
- **Language:** TypeScript
- **Realtime:** Socket.io (Primary WebSocket layer)
- **Security:** Helmet, CORS
- **Logging:** Morgan

**Database & Services:**
- **BaaS:** Supabase (Auth, Database, Storage, Realtime)
- **Database:** PostgreSQL (via Supabase)
- **Auth:** Supabase Auth
- **Realtime:** Supabase Realtime + Socket.io hybrid

---

## 2. DESIGN SYSTEM: "LIQUID GLASS"
The UI aims for a premium, sophisticated, and fluid feel.
- **Visuals:** Glassmorphism effects, gradients, and smooth transitions.
- **Glass Effect:** Custom `.glass-effect` utility using `backdrop-filter`.
- **Colors:** Custom primary palette configured in Tailwind.
- **Interaction:** Smooth transitions and responsive design.
- **Dark Mode:** Full dark mode support with system preference detection.

---

## 3. IMPLEMENTED FEATURES

### Core Messaging
- ✅ Real-time messaging with Socket.io
- ✅ Message status (sent, delivered, seen)
- ✅ Typing indicators
- ✅ Message reactions
- ✅ Reply to messages
- ✅ Multimedia support (images, videos, documents)
- ✅ Voice messages
- ✅ Group messaging

### Stories Feature
- ✅ Story creation with camera/gallery
- ✅ Text overlays and stickers
- ✅ Story viewer with progress bars
- ✅ Close friends audience
- ✅ Story mentions
- ✅ **Realtime story updates** (INSERT/DELETE)
- ✅ Story expiration (24h)

### Social Features
- ✅ User profiles with avatars
- ✅ Username URLs (vanity URLs)
- ✅ Follow/Following system
- ✅ Connection requests
- ✅ Close friends management
- ✅ User search
- ✅ Online presence indicators

### Navigation
- ✅ Floating Navigation Orb (Siri-style)
- ✅ Sidebar with conversation list
- ✅ Activity/notifications page

---

## 4. PROJECT STRUCTURE
The project follows a Monorepo structure:

```text
/heloo-platform
  /client              # React Frontend
    /src
      /components      # UI, Layout, Forms, Chat, Stories
      /features        # Feature modules (profile, etc.)
      /pages           # Auth, Chat, Profile, Activity, Search
      /hooks           # Custom React Hooks + Realtime hooks
      /services        # API Services
      /store           # Zustand Stores (auth, chat, story, presence)
      /types           # TypeScript Interfaces
      /lib             # Supabase Client, Logger, Utils
  
  /server              # Express Backend
    /src
      index.ts         # Server Entry Point (Socket.io)

  /database            # SQL Migrations
    /migrations        # All database migration files

  /edge-functions      # Supabase Edge Functions
    /cleanup-media     # Auto-delete expired media

  /docs                # Documentation
```

---

## 5. VARIATIONS FROM ORIGINAL PLAN
- **Framework:** Switched from Next.js 15 (App Router) to Vite + React 19 for better client-side performance and separate backend control.
- **Architecture:** Adopted a Monorepo approach with a dedicated Express/Socket.io server instead of relying solely on Serverless/Next.js API routes.
- **Realtime:** Hybrid approach - Socket.io for chat + Supabase Realtime for stories/presence.
- **Styling:** Updated to Tailwind CSS v4 for future-proofing.
- **Stories:** Added Instagram-style stories feature with realtime updates.