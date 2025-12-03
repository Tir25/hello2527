# User Presence Implementation

This document describes the real-time user presence system implementation using Socket.io and Supabase.

## Overview

The presence system tracks when users are online/offline and displays their last seen time. When a user connects, they appear as "Active now" with a green indicator. When they disconnect, their `last_seen` timestamp is updated in Supabase and displayed to other users.

## Architecture

### Backend (Server)

**File: `server/src/index.ts`**

- Maintains a `Map<UserId, SocketId>` to track online users
- Uses Socket.io middleware to authenticate users via handshake (requires `userId` in `auth`)
- On connection:
  - Marks user as online in the map
  - Broadcasts `user_status` event with `{ userId, status: 'online' }` to all clients
- On disconnect:
  - Removes user from online map
  - Updates `last_seen` timestamp in Supabase `profiles` table
  - Broadcasts `user_status` event with `{ userId, status: 'offline', last_seen: timestamp }`

### Frontend

#### Socket Service

**File: `client/src/lib/services/socket.service.ts`**

- Manages Socket.io client connection
- Handles authentication via `auth: { userId }` in connection options
- Provides methods to:
  - `connect(userId)`: Connect to socket server
  - `disconnect()`: Disconnect from server
  - `onUserStatus(callback)`: Subscribe to user status events
  - `offUserStatus(callback)`: Unsubscribe from events

#### Presence Hook

**File: `client/src/hooks/usePresence.ts`**

- React hook that manages socket connection lifecycle
- Automatically connects when user ID is available
- Listens for `user_status` events and updates chatStore
- Cleans up on unmount

#### Chat Store

**File: `client/src/store/chatStore.ts`**

Added presence state:
- `onlineUsers: Set<string>` - Tracks online user IDs
- `userLastSeen: Map<string, string>` - Stores last_seen timestamps

Added actions:
- `setUserOnline(userId)`: Mark user as online, remove from lastSeen map
- `setUserOffline(userId, lastSeen?)`: Mark user as offline, store lastSeen
- `isUserOnline(userId)`: Check if user is online
- `getUserLastSeen(userId)`: Get user's last seen timestamp

#### UI Components

**File: `client/src/components/features/ChatHeader.tsx`**

- Displays online status:
  - If online: "Active now" (green text)
  - If offline: "Last seen [X] ago" (gray text) using `date-fns` formatting
  - Falls back to profile's `last_seen` if not in store

**File: `client/src/components/features/UserItem.tsx`**

- Shows green dot indicator on avatar when user is online
- Positioned absolutely at bottom-right of avatar

**File: `client/src/pages/chat/ChatLayout.tsx`**

- Integrates `usePresence` hook to initialize socket connection when chat page loads

## Database

The `profiles` table already includes:
- `last_seen: timestamp with time zone` - Automatically updated on disconnect

## Environment Variables

Ensure these are set:

**Server (`server/.env`):**
```
VITE_API_URL=http://localhost:5000
SUPABASE_URL=<your_supabase_url>
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
CLIENT_URL=http://localhost:3000
```

**Client (`client/.env`):**
```
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=<your_supabase_url>
VITE_SUPABASE_ANON_KEY=<your_anon_key>
```

## Testing

1. Start the server: `cd server && npm run dev`
2. Start the client: `cd client && npm run dev`
3. Open the app in two browser tabs/windows
4. Login with different users in each tab
5. You should see:
   - Green dot appears on the other user's avatar in the sidebar
   - "Active now" appears in the chat header when viewing their chat
6. Close one tab:
   - Green dot should disappear
   - "Last seen just now" should appear in the chat header

## Event Flow

1. **User Connects:**
   - Frontend calls `socketService.connect(userId)`
   - Socket.io connects with userId in auth handshake
   - Server validates and stores userId → socketId mapping
   - Server broadcasts `user_status: { userId, status: 'online' }` to all clients
   - Frontend receives event, calls `chatStore.setUserOnline(userId)`
   - UI updates: green dot appears, "Active now" shows

2. **User Disconnects:**
   - Socket.io detects disconnect
   - Server removes userId from online map
   - Server updates Supabase `profiles.last_seen = NOW()`
   - Server broadcasts `user_status: { userId, status: 'offline', last_seen: timestamp }`
   - Frontend receives event, calls `chatStore.setUserOffline(userId, lastSeen)`
   - UI updates: green dot disappears, "Last seen X ago" shows

## Notes

- The socket connection is established when the chat page loads
- Reconnection is handled automatically by Socket.io client
- Last seen times are formatted using `date-fns` for human-readable display
- The system gracefully falls back to profile's `last_seen` if socket data isn't available

