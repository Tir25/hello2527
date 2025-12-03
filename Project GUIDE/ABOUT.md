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
- **BaaS:** Supabase (Auth, Database, Storage)
- **Database:** PostgreSQL (via Supabase)
- **Auth:** Supabase Auth

---

## 2. DESIGN SYSTEM: "LIQUID GLASS"
The UI aims for a premium, sophisticated, and fluid feel.
- **Visuals:** Glassmorphism effects, gradients, and smooth transitions.
- **Glass Effect:** Custom `.glass-effect` utility using `backdrop-filter`.
- **Colors:** Custom primary palette configured in Tailwind.
- **Interaction:** Smooth transitions and responsive design.

---

## 3. PROJECT STRUCTURE
The project follows a Monorepo structure:

```text
/heloo-platform
  /client              # React Frontend
    /src
      /components      # UI, Layout, Forms
      /pages           # Auth, Chat, Profile
      /hooks           # Custom React Hooks
      /services        # API Services
      /store           # Zustand Stores
      /types           # TypeScript Interfaces
      /utils           # Helper Functions
      /lib             # Supabase Client
  
  /server              # Express Backend
    /src
      index.ts         # Server Entry Point
```

---

## 4. VARIATIONS FROM ORIGINAL PLAN
- **Framework:** Switched from Next.js 15 (App Router) to Vite + React 19 for better client-side performance and separate backend control.
- **Architecture:** Adopted a Monorepo approach with a dedicated Express/Socket.io server instead of relying solely on Serverless/Next.js API routes.
- **Realtime:** Implemented Socket.io as the primary real-time engine for chat to ensure high-performance, low-latency messaging independent of Supabase Realtime limits.
- **Styling:** Updated to Tailwind CSS v4 for future-proofing.