# 🚀 He'loo Platform - Quick Start Guide

## Running the Development Servers

You have **three options** to start the development servers:

---

### Option 1: Run Both Servers from Root (Recommended)

**Prerequisites:** Install root dependencies first:
```powershell
npm install
```

**Then run both servers simultaneously:**
```powershell
npm run dev
```

This will start both the client (port 3000) and server (port 5000) at the same time.

---

### Option 2: Run Servers Separately (Two Terminals)

**Terminal 1 - Client:**
```powershell
cd client
npm run dev
```

**Terminal 2 - Server:**
```powershell
cd server
npm run dev
```

---

### Option 3: Run Individual Servers from Root

**Just the client:**
```powershell
npm run dev:client
```

**Just the server:**
```powershell
npm run dev:server
```

---

## 📋 First-Time Setup Checklist

Before running for the first time:

- [x] Environment files created (`client/.env` and `server/.env`)
- [ ] Install root dependencies: `npm install`
- [ ] Install client dependencies: `cd client && npm install`
- [ ] Install server dependencies: `cd server && npm install`

**Or install all at once:**
```powershell
npm run install:all
```

---

## 🔍 Verify Everything Works

After starting the servers:

1. **Client:** http://localhost:3000
2. **Server Health:** http://localhost:5000/health
3. **Server API:** http://localhost:5000/api/v1

---

## 📝 Available Scripts

From the root directory:

| Command | Description |
|---------|-------------|
| `npm run dev` | Run both client and server |
| `npm run dev:client` | Run only the client |
| `npm run dev:server` | Run only the server |
| `npm run build` | Build both client and server |
| `npm run install:all` | Install all dependencies |

---

**Note:** If you see "concurrently not found", run `npm install` in the root directory first.

