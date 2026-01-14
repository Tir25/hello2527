import { Server } from 'socket.io';
import { SupabaseClient } from '@supabase/supabase-js';
// RegisterHandler type not generic enough, importing explicit handlers
import { registerRoomHandlers } from './handlers/roomHandler';
import { registerReactionHandlers } from './handlers/reactionHandler';
import { registerMessageHandlers } from './handlers/messageHandler';
import { registerTypingHandlers } from './handlers/typingHandler';

// Shared state
const onlineUsers = new Map<string, Set<string>>();

export const initializeSocketIO = (io: Server, supabaseAdmin: SupabaseClient) => {
    // Auth Middleware
    io.use((socket, next) => {
        const userId = socket.handshake.auth?.userId;
        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        if (!userId || !UUID_REGEX.test(userId)) {
            return next(new Error('Invalid or missing authentication'));
        }
        socket.data.userId = userId;
        next();
    });

    io.on('connection', async (socket) => {
        const userId = socket.data.userId!;
        console.log(`🔌 Connected: ${socket.id} (User: ${userId})`);

        // Connection Management
        if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
        const userSockets = onlineUsers.get(userId)!;
        const isFirstConnection = userSockets.size === 0;
        userSockets.add(socket.id);

        // Initial Data
        const onlineIds = Array.from(onlineUsers.keys()).filter(id => id !== userId);
        socket.emit('initial_online_users', { userIds: onlineIds });

        // Broadcast Status
        if (isFirstConnection) {
            socket.broadcast.emit('user_status', { userId, status: 'online' });
        }

        // Register Modular Handlers
        registerRoomHandlers(io, socket);
        registerReactionHandlers(io, socket);
        registerMessageHandlers(io, socket);
        const cleanupTyping = registerTypingHandlers(io, socket, onlineUsers, supabaseAdmin);

        // Handle Disconnect
        socket.on('disconnect', async () => {
            console.log(`🔌 Disconnected: ${socket.id} (User: ${userId})`);

            // Cleanup
            cleanupTyping();
            userSockets.delete(socket.id);

            if (userSockets.size === 0) {
                onlineUsers.delete(userId);

                // Update DB
                try {
                    await supabaseAdmin.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', userId);
                } catch (e) {
                    console.error('Failed to update last_seen', e);
                }

                io.emit('user_status', { userId, status: 'offline', last_seen: new Date().toISOString() });
            }
        });

        socket.on('request_online_users', () => {
            const onlineIds = Array.from(onlineUsers.keys()).filter(id => id !== userId);
            socket.emit('initial_online_users', { userIds: onlineIds });
        });
    });
};
